export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { createNode } from '@/lib/rtdb-admin';
import { randomBytes } from 'crypto';
import { verifyAdmin } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify user is admin with retry logic
    const { isAdmin, userId, error: authError } = await verifyAdmin(token);
    if (!isAdmin) {
      console.error('[Nodes Create] Admin verification failed:', authError);
      return NextResponse.json({ 
        success: false, 
        error: authError || 'Admin access required' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { name, location, ip_address } = body;

    if (!name || !location) {
      return NextResponse.json({ success: false, error: 'Name and location required' }, { status: 400 });
    }

    // Generate unique access token for this node
    const accessToken = `cn-${randomBytes(32).toString('hex')}`;

    // Create node in RTDB
    const { data: node, error: nodeError } = await createNode({
      name,
      location,
      ip_address: ip_address || 'auto',
      status: 'offline',
      access_token: accessToken,
      created_by: userId,
      created_at: Date.now(),
    });

    if (nodeError) {
      console.error('Error creating node:', nodeError);
      return NextResponse.json({ success: false, error: nodeError.message || 'Failed to create node' }, { status: 500 });
    }

    if (!node) {
      return NextResponse.json({ success: false, error: 'Failed to create node - no data returned' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      node: {
        id: node.id,
        name: node.name,
        location: node.location,
        access_token: accessToken,
      },
      message: 'Node created successfully. Save the access token - it will not be shown again!',
    });
  } catch (error: any) {
    console.error('Node creation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
