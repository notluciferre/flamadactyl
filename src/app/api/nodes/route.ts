import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth-helpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

    // Fetch all nodes (bypass RLS with admin client)
    const { data: nodes, error: nodesError } = await supabaseAdmin
      .from('nodes')
      .select('*')
      .order('created_at', { ascending: false });

    if (nodesError) throw nodesError;

    // Get stats and bot count for each node
    const nodesWithStats = await Promise.all(
      (nodes || []).map(async (node) => {
        // Get latest stats
        const { data: stats } = await supabaseAdmin
          .from('node_stats')
          .select('*')
          .eq('node_id', node.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Count bots
        const { count } = await supabaseAdmin
          .from('bots')
          .select('*', { count: 'exact', head: true })
          .eq('node_id', node.id);

        return {
          ...node,
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
