/**
 * Authentication Helper Functions
 * Provides robust auth verification with retry logic
 */

import { createClient } from '@supabase/supabase-js';
import { withRetryAndTimeout } from './retry-utils';

const ADMIN_EMAIL = 'admin@cakranode.tech';

/**
 * Verify if user is admin with retry logic
 * Handles network timeouts gracefully
 */
export async function verifyAdmin(token: string): Promise<{ 
  isAdmin: boolean; 
  userId: string | null; 
  error: string | null;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Use retry with timeout for network reliability
    const { data: { user }, error } = await withRetryAndTimeout(
      () => supabase.auth.getUser(token),
      {
        maxRetries: 2,
        delay: 500,
        timeout: 5000, // 5s timeout per attempt
      }
    );

    if (error) {
      console.error('[Auth] Failed to verify user:', error.message);
      return { 
        isAdmin: false, 
        userId: null, 
        error: error.message 
      };
    }

    if (!user) {
      return { 
        isAdmin: false, 
        userId: null, 
        error: 'User not found' 
      };
    }

    const isAdmin = user.email === ADMIN_EMAIL;
    
    return { 
      isAdmin, 
      userId: user.id, 
      error: isAdmin ? null : 'Admin access required' 
    };

  } catch (error) {
    console.error('[Auth] Admin verification failed:', error);
    return { 
      isAdmin: false, 
      userId: null, 
      error: error instanceof Error ? error.message : 'Verification failed' 
    };
  }
}

/**
 * Verify user authentication (non-admin)
 */
export async function verifyUser(token: string): Promise<{
  authenticated: boolean;
  userId: string | null;
  error: string | null;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: { user }, error } = await withRetryAndTimeout(
      () => supabase.auth.getUser(token),
      {
        maxRetries: 2,
        delay: 500,
        timeout: 5000,
      }
    );

    if (error || !user) {
      return {
        authenticated: false,
        userId: null,
        error: error?.message || 'User not found'
      };
    }

    return {
      authenticated: true,
      userId: user.id,
      error: null
    };
  } catch (error) {
    console.error('[Auth] User verification failed:', error);
    return {
      authenticated: false,
      userId: null,
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}
