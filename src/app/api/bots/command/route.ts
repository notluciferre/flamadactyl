import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { initFirebase } from '@/lib/firebase';
import { sendBotCommand } from '@/lib/firebase-api';
import { verifyUser } from '@/lib/auth-helpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase for this request
    initFirebase();
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user with retry logic
    const { authenticated, userId, error: authError } = await verifyUser(token);
    if (!authenticated || !userId) {
      console.error('[Bot Command] User verification failed:', authError);
      return NextResponse.json({ 
        error: authError || 'Unauthorized' 
      }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

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
      .eq('user_id', userId)
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
      payload.offline_mode = bot.offline_mode !== false;
    } else if (action === 'exec' && execCommand) {
      payload.command = execCommand;
    }

    // Send command to Firebase (real-time to node server)
    await sendBotCommand(bot.node_id, action, bot.id, payload);

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
      message: `Bot ${action} command sent successfully`,
    });
  } catch (error: any) {
    console.error('Bot command error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute bot command' },
      { status: 500 }
    );
  }
}
