import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const NODE_SECRET_KEY = process.env.NODE_SECRET_KEY || 'cakranode-secret-2026';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bot_id, secret_key } = body;

    // Validate secret key
    if (secret_key !== NODE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 401 }
      );
    }

    if (!bot_id) {
      return NextResponse.json(
        { error: 'Missing required field: bot_id' },
        { status: 400 }
      );
    }

    // Delete bot from database
    const { error: deleteError } = await supabaseAdmin
      .from('bots')
      .delete()
      .eq('id', bot_id);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      message: 'Bot deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete bot error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete bot' },
      { status: 500 }
    );
  }
}
