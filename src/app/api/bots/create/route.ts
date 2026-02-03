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
    const { node_id, username, server_ip, server_port, auto_reconnect, offline_mode } = body;

    // Validate required fields
    if (!node_id || !username || !server_ip) {
      return NextResponse.json(
        { error: 'Missing required fields: node_id, username, server_ip' },
        { status: 400 }
      );
    }

    // Check if bot already exists with same node_id, username, and server_ip
    const { data: existingBot } = await supabase
      .from('bots')
      .select('*')
      .eq('user_id', user.id)
      .eq('node_id', node_id)
      .eq('username', username)
      .eq('server_ip', server_ip)
      .single();

    let bot;

    if (existingBot) {
      // Bot already exists, update it instead
      const { data: updatedBot, error: updateError } = await supabase
        .from('bots')
        .update({
          server_port: server_port || 19132,
          auto_reconnect: auto_reconnect !== false,
          enabled: true,
          status: 'stopped',
          metadata: {
            offline_mode: offline_mode !== false,
          },
        })
        .eq('id', existingBot.id)
        .select()
        .single();

      if (updateError) throw updateError;
      bot = updatedBot;
    } else {
      // Create new bot record
      const { data: newBot, error: botError } = await supabase
        .from('bots')
        .insert({
          user_id: user.id,
          node_id,
          username,
          server_ip,
          server_port: server_port || 19132,
          auto_reconnect: auto_reconnect !== false,
          status: 'stopped',
          enabled: true,
          metadata: {
            offline_mode: offline_mode !== false,
          },
        })
        .select()
        .single();

      if (botError) throw botError;
      bot = newBot;
      console.log('[CREATE BOT] New bot created:', { bot_id: newBot.id, username, user_id: user.id });
    }

    // Create command to start the bot
    const { data: command, error: cmdError } = await supabase
      .from('commands')
      .insert({
        user_id: user.id,
        node_id,
        bot_id: bot.id,
        action: 'create',
        payload: {
          username,
          offline_mode: offline_mode !== false,
          server_ip,
          server_port: server_port || 19132,
          auto_reconnect: auto_reconnect !== false,
        },
      })
      .select()
      .single();

    if (cmdError) throw cmdError;

    return NextResponse.json({
      success: true,
      bot,
      command,
      message: existingBot ? 'Bot updated and starting' : 'Bot created successfully',
    });
  } catch (error: any) {
    console.error('Create bot error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create bot' },
      { status: 500 }
    );
  }
}
