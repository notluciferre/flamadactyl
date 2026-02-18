export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { addBotLog } from '@/lib/rtdb-admin';

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
      const insertedLogs = [];
      
      for (const log of logs) {
        const { data, error } = await addBotLog(bot_id, {
          log_type: log.log_type,
          message: log.message,
          metadata: log.metadata || {},
          timestamp: log.timestamp || Date.now(),
        });

        if (error) {
          console.error('[BOT LOGS] Error inserting log:', error);
        } else {
          insertedLogs.push(data);
        }
      }

      return NextResponse.json({ 
        success: true, 
        count: insertedLogs.length,
        logs: insertedLogs 
      });
    }

    // Handle single log (backward compatibility)
    if (!bot_id || !log_type || !message) {
      return NextResponse.json(
        { error: "Missing required fields: bot_id, log_type, message" },
        { status: 400 }
      );
    }

    // Insert log entry
    const { data, error } = await addBotLog(bot_id, {
      log_type,
      message,
      metadata: metadata || {},
    });

    if (error) {
      console.error('[BOT LOGS] Error inserting bot log:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[BOT LOGS] Log added:', { bot_id, log_type });

    return NextResponse.json({ success: true, log: data });
  } catch (error: any) {
    console.error('[BOT LOGS] Error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
