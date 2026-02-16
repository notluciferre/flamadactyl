import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyUser, verifyAdmin } from '@/lib/auth-helpers';
import { initFirebase } from '@/lib/firebase';
import { sendBotCommand } from '@/lib/firebase-api';

const NODE_SECRET_KEY = process.env.NODE_SECRET_KEY || 'cakranode-secret-2026';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bot_id, secret_key } = body;

    if (!bot_id) {
      return NextResponse.json(
        { error: 'Missing required field: bot_id' },
        { status: 400 }
      );
    }

    // Prefer Authorization-based flow (frontend sends Bearer token)
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { authenticated, userId, error: authError } = await verifyUser(token);

      if (!authenticated || !userId) {
        return NextResponse.json({ error: authError || 'Authentication failed' }, { status: 401 });
      }

      // Check ownership or admin
      const { data: bot, error: fetchError } = await supabaseAdmin
        .from('bots')
        .select('user_id, node_id')
        .eq('id', bot_id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // allow if owner
      if (bot?.user_id === userId) {
          // send delete command to node (notify node to stop/cleanup)
            try {
              initFirebase();
              if (bot?.node_id) {
                await sendBotCommand(bot.node_id, 'delete', bot_id, {});
              }
            } catch (cmdErr) {
            console.warn('Failed to send delete command to node (non-fatal):', cmdErr);
          }

          const { error: deleteError } = await supabaseAdmin
            .from('bots')
            .delete()
            .eq('id', bot_id);

          if (deleteError) throw deleteError;

          return NextResponse.json({ success: true, message: 'Bot deleted successfully' });
      }

      // allow if admin
      const { isAdmin } = await verifyAdmin(token);
      if (isAdmin) {
        // send delete command to node (notify node to stop/cleanup)
        try {
          initFirebase();
          if (bot?.node_id) {
            await sendBotCommand(bot.node_id, 'delete', bot_id, {});
          }
        } catch (cmdErr) {
          console.warn('Failed to send delete command to node (non-fatal):', cmdErr);
        }

        const { error: deleteError } = await supabaseAdmin
          .from('bots')
          .delete()
          .eq('id', bot_id);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true, message: 'Bot deleted by admin' });
      }

      return NextResponse.json({ error: 'Not authorized to delete this bot' }, { status: 403 });
    }

    // Fallback: validate secret key per-node (used by nodes or legacy clients)
    if (!secret_key) {
      return NextResponse.json({ error: 'Missing secret_key for node authentication' }, { status: 401 });
    }

    // Lookup bot to get node_id
    const { data: botRecord, error: botFetchError } = await supabaseAdmin
      .from('bots')
      .select('node_id')
      .eq('id', bot_id)
      .maybeSingle();

    if (botFetchError) throw botFetchError;

    const nodeId = botRecord?.node_id;
    if (!nodeId) {
      return NextResponse.json({ error: 'Bot or node not found' }, { status: 404 });
    }

    // Lookup node secret in DB
    const { data: nodeRecord, error: nodeFetchError } = await supabaseAdmin
      .from('nodes')
      .select('secret_key')
      .eq('id', nodeId)
      .maybeSingle();

    if (nodeFetchError) throw nodeFetchError;

    // If node has a stored secret_key, verify it. Otherwise allow legacy NODE_SECRET_KEY.
    const nodeSecret = nodeRecord?.secret_key;
    const validSecret = nodeSecret ? secret_key === nodeSecret : secret_key === NODE_SECRET_KEY;

    if (!validSecret) {
      return NextResponse.json({ error: 'Invalid secret key' }, { status: 401 });
    }

    // Delete bot from database (secret-key flow) -- but notify node first
    try {
      initFirebase();
      if (nodeId) {
        await sendBotCommand(nodeId, 'delete', bot_id, {});
      }
    } catch (cmdErr) {
      console.warn('Failed to send delete command to node (non-fatal):', cmdErr);
    }

    const { error: deleteError } = await supabaseAdmin
      .from('bots')
      .delete()
      .eq('id', bot_id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true, message: 'Bot deleted successfully' });
  } catch (error: any) {
    console.error('Delete bot error:', error?.message || error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete bot' },
      { status: 500 }
    );
  }
}
