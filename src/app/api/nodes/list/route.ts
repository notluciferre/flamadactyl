export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getAllNodes } from '@/lib/rtdb-admin';
import { verifyUser } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header (any authenticated user can access)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user (not admin required, just authenticated)
    const { authenticated, error: authError } = await verifyUser(token);
    if (!authenticated) {
      console.error('[Nodes List] User verification failed:', authError);
      return NextResponse.json({ 
        error: authError || 'Unauthorized' 
      }, { status: 401 });
    }

    // Fetch all nodes from RTDB
    const { data: nodes, error: nodesError } = await getAllNodes();

    if (nodesError) throw nodesError;

    // Filter out invalid/incomplete nodes and return only safe data
    const nodesList = (nodes || [])
      .filter((node: any) => node.id && node.name && node.location)
      .map((node: any) => {
        // Auto-detect offline: if last heartbeat > 90 seconds ago
        let actualStatus = node.status;
        if (node.last_heartbeat) {
          const lastHeartbeat = new Date(node.last_heartbeat).getTime();
          const now = Date.now();
          const secondsSinceHeartbeat = (now - lastHeartbeat) / 1000;
          
          if (secondsSinceHeartbeat > 90 && actualStatus === 'online') {
            actualStatus = 'offline';
          }
        }

        // Return only basic, non-sensitive data
        return {
          id: node.id,
          name: node.name,
          location: node.location,
          status: actualStatus,
        };
      });

    console.log(`[Nodes List] Returning ${nodesList.length} nodes for user`);

    return NextResponse.json({
      success: true,
      nodes: nodesList,
    });
  } catch (error: any) {
    console.error('[Nodes List] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch nodes' },
      { status: 500 }
    );
  }
}
