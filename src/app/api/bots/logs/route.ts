import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bot_id, log_type, message, metadata, logs, secret_key } = body;

    // Verify node server secret
    if (secret_key !== process.env.NODE_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle batch logs
    if (logs && Array.isArray(logs) && logs.length > 0) {
      const logEntries = logs.map(log => ({
        bot_id,
        log_type: log.log_type,
        message: log.message,
        metadata: log.metadata || {},
        created_at: log.timestamp || new Date().toISOString(),
      }));

      const { data, error } = await supabaseAdmin
        .from("bot_logs")
        .insert(logEntries)
        .select();

      if (error) {
        console.error("Error inserting batch logs:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        count: logEntries.length,
        logs: data 
      });
    }

    // Handle single log (backward compatibility)
    if (!bot_id || !log_type || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert log entry
    const { data, error } = await supabaseAdmin
      .from("bot_logs")
      .insert({
        bot_id,
        log_type,
        message,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting bot log:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, log: data });
  } catch (error: any) {
    console.error("Error in bot logs API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
