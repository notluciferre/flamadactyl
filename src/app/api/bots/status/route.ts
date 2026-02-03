import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const NODE_SECRET_KEY = process.env.NODE_SECRET_KEY || 'cakranode-secret-2026';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bot_id, secret_key, status, error: botError } = body;

    // Validate secret key
    if (secret_key !== NODE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 401 }
      );
    }

    if (!bot_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: bot_id, status' },
        { status: 400 }
      );
    }

    // Update bot status
    const updateData: any = { status };
    
    if (botError) {
      updateData.metadata = { error: botError };
    }

    const { error: updateError } = await supabaseAdmin
      .from('bots')
      .update(updateData)
      .eq('id', bot_id);

    if (updateError) {
      console.error('[STATUS UPDATE] Error:', updateError);
      throw updateError;
    }

    console.log('[STATUS UPDATE] Success:', { bot_id, status });

    return NextResponse.json({
      success: true,
      message: 'Bot status updated',
    });
  } catch (error: any) {
    console.error('Update bot status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update bot status' },
      { status: 500 }
    );
  }
}
