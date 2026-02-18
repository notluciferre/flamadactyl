export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { firebaseAdmin } from '@/lib/firebase-admin';

export async function POST() {
  try {
    const db = firebaseAdmin.database();
    const snapshot = await db.ref('nodes').once('value');
    const data = snapshot.val();
    
    if (!data) {
      return NextResponse.json({
        success: true,
        message: 'No nodes to clean',
        cleaned: 0
      });
    }
    
    const invalidNodes: string[] = [];
    
    // Find invalid nodes
    for (const [nodeId, node] of Object.entries(data)) {
      const n = node as any;
      
      // Check if node is invalid (missing required fields)
      if (!n || typeof n !== 'object' || !n.name || !n.location) {
        invalidNodes.push(nodeId);
        console.log(`[Cleanup] Found invalid node ${nodeId}:`, n);
      }
    }
    
    // Delete invalid nodes
    if (invalidNodes.length > 0) {
      const updates: any = {};
      invalidNodes.forEach(nodeId => {
        updates[`nodes/${nodeId}`] = null; // Delete by setting to null
      });
      
      await db.ref().update(updates);
      
      console.log(`[Cleanup] Deleted ${invalidNodes.length} invalid nodes`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${invalidNodes.length} invalid nodes`,
      cleaned: invalidNodes.length,
      invalidNodeIds: invalidNodes
    });
  } catch (error: any) {
    console.error('[Cleanup] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
