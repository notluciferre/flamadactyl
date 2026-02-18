import admin from 'firebase-admin';

function initFirebaseAdmin() {
  if (admin.apps.length) {
    console.log('[Firebase Admin] ✅ Already initialized');
    return admin;
  }

  console.log('[Firebase Admin] 🚀 Starting initialization...');
  
  // Support both service account env (PRIVATE_KEY & CLIENT_EMAIL) or application default
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT; // optional JSON string of service account

  console.log('[Firebase Admin] 📋 Config check:', {
    hasServiceAccountJson: !!serviceAccountJson,
    serviceAccountLength: serviceAccountJson?.length || 0,
    hasProjectId: !!projectId,
    projectId: projectId,
    hasClientEmail: !!clientEmail,
    clientEmail: clientEmail,
    hasPrivateKey: !!privateKey,
    privateKeyLength: privateKey?.length || 0,
  });

  try {
    if (serviceAccountJson) {
      console.log('[Firebase Admin] 📄 Attempting to parse FIREBASE_SERVICE_ACCOUNT JSON...');
      try {
        const parsed = JSON.parse(serviceAccountJson);
        console.log('[Firebase Admin] ✅ JSON parsed successfully, project_id:', parsed.project_id);
        admin.initializeApp({
          credential: admin.credential.cert(parsed as any),
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
        console.log('[Firebase Admin] ✅ Initialized with service account JSON');
      } catch (err) {
        console.error('[Firebase Admin] ❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', err);
        console.error('[Firebase Admin] First 100 chars:', serviceAccountJson.substring(0, 100));
        // fallthrough to other methods
      }
    }

    if (!admin.apps.length) {
      if (projectId && clientEmail && privateKey) {
        console.log('[Firebase Admin] 🔑 Initializing with individual env vars...');
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          } as any),
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
        console.log('[Firebase Admin] ✅ Initialized with individual credentials');
      } else {
        console.warn('[Firebase Admin] ⚠️  No valid credentials found. Trying applicationDefault()...');
        // Fallback to default credentials (e.g., GCP environment)
        try {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
          });
          console.log('[Firebase Admin] ✅ Initialized with applicationDefault');
        } catch (err) {
          console.error('[Firebase Admin] ❌ applicationDefault() failed:', err);
          console.error('[Firebase Admin] ❌ No admin credentials found. Set FIREBASE_SERVICE_ACCOUNT (JSON) or FIREBASE_PRIVATE_KEY/FIREBASE_CLIENT_EMAIL/FIREBASE_PROJECT_ID in your environment.');
        }
      }
    }
    
    if (admin.apps.length > 0) {
      console.log('[Firebase Admin] ✅ Successfully initialized!');
      console.log('[Firebase Admin] 📊 Project:', projectId);
    } else {
      console.error('[Firebase Admin] ❌ Failed to initialize - no apps created');
    }
  } catch (err) {
    console.error('[Firebase Admin] Initialization error:', err);
  }

  return admin;
}

export const firebaseAdmin = initFirebaseAdmin();

export async function verifyIdToken(idToken: string) {
  try {
    if (!firebaseAdmin.apps.length) {
      throw new Error('Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PRIVATE_KEY/FIREBASE_CLIENT_EMAIL/FIREBASE_PROJECT_ID environment variables.');
    }
    return await firebaseAdmin.auth().verifyIdToken(idToken);
  } catch (err) {
    console.error('[Firebase Admin] verifyIdToken error:', err);
    throw err;
  }
}

export async function getUserByUid(uid: string) {
  try {
    if (!firebaseAdmin.apps.length) {
      throw new Error('Firebase Admin not initialized. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PRIVATE_KEY/FIREBASE_CLIENT_EMAIL/FIREBASE_PROJECT_ID environment variables.');
    }
    return await firebaseAdmin.auth().getUser(uid);
  } catch (err) {
    console.error('[Firebase Admin] getUserByUid error:', err);
    throw err;
  }
}
