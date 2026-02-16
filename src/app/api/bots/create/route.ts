import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyUser } from '@/lib/auth-helpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    console.log('[CREATE BOT API] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('[CREATE BOT API] No authorization header');
      return NextResponse.json({ error: 'No authorization header provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user with retry logic
    const { authenticated, userId, error: authError } = await verifyUser(token);
    if (!authenticated || !userId) {
      console.error('[CREATE BOT API] User verification failed:', authError);
      return NextResponse.json({ 
        error: authError || 'Authentication failed' 
      }, { status: 401 });
    }
    
    console.log('[CREATE BOT API] User authenticated:', userId);

    // Create service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      .eq('user_id', userId)
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
          offline_mode: offline_mode !== false,
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
          user_id: userId,
          node_id,
          username,
          server_ip,
          server_port: server_port || 19132,
          auto_reconnect: auto_reconnect !== false,
          status: 'stopped',
          enabled: true,
          offline_mode: offline_mode !== false,
          metadata: {
            offline_mode: offline_mode !== false,
          },
        })
        .select()
        .single();

      if (botError) throw botError;
      bot = newBot;
      console.log('[CREATE BOT] New bot created:', { bot_id: newBot.id, username, user_id: userId });
    }

    // Create command to start the bot
    const { data: command, error: cmdError } = await supabase
      .from('commands')
      .insert({
        user_id: userId,
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
