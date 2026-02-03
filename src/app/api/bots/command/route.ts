import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', bot_id)
      .eq('user_id', user.id)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found or access denied' },
        { status: 404 }
      );
    }

    // Prepare command payload
    const payload: any = {};
    if (action === 'start' || action === 'restart') {
      // Include full bot data for start/restart
      payload.username = bot.username;
      payload.server_ip = bot.server_ip;
      payload.server_port = bot.server_port;
      payload.auto_reconnect = bot.metadata?.auto_reconnect ?? true;
      payload.offline_mode = bot.metadata?.offline_mode ?? false;
    } else if (action === 'exec' && execCommand) {
      payload.command = execCommand;
    }

    // Create command
    const { data: command, error: cmdError } = await supabase
      .from('commands')
      .insert({
        user_id: user.id,
        node_id: bot.node_id,
        bot_id: bot.id,
        action,
        payload,
      })
      .select()
      .single();

    if (cmdError) throw cmdError;

    // Update bot status if starting/stopping
    if (action === 'start') {
      await supabase
        .from('bots')
        .update({ status: 'starting' })
        .eq('id', bot_id);
    } else if (action === 'stop') {
      await supabase
        .from('bots')
        .update({ status: 'stopping' })
        .eq('id', bot_id);
    }

    return NextResponse.json({
      success: true,
      command,
      message: `Bot ${action} command queued successfully`,
    });
  } catch (error: any) {
    console.error('Bot command error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute bot command' },
      { status: 500 }
    );
  }
}
