import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

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

export function initFirebase() {
  // Check if Firebase config is available
  if (!firebaseConfig.projectId || !firebaseConfig.databaseURL) {
    console.warn('[Firebase] Config not available. Real-time features disabled.');
    console.warn('[Firebase] projectId:', firebaseConfig.projectId);
    console.warn('[Firebase] databaseURL:', firebaseConfig.databaseURL);
    return { app: null, database: null };
  }

  if (getApps().length === 0) {
    console.log('[Firebase] Initializing Firebase app...');
    app = initializeApp(firebaseConfig);
  } else {
    console.log('[Firebase] Using existing Firebase app');
    app = getApps()[0];
  }
  
  database = getDatabase(app);
  console.log('[Firebase] Database initialized:', !!database);
  return { app, database };
}

export function getFirebaseDatabase() {
  if (!database) {
    const result = initFirebase();
    return result.database;
  }
  return database;
}
