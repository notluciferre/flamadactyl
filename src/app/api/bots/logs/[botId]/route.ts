export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { getBotById, getBotLogs, clearBotLogs } from '@/lib/rtdb-admin';
import { verifyUser } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ botId: string }> }
) {
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
      console.error('[BOT LOGS GET] User verification failed:', authError);
      return NextResponse.json({ 
        error: authError || 'Unauthorized' 
      }, { status: 401 });
    }

    const { botId } = await context.params;

    // Get bot to verify ownership
    const { data: bot, error: botError } = await getBotById(botId);

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    if (bot.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden - you do not own this bot" }, { status: 403 });
    }

    // Get logs (last 200 entries for better history)
    const { data: logs, error } = await getBotLogs(botId, 200);

    if (error) {
      console.error('[BOT LOGS GET] Error fetching bot logs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[BOT LOGS GET] Success:', { bot_id: botId, count: logs?.length || 0 });

    return NextResponse.json({ 
      success: true, 
      logs: logs || [],
      count: logs?.length || 0,
    });
  } catch (error: any) {
    console.error('[BOT LOGS GET] Error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ botId: string }> }
) {
  try {
    // Verify user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { authenticated, userId, error: authError } = await verifyUser(token);
    if (!authenticated || !userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { botId } = await context.params;

    // Verify ownership
    const { data: bot, error: botError } = await getBotById(botId);

    if (botError || !bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (bot.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden - you do not own this bot' }, { status: 403 });
    }

    // Clear logs in RTDB
    const { error: clearError } = await clearBotLogs(botId);

    if (clearError) {
      console.error('[BOT LOGS DELETE] Error clearing logs:', clearError);
      return NextResponse.json({ error: clearError.message || 'Failed to clear logs' }, { status: 500 });
    }

    console.log('[BOT LOGS DELETE] Success:', { bot_id: botId, user_id: userId });

    return NextResponse.json({ 
      success: true, 
      message: 'Logs cleared',
      cleared_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[BOT LOGS DELETE] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
