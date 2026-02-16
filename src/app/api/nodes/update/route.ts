import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/auth-helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { isAdmin, error: authError } = await verifyAdmin(token);
    if (!isAdmin) {
      console.error('[Nodes Update] Admin verification failed:', authError);
      return NextResponse.json({ success: false, error: authError || 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { node_id, name, location, ip_address } = body;

    if (!node_id) {
      return NextResponse.json({ success: false, error: 'Node ID required' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};
    if (typeof name === 'string') updatePayload.name = name;
    if (typeof location === 'string') updatePayload.location = location;
    if (typeof ip_address === 'string') updatePayload.ip_address = ip_address;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
    }

    const { data: updatedNode, error: updateError } = await supabase
      .from('nodes')
      .update(updatePayload)
      .eq('id', node_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating node:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, node: updatedNode });
  } catch (error: any) {
    console.error('Node update error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
