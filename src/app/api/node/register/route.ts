import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const NODE_SECRET_KEY = process.env.NODE_SECRET_KEY || 'cakranode-secret-2026';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, location, ip_address, secret_key } = body;

    // Validate secret key
    if (secret_key !== NODE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!name || !location || !ip_address) {
      return NextResponse.json(
        { error: 'Missing required fields: name, location, ip_address' },
        { status: 400 }
      );
    }

    // Check if node already exists with same IP
    const { data: existingNode } = await supabaseAdmin
      .from('nodes')
      .select('id')
      .eq('ip_address', ip_address)
      .single();

    if (existingNode) {
      // Update existing node
      const { data, error } = await supabaseAdmin
        .from('nodes')
        .update({
          name,
          location,
          status: 'online',
          last_heartbeat: new Date().toISOString(),
        })
        .eq('id', existingNode.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        node: data,
        message: 'Node updated successfully',
      });
    }

    // Create new node
    const { data, error } = await supabaseAdmin
      .from('nodes')
      .insert({
        name,
        location,
        ip_address,
        status: 'online',
        last_heartbeat: new Date().toISOString(),
      })
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
