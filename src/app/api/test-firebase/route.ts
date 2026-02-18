export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { firebaseAdmin } from '@/lib/firebase-admin';

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    adminInitialized: false,
    rtdbAccessible: false,
    authAccessible: false,
    projectId: null,
    databaseURL: null,
    errors: [],
  };

  try {
    // Check Firebase Admin initialization
    if (firebaseAdmin.apps.length > 0) {
      diagnostics.adminInitialized = true;
      const app = firebaseAdmin.app();
      
      // Try to get project ID
      try {
        diagnostics.projectId = app.options.projectId || process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        diagnostics.databaseURL = app.options.databaseURL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
      } catch (err: any) {
        diagnostics.errors.push(`Failed to get project info: ${err.message}`);
      }

      // Test Realtime Database access
      try {
        const db = firebaseAdmin.database();
        // Try to read from a test path
        await db.ref('_test').once('value');
        diagnostics.rtdbAccessible = true;
      } catch (err: any) {
        diagnostics.errors.push(`RTDB error: ${err.message}`);
        if (err.message.includes('permission')) {
          diagnostics.errors.push('⚠️  Check Realtime Database rules in Firebase Console');
        }
      }

      // Test Auth access
      try {
        await firebaseAdmin.auth().listUsers(1);
        diagnostics.authAccessible = true;
      } catch (err: any) {
        diagnostics.errors.push(`Auth error: ${err.message}`);
      }
    } else {
      diagnostics.errors.push('Firebase Admin SDK not initialized. Check environment variables.');
    }

    return NextResponse.json({
      success: diagnostics.adminInitialized,
      diagnostics,
      instructions: diagnostics.errors.length > 0 
        ? 'See errors array for issues to resolve' 
        : '✅ All Firebase services are accessible',
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      diagnostics,
    }, { status: 500 });
  }
}
