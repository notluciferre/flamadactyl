export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getBotById, deleteBot, createCommand } from '@/lib/rtdb-admin';
import { verifyUser, verifyAdmin } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bot_id } = body;

    if (!bot_id) {
      return NextResponse.json(
        { error: 'Missing required field: bot_id' },
        { status: 400 }
      );
    }

    // Get bot details
    const { data: bot, error: fetchError } = await getBotById(bot_id);

    if (fetchError) throw fetchError;
    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Get and verify user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { authenticated, userId, error: authError } = await verifyUser(token);

    if (!authenticated || !userId) {
      return NextResponse.json({ error: authError || 'Authentication failed' }, { status: 401 });
    }

    // Check ownership or admin
    const isOwner = bot.user_id === userId;
    const { isAdmin } = await verifyAdmin(token);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to delete this bot' }, { status: 403 });
    }

    // Send delete command to node (notify node to stop/cleanup)
    try {
      if (bot.node_id) {
        await createCommand({
          user_id: userId,
          node_id: bot.node_id,
          bot_id: bot_id,
          action: 'delete',
          payload: {},
        });
        console.log('[DELETE BOT] Delete command sent to node');
      }
    } catch (cmdErr) {
      console.warn('[DELETE BOT] Failed to send delete command to node (non-fatal):', cmdErr);
    }

    // Delete bot from database
    const { error: deleteError } = await deleteBot(bot_id);
    if (deleteError) throw deleteError;

    console.log('[DELETE BOT] Success:', { bot_id, deleted_by: userId, is_admin: isAdmin });

    return NextResponse.json({ 
      success: true, 
      message: isAdmin ? 'Bot deleted by admin' : 'Bot deleted successfully' 
    });
  } catch (error: any) {
    console.error('[DELETE BOT] Error:', error?.message || error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete bot' },
      { status: 500 }
    );
  }
}
