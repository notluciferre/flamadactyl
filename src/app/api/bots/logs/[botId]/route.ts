import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyUser } from "@/lib/auth-helpers";
import { clearBotLogs, markLogsCleared } from '@/lib/firebase-api';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
      console.error('[Bot Logs] User verification failed:', authError);
      return NextResponse.json({ 
        error: authError || 'Unauthorized' 
      }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { botId } = await context.params;

    // Get bot to verify ownership
    const { data: bot, error: botError } = await supabase
      .from("bots")
      .select("id, user_id")
      .eq("id", botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    if (bot.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get logs (last 200 entries for better history)
    const { data: logs, error } = await supabase
      .from("bot_logs")
      .select("*")
      .eq("bot_id", botId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Error fetching bot logs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reverse to show oldest first
    return NextResponse.json({ 
      success: true, 
      logs: logs.reverse(),
      count: logs.length,
    });
  } catch (error: any) {
    console.error("Error in bot logs API:", error);
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

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { botId } = await context.params;

    // Verify ownership
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id, user_id')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (bot.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete Supabase logs using service role to avoid RLS issues
    try {
      const { error: adminDelError } = await supabaseAdmin
        .from('bot_logs')
        .delete()
        .eq('bot_id', botId);

      if (adminDelError) {
        console.error('Error deleting bot_logs with service role:', adminDelError);
        return NextResponse.json({ error: adminDelError.message || 'Failed to delete logs' }, { status: 500 });
      }

      // Set tombstone on bots table so other processes can detect cleared logs
      const clearedAt = new Date().toISOString();
      const { error: markError } = await supabaseAdmin
        .from('bots')
        .update({ logs_cleared_at: clearedAt })
        .eq('id', botId);

      if (markError) {
        console.error('Failed to mark bot logs_cleared_at:', markError);
      }

      // Clear Firebase logs (real-time) and mark cleared timestamp
      try {
        await clearBotLogs(botId);
        try {
          await markLogsCleared(botId);
        } catch (err) {
          console.error('Error marking logs_cleared_at in Firebase:', err);
        }
      } catch (err) {
        console.error('Error clearing firebase bot logs:', err);
        // Not fatal — proceed
      }

      return NextResponse.json({ success: true, message: 'Logs cleared', cleared_at: clearedAt });
    } catch (err: any) {
      console.error('Error deleting bot logs (admin):', err);
      return NextResponse.json({ error: err?.message || 'Failed to delete logs' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error deleting bot logs:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
