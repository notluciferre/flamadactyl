import { NextRequest, NextResponse } from 'next/server';
import { getNodeByAccessToken, updateNode } from '@/lib/rtdb-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, ip_address } = body;

    console.log('[Node Register] Received registration request');

    // Validate access token
    if (!access_token) {
      console.log('[Node Register] Missing access_token');
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!ip_address) {
      console.log('[Node Register] Missing ip_address');
      return NextResponse.json(
        { error: 'IP address required' },
        { status: 400 }
      );
    }

    console.log('[Node Register] Looking for node with token:', access_token.substring(0, 10) + '...');

    // Find node with matching access token
    const { data: node, error: findError } = await getNodeByAccessToken(access_token);

    if (findError) {
      console.error('[Node Register] Database error:', findError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!node) {
      console.log('[Node Register] Node not found for this access token');
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    console.log('[Node Register] Found node:', node.id, '-', node.name);

    // Update node status and IP
    const { data, error } = await updateNode(node.id, {
      ip_address: ip_address === 'auto' ? node.ip_address : ip_address,
      status: 'online',
      last_heartbeat: new Date().toISOString(),
    });

    if (error) throw error;

    console.log('[Node Register] Node registered successfully:', node.id);

    return NextResponse.json({
      success: true,
      node: data,
      message: 'Node registered successfully',
    });
  } catch (error: any) {
    console.error('[Node Register] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register node' },
      { status: 500 }
    );
  }
}
