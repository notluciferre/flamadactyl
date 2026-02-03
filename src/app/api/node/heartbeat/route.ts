import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const NODE_SECRET_KEY = process.env.NODE_SECRET_KEY || 'cakranode-secret-2026';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { node_id, secret_key, stats } = body;

    // Validate secret key
    if (secret_key !== NODE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!node_id) {
      return NextResponse.json(
        { error: 'Missing required field: node_id' },
        { status: 400 }
      );
    }

    // Update node heartbeat
    const { error: nodeError } = await supabaseAdmin
      .from('nodes')
      .update({
        status: 'online',
        last_heartbeat: new Date().toISOString(),
      })
      .eq('id', node_id);

    if (nodeError) throw nodeError;

    // Insert node stats if provided
    if (stats) {
      const { error: statsError } = await supabaseAdmin
        .from('node_stats')
        .insert({
          node_id,
          cpu_usage: stats.cpu_usage || 0,
          ram_used: stats.ram_used || 0,
          ram_total: stats.ram_total || 0,
          disk_used: stats.disk_used || 0,
          disk_total: stats.disk_total || 0,
          network_upload: stats.network_upload || 0,
          network_download: stats.network_download || 0,
          bot_count: stats.bot_count || 0,
        });

      if (statsError) {
        console.error('Failed to insert node stats:', statsError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Heartbeat received',
    });
  } catch (error: any) {
    console.error('Node heartbeat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process heartbeat' },
      { status: 500 }
    );
  }
}
