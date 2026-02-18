/**
 * DEPRECATED - This endpoint is no longer used
 * 
 * The system has been migrated from HTTP polling to Firebase Realtime Database listeners.
 * Node servers now listen directly to commands in Firebase RTDB instead of polling this endpoint.
 * 
 * Migration: Node servers use onChildAdded() listener on commands path with node_id filter
 * 
 * This file is kept for reference only and will be removed in future versions.
 */

export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Node servers now use Firebase Realtime Database listeners instead of HTTP polling.',
      migration: 'Use Firebase onChildAdded() listener on commands path'
    },
    { status: 410 } // 410 Gone
  );
}
