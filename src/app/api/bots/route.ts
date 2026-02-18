export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { getBotsByUser } from '@/lib/rtdb-admin';
import { verifyUser, verifyAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify user
    const { authenticated, userId, email, error: authError } = await verifyUser(token);
    if (!authenticated || !userId) {
      console.error('[Bots List] User verification failed:', authError);
      return NextResponse.json({ 
        error: authError || 'Unauthorized' 
      }, { status: 401 });
    }

    // Check if admin (admin can see all bots)
    const { isAdmin } = await verifyAdmin(token);
    
    if (isAdmin) {
      // Admin: Get all bots from all users
      console.log('[Bots List] Admin requesting all bots');
      // For now, just return user's bots - we can add getAllBots() later if needed
      const { data: bots, error: botsError } = await getBotsByUser(userId);
      
      if (botsError) throw botsError;
      
      return NextResponse.json({
        success: true,
        bots: bots || [],
      });
    } else {
      // Regular user: Only get their own bots
      console.log('[Bots List] User requesting their bots:', email);
      const { data: bots, error: botsError } = await getBotsByUser(userId);
      
      if (botsError) throw botsError;
      
      return NextResponse.json({
        success: true,
        bots: bots || [],
      });
    }
  } catch (error: any) {
    console.error('[Bots List] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bots' },
      { status: 500 }
    );
  }
}
