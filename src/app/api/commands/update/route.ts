import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const NODE_SECRET_KEY = process.env.NODE_SECRET_KEY || 'cakranode-secret-2026';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { command_id, secret_key, status, result, error: cmdError } = body;

    // Validate secret key
    if (secret_key !== NODE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 401 }
      );
    }

    if (!command_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: command_id, status' },
        { status: 400 }
      );
    }

    // Update command status
    const updateData: any = {
      status,
    };

    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (result) {
      updateData.result = result;
    }

    if (cmdError) {
      updateData.error = cmdError;
    }

    const { error: updateError } = await supabaseAdmin
      .from('commands')
      .update(updateData)
      .eq('id', command_id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Command updated successfully',
    });
  } catch (error: any) {
    console.error('Command update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update command' },
      { status: 500 }
    );
  }
}
