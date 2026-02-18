export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { createBot, getBotsByUser, updateBot, createCommand } from '@/lib/rtdb-admin';
import { verifyUser } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    console.log('[CREATE BOT] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('[CREATE BOT] No authorization header');
      return NextResponse.json({ error: 'No authorization header provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user with retry logic
    const { authenticated, userId, email, error: authError } = await verifyUser(token);
    if (!authenticated || !userId) {
      console.error('[CREATE BOT] User verification failed:', authError);
      return NextResponse.json({ 
        error: authError || 'Authentication failed' 
      }, { status: 401 });
    }
    
    console.log('[CREATE BOT] User authenticated:', email);

    const body = await request.json();
    const { node_id, username, server_ip, server_port, auto_reconnect, offline_mode } = body;

    // Validate required fields
    if (!node_id || !username || !server_ip) {
      return NextResponse.json(
        { error: 'Missing required fields: node_id, username, server_ip' },
        { status: 400 }
      );
    }

    // Get user's existing bots to check for duplicates
    const { data: existingBots } = await getBotsByUser(userId);
    
    // Check if bot already exists with same credentials
    const duplicateBot = existingBots?.find((bot: any) => 
      bot.node_id === node_id &&
      bot.username === username &&
      bot.server_ip === server_ip
    );

    let bot;

    if (duplicateBot) {
      // Bot already exists, update it instead
      console.log('[CREATE BOT] Updating existing bot:', duplicateBot.id);
      const { data: updatedBot, error: updateError } = await updateBot(duplicateBot.id, {
        server_port: server_port || 19132,
        auto_reconnect: auto_reconnect !== false,
        enabled: true,
        status: 'stopped',
        offline_mode: offline_mode !== false,
        updated_at: Date.now(),
      });

      if (updateError) throw updateError;
      bot = updatedBot;
      console.log('[CREATE BOT] Updated existing bot:', duplicateBot.id);
    } else {
      // Create new bot record
      console.log('[CREATE BOT] Creating new bot for user:', userId);
      const { data: newBot, error: botError } = await createBot({
        user_id: userId,
        owner_email: email,
        node_id,
        username,
        server_ip,
        server_port: server_port || 19132,
        auto_reconnect: auto_reconnect !== false,
        enabled: true,
        status: 'stopped',
        offline_mode: offline_mode !== false,
        created_at: Date.now(),
        updated_at: Date.now(),
      });

      if (botError) throw botError;
      bot = newBot;
      console.log('[CREATE BOT] New bot created:', { bot_id: newBot.id, username, user_id: userId });
    }

    // Create command to start the bot
    console.log('[CREATE BOT] Creating command to start bot');
    const { data: command, error: cmdError } = await createCommand({
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
    });

    if (cmdError) throw cmdError;

    return NextResponse.json({
      success: true,
      bot,
      command,
      message: duplicateBot ? 'Bot updated and command sent' : 'Bot created successfully',
    });
  } catch (error: any) {
    console.error('[CREATE BOT] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create bot' },
      { status: 500 }
    );
  }
}
