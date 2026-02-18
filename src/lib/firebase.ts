import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let database: Database | null = null;
let auth: Auth | null = null;

export function initFirebase() {
  // Check if Firebase config is available
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    console.warn('[Firebase] Config not available. Real-time features disabled.');
    console.warn('[Firebase] projectId:', firebaseConfig.projectId);
    console.warn('[Firebase] apiKey:', firebaseConfig.apiKey ? '***' : 'missing');
    console.warn('[Firebase] databaseURL:', firebaseConfig.databaseURL);
    return { app: null, database: null, auth: null };
  }

  if (getApps().length === 0) {
    console.log('[Firebase] Initializing Firebase app...');
    try {
      app = initializeApp(firebaseConfig);
      console.log('[Firebase] App initialized successfully');
    } catch (err) {
      console.error('[Firebase] Failed to initialize app:', err);
      return { app: null, database: null, auth: null };
    }
  } else {
    console.log('[Firebase] Using existing Firebase app');
    app = getApps()[0];
  }
  
  try {
    database = getDatabase(app);
    auth = getAuth(app);
    console.log('[Firebase] Database initialized:', !!database);
    console.log('[Firebase] Auth initialized:', !!auth);
  } catch (err) {
    console.error('[Firebase] Error initializing services:', err);
  }
  
  return { app, database, auth };
}

export function getFirebaseDatabase() {
  if (!database) {
    const result = initFirebase();
    return result.database;
  }
  return database;
}

export function getFirebaseAuth() {
  if (!auth) {
    console.log('[Firebase] Auth not initialized, attempting to initialize...');
    const result = initFirebase();
    if (!result.auth) {
      console.error('[Firebase] Failed to initialize auth');
      return null;
    }
    return result.auth;
  }
  return auth;
}
