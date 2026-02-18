"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      console.warn('[AuthContext] Firebase Auth not available');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      console.log('[AuthContext] Auth state changed:', u ? u.email : 'signed out');
      
      // If user is signed in but email not verified, sign them out
      if (u && !u.emailVerified) {
        console.warn('[AuthContext] User email not verified, signing out');
        
        // Force reload to get latest emailVerified status
        await u.reload();
        
        // Check again after reload
        if (!u.emailVerified) {
          console.log('[AuthContext] Email still not verified after reload, forcing sign out');
          await firebaseSignOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }
      }
      
      setUser(u ?? null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      console.warn('[AuthContext] Cannot sign out - auth not initialized');
      return;
    }
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
