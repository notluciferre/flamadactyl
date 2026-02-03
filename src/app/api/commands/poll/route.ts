import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const NODE_SECRET_KEY = process.env.NODE_SECRET_KEY || 'cakranode-secret-2026';

// GET /api/commands/poll?node_id=xxx&secret_key=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const node_id = searchParams.get('node_id');
    const secret_key = searchParams.get('secret_key');

    // Validate secret key
    if (secret_key !== NODE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Invalid secret key' },
        { status: 401 }
      );
    }

    if (!node_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: node_id' },
        { status: 400 }
      );
    }

    // Get pending commands for this node
    const { data: commands, error } = await supabaseAdmin
      .from('commands')
      .select('*')
      .eq('node_id', node_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) throw error;

    // Mark commands as processing
    if (commands && commands.length > 0) {
      const commandIds = commands.map((cmd) => cmd.id);
      await supabaseAdmin
        .from('commands')
        .update({
          status: 'processing',
          processed_at: new Date().toISOString(),
        })
        .in('id', commandIds);
    }

    return NextResponse.json({
      success: true,
      commands: commands || [],
    });
  } catch (error: any) {
    console.error('Command poll error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to poll commands' },
      { status: 500 }
    );
  }
}
