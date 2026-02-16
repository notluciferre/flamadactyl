import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, ip_address } = body;

    // Validate access token
    if (!access_token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!ip_address) {
      return NextResponse.json(
        { error: 'IP address required' },
        { status: 400 }
      );
    }

    // Find node with matching access token
    const { data: nodes, error: findError } = await supabaseAdmin
      .from('nodes')
      .select('*')
      .eq('metadata->>access_token', access_token);

    if (findError || !nodes || nodes.length === 0) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    const node = nodes[0];

    // Update node status and IP
    const { data, error } = await supabaseAdmin
      .from('nodes')
      .update({
        ip_address: ip_address === 'auto' ? node.ip_address : ip_address,
        status: 'online',
        last_heartbeat: new Date().toISOString(),
      })
      .eq('id', node.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      node: data,
      message: 'Node registered successfully',
    });
  } catch (error: any) {
    console.error('Node registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register node' },
      { status: 500 }
    );
  }
}
