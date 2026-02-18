export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getBotById, updateBot, createCommand } from '@/lib/rtdb-admin';
import { verifyUser } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user with retry logic
    const { authenticated, userId, error: authError } = await verifyUser(token);
    if (!authenticated || !userId) {
      console.error('[BOT COMMAND] User verification failed:', authError);
      return NextResponse.json({ 
        error: authError || 'Unauthorized' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { bot_id, action, command: execCommand } = body;

    // Validate required fields
    if (!bot_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: bot_id, action' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['start', 'stop', 'restart', 'exec', 'delete'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Get bot to verify ownership and get node_id
    const { data: bot, error: botError } = await getBotById(bot_id);

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (bot.user_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied - you do not own this bot' },
        { status: 403 }
      );
    }

    // Prepare command payload
    const payload: any = {};
    if (action === 'start' || action === 'restart') {
      // Include full bot data for start/restart
      payload.username = bot.username;
      payload.server_ip = bot.server_ip;
      payload.server_port = bot.server_port;
      payload.auto_reconnect = bot.auto_reconnect ?? true;
      payload.offline_mode = bot.offline_mode !== false;
    } else if (action === 'exec' && execCommand) {
      payload.command = execCommand;
    }

    // Create command in RTDB (node will pick it up)
    const { data: commandData, error: cmdError } = await createCommand({
      user_id: userId,
      node_id: bot.node_id,
      bot_id: bot_id,
      action,
      payload,
    });

    if (cmdError) throw cmdError;

    // Update bot status if starting/stopping
    if (action === 'start') {
      await updateBot(bot_id, { status: 'starting', updated_at: Date.now() });
    } else if (action === 'stop') {
      await updateBot(bot_id, { status: 'stopping', updated_at: Date.now() });
    }

    console.log('[BOT COMMAND] Success:', { bot_id, action, user_id: userId, command_id: commandData?.id });

    return NextResponse.json({
      success: true,
      message: `Bot ${action} command sent successfully`,
      command_id: commandData?.id,
    });
  } catch (error: any) {
    console.error('[BOT COMMAND] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute bot command' },
      { status: 500 }
    );
  }
}
