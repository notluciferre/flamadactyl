/**
 * Authentication Helper Functions (Firebase)
 * Uses Firebase Admin SDK to verify ID tokens and fetch user info.
 */

import { withRetryAndTimeout } from './retry-utils';
import { verifyIdToken, getUserByUid } from './firebase-admin';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.replace(/\"/g, '') || 'admin@cakranode.tech';

export async function verifyAdmin(token: string): Promise<{ 
  isAdmin: boolean; 
  userId: string | null; 
  error: string | null;
}> {
  try {
    const decoded = await withRetryAndTimeout(() => verifyIdToken(token), {
      maxRetries: 2,
      delay: 500,
      timeout: 5000,
    });

    if (!decoded || !decoded.uid) {
      return { isAdmin: false, userId: null, error: 'Invalid token' };
    }

    const user = await withRetryAndTimeout(() => getUserByUid(decoded.uid), {
      maxRetries: 1,
      delay: 200,
      timeout: 3000,
    });

    if (!user || !user.email) {
      return { isAdmin: false, userId: null, error: 'User not found' };
    }

    const isAdmin = user.email === ADMIN_EMAIL;
    return { isAdmin, userId: user.uid, error: isAdmin ? null : 'Admin access required' };
  } catch (err: any) {
    console.error('[Auth] Admin verification failed:', err);
    return { isAdmin: false, userId: null, error: err?.message || 'Verification failed' };
  }
}

export async function verifyUser(token: string): Promise<{
  authenticated: boolean;
  userId: string | null;
  email: string | null;
  error: string | null;
}> {
  try {
    const decoded = await withRetryAndTimeout(() => verifyIdToken(token), {
      maxRetries: 2,
      delay: 500,
      timeout: 5000,
    });

    if (!decoded || !decoded.uid) {
      return { authenticated: false, userId: null, email: null, error: 'Invalid token' };
    }

    // Get user to fetch email
    const user = await withRetryAndTimeout(() => getUserByUid(decoded.uid), {
      maxRetries: 1,
      delay: 200,
      timeout: 3000,
    });

    const email = user?.email || decoded.email || null;

    return { authenticated: true, userId: decoded.uid, email, error: null };
  } catch (err: any) {
    console.error('[Auth] User verification failed:', err);
    return { authenticated: false, userId: null, email: null, error: err?.message || 'Verification failed' };
  }
}
