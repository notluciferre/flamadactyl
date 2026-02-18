export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getAllNodes, getLatestNodeStats, getBotCountForNode } from '@/lib/rtdb-admin';
import { verifyAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify admin with retry logic
    const { isAdmin, error: authError } = await verifyAdmin(token);
    if (!isAdmin) {
      console.error('[Nodes List] Admin verification failed:', authError);
      return NextResponse.json({ 
        error: authError || 'Unauthorized - Admin only' 
      }, { status: 401 });
    }

    // Fetch all nodes from RTDB
    const { data: nodes, error: nodesError } = await getAllNodes();

    if (nodesError) throw nodesError;

    // Filter out invalid/incomplete nodes
    const validNodes = (nodes || []).filter((node: any) => 
      node.id && node.name && node.location
    );

    console.log(`[Nodes List] Found ${validNodes.length} valid nodes out of ${nodes?.length || 0} total`);

    // Get stats and bot count for each node
    const nodesWithStats = await Promise.all(
      validNodes.map(async (node: any) => {
        const { data: stats } = await getLatestNodeStats(node.id);
        const { data: count } = await getBotCountForNode(node.id);

        // Auto-detect offline: if last heartbeat > 90 seconds ago
        let actualStatus = node.status;
        if (node.last_heartbeat) {
          const lastHeartbeat = new Date(node.last_heartbeat).getTime();
          const now = Date.now();
          const secondsSinceHeartbeat = (now - lastHeartbeat) / 1000;
          
          if (secondsSinceHeartbeat > 90 && actualStatus === 'online') {
            actualStatus = 'offline';
            console.log(`[Nodes List] Auto-detected offline for ${node.id}: ${Math.floor(secondsSinceHeartbeat)}s since last heartbeat`);
          }
        }

        return {
          ...node,
          status: actualStatus,
          bot_count: count || 0,
          cpu_usage: stats?.cpu_usage || 0,
          ram_used: stats?.ram_used || 0,
          ram_total: stats?.ram_total || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      nodes: nodesWithStats,
    });
  } catch (error: any) {
    console.error('Fetch nodes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch nodes' },
      { status: 500 }
    );
  }
}
