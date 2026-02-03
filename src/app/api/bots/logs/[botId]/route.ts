import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    if (bot.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get logs (last 100 entries)
    const { data: logs, error } = await supabase
      .from("bot_logs")
      .select("*")
      .eq("bot_id", botId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching bot logs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reverse to show oldest first
    return NextResponse.json({ success: true, logs: logs.reverse() });
  } catch (error: any) {
    console.error("Error in bot logs API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
