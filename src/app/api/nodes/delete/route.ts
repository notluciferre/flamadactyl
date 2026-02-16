import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteNode } from '@/lib/firebase-api';
import { verifyAdmin } from '@/lib/auth-helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify user is admin with retry logic
    const { isAdmin, error: authError } = await verifyAdmin(token);
    if (!isAdmin) {
      console.error('[Nodes Delete] Admin verification failed:', authError);
      return NextResponse.json({ 
        success: false, 
        error: authError || 'Admin access required' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { node_id } = body;

    if (!node_id) {
      return NextResponse.json({ success: false, error: 'Node ID required' }, { status: 400 });
    }

    // Check if node has active bots
    const { data: bots } = await supabase
      .from('bots')
      .select('id')
      .eq('node_id', node_id)
      .eq('status', 'running');

    if (bots && bots.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Cannot delete node with ${bots.length} active bot(s). Stop all bots first.` 
      }, { status: 400 });
    }

    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from('nodes')
      .delete()
      .eq('id', node_id);

    if (deleteError) {
      console.error('Error deleting node:', deleteError);
      return NextResponse.json({ success: false, error: deleteError.message }, { status: 500 });
    }

    // Delete from Firebase (cleanup real-time data)
    try {
      await deleteNode(node_id);
    } catch (fbError) {
      console.warn('Firebase cleanup error (non-critical):', fbError);
    }

    return NextResponse.json({
      success: true,
      message: 'Node deleted successfully',
    });
  } catch (error: any) {
    console.error('Node deletion error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
