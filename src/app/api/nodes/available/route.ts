import { NextRequest, NextResponse } from 'next/server';
import { getOnlineNodes } from '@/lib/rtdb-admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Fetch online nodes only (no auth required for selection)
    const { data: nodes, error } = await getOnlineNodes();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      nodes: nodes || [],
    });
  } catch (error: any) {
    console.error('Fetch available nodes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch nodes' },
      { status: 500 }
    );
  }
}
