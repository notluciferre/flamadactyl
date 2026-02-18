/**
 * DEPRECATED - This endpoint is no longer used
 * 
 * The system has been migrated from HTTP polling to Firebase Realtime Database.
 * Node servers now update command results directly in Firebase RTDB instead of calling this endpoint.
 * 
 * Migration: Node servers use update() on commands/{commandId} path in Firebase
 * 
 * This file is kept for reference only and will be removed in future versions.
 */

export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Node servers now update command results directly to Firebase Realtime Database.',
      migration: 'Use Firebase update() on commands/{commandId} path'
    },
    { status: 410 } // 410 Gone
  );
}
