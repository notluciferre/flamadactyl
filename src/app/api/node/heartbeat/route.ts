import { NextRequest, NextResponse } from 'next/server';
import { updateNode, addNodeStats } from '@/lib/rtdb-admin';

export const runtime = 'nodejs';

const NODE_SECRET_KEY = process.env.NODE_SECRET_KEY || 'cakranode-secret-2026';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { node_id, secret_key, stats } = body;

    // Validate secret key
    if (secret_key !== NODE_SECRET_KEY) {
      console.log('[Heartbeat] Invalid secret key');
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!node_id) {
      console.log('[Heartbeat] Missing node_id');
      return NextResponse.json(
        { error: 'Missing required field: node_id' },
        { status: 400 }
      );
    }

    console.log(`[Heartbeat] Received from node ${node_id}, bots: ${stats?.bot_count || 0}, CPU: ${stats?.cpu_usage || 0}%`);

    // Update node heartbeat
    const { error: nodeError } = await updateNode(node_id, {
      status: 'online',
      last_heartbeat: new Date().toISOString(),
    });

    if (nodeError) throw nodeError;

    // Insert node stats if provided
    if (stats) {
      const { error: statsError } = await addNodeStats(node_id, stats);

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
