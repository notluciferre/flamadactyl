import { firebaseAdmin } from './firebase-admin';

// Lazy initialization of Firestore
function getDb(): FirebaseFirestore.Firestore {
  if (!firebaseAdmin.apps.length) {
    throw new Error('Firebase Admin not initialized. Check your environment variables.');
  }
  return firebaseAdmin.firestore();
}

function toDataArray(snapshot: FirebaseFirestore.QuerySnapshot) {
  const arr: any[] = [];
  snapshot.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
  return arr;
}

export async function getAllNodes() {
  try {
    const snap = await getDb().collection('nodes').get();
    return { data: toDataArray(snap), error: null };
  } catch (err: any) {
    console.error('[Firestore Admin] getAllNodes error', err);
    
    if (err.code === 5 || err.message?.includes('NOT_FOUND')) {
      return { 
        data: null, 
        error: {
          message: 'Firestore database not found. Create it at: https://console.firebase.google.com/project/' + (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) + '/firestore',
          code: 'FIRESTORE_NOT_CREATED'
        }
      };
    }
    
    return { data: null, error: err };
  }
}

export async function getBotCountForNode(nodeId: string) {
  try {
    const snap = await getDb().collection('bots').where('node_id', '==', nodeId).get();
    return { data: snap.size, error: null };
  } catch (err) {
    console.error('[Firestore Admin] getBotCountForNode error', err);
    return { data: null, error: err };
  }
}

export async function getLatestNodeStats(nodeId: string) {
  try {
    const snap = await getDb()
      .collection('node_stats')
      .where('node_id', '==', nodeId)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    const arr = toDataArray(snap);
    return { data: arr.length ? arr[0] : null, error: null };
  } catch (err) {
    console.error('[Firestore Admin] getLatestNodeStats error', err);
    return { data: null, error: err };
  }
}

export async function getNodeById(nodeId: string) {
  try {
    const doc = await getDb().collection('nodes').doc(nodeId).get();
    return { data: doc.exists ? { id: doc.id, ...doc.data() } : null, error: null };
  } catch (err) {
    console.error('[Firestore Admin] getNodeById error', err);
    return { data: null, error: err };
  }
}

export async function createNode(node: any) {
  try {
    const ref = await getDb().collection('nodes').add(node);
    const created = (await ref.get()).data();
    return { data: { id: ref.id, ...created }, error: null };
  } catch (err: any) {
    console.error('[Firestore Admin] createNode error', err);
    
    // Provide helpful error messages
    if (err.code === 5 || err.message?.includes('NOT_FOUND')) {
      return { 
        data: null, 
        error: {
          message: 'Firestore database not found. Please create a Firestore database in Firebase Console: https://console.firebase.google.com/project/' + (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) + '/firestore',
          code: 'FIRESTORE_NOT_CREATED',
          originalError: err.message
        }
      };
    }
    
    return { data: null, error: err };
  }
}

export async function updateNode(nodeId: string, updates: any) {
  try {
    await getDb().collection('nodes').doc(nodeId).set(updates, { merge: true });
    const doc = await getDb().collection('nodes').doc(nodeId).get();
    return { data: { id: doc.id, ...doc.data() }, error: null };
  } catch (err) {
    console.error('[Firestore Admin] updateNode error', err);
    return { data: null, error: err };
  }
}

export async function deleteNode(nodeId: string) {
  try {
    await getDb().collection('nodes').doc(nodeId).delete();
    return { data: true, error: null };
  } catch (err) {
    console.error('[Firestore Admin] deleteNode error', err);
    return { data: null, error: err };
  }
}

export async function getOnlineNodes() {
  try {
    const snap = await getDb().collection('nodes').where('status', '==', 'online').get();
    return { data: toDataArray(snap), error: null };
  } catch (err) {
    console.error('[Firestore Admin] getOnlineNodes error', err);
    return { data: null, error: err };
  }
}

export async function getNodeByAccessToken(accessToken: string) {
  try {
    const snap = await getDb().collection('nodes').where('metadata.access_token', '==', accessToken).limit(1).get();
    if (snap.empty) return { data: null, error: null };
    const doc = snap.docs[0];
    return { data: { id: doc.id, ...doc.data() }, error: null };
  } catch (err) {
    console.error('[Firestore Admin] getNodeByAccessToken error', err);
    return { data: null, error: err };
  }
}

export async function addNodeStats(nodeId: string, stats: any) {
  try {
    const ref = await getDb().collection('node_stats').add({
      node_id: nodeId,
      cpu_usage: stats.cpu_usage || 0,
      ram_used: stats.ram_used || 0,
      ram_total: stats.ram_total || 0,
      disk_used: stats.disk_used || 0,
      disk_total: stats.disk_total || 0,
      network_upload: stats.network_upload || 0,
      network_download: stats.network_download || 0,
      bot_count: stats.bot_count || 0,
      created_at: Date.now(),
    });
    return { data: { id: ref.id }, error: null };
  } catch (err) {
    console.error('[Firestore Admin] addNodeStats error', err);
    return { data: null, error: err };
  }
}

// Bots
export async function getBotsByUser(userId: string) {
  try {
    const snap = await getDb().collection('bots').where('user_id', '==', userId).get();
    return { data: toDataArray(snap), error: null };
  } catch (err) {
    console.error('[Firestore Admin] getBotsByUser error', err);
    return { data: null, error: err };
  }
}

export async function getBotsByNode(nodeId: string) {
  try {
    const snap = await getDb().collection('bots').where('node_id', '==', nodeId).get();
    return { data: toDataArray(snap), error: null };
  } catch (err) {
    console.error('[Firestore Admin] getBotsByNode error', err);
    return { data: null, error: err };
  }
}

export async function getBotById(botId: string) {
  try {
    const doc = await getDb().collection('bots').doc(botId).get();
    return { data: doc.exists ? { id: doc.id, ...doc.data() } : null, error: null };
  } catch (err) {
    console.error('[Firestore Admin] getBotById error', err);
    return { data: null, error: err };
  }
}

export async function createBot(bot: any) {
  try {
    const ref = await getDb().collection('bots').add(bot);
    const created = (await ref.get()).data();
    return { data: { id: ref.id, ...created }, error: null };
  } catch (err) {
    console.error('[Firestore Admin] createBot error', err);
    return { data: null, error: err };
  }
}

export async function updateBot(botId: string, updates: any) {
  try {
    await getDb().collection('bots').doc(botId).set(updates, { merge: true });
    const doc = await getDb().collection('bots').doc(botId).get();
    return { data: { id: doc.id, ...doc.data() }, error: null };
  } catch (err) {
    console.error('[Firestore Admin] updateBot error', err);
    return { data: null, error: err };
  }
}

export async function deleteBot(botId: string) {
  try {
    await getDb().collection('bots').doc(botId).delete();
    return { data: true, error: null };
  } catch (err) {
    console.error('[Firestore Admin] deleteBot error', err);
    return { data: null, error: err };
  }
}

// Logs
export async function addBotLog(botId: string, log: any) {
  try {
    const ref = await getDb().collection('bots').doc(botId).collection('logs').add({ ...log, created_at: Date.now() });
    const created = (await ref.get()).data();
    return { data: { id: ref.id, ...created }, error: null };
  } catch (err) {
    console.error('[Firestore Admin] addBotLog error', err);
    return { data: null, error: err };
  }
}

export async function getBotLogs(botId: string, limit = 100) {
  try {
    const snap = await getDb().collection('bots').doc(botId).collection('logs').orderBy('created_at', 'desc').limit(limit).get();
    return { data: toDataArray(snap), error: null };
  } catch (err) {
    console.error('[Firestore Admin] getBotLogs error', err);
    return { data: null, error: err };
  }
}

export async function clearBotLogs(botId: string) {
  try {
    const snap = await getDb().collection('bots').doc(botId).collection('logs').get();
    const batch = getDb().batch();
    snap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    await getDb().collection('bots').doc(botId).set({ logs_cleared_at: new Date().toISOString() }, { merge: true });
    return { data: true, error: null };
  } catch (err) {
    console.error('[Firestore Admin] clearBotLogs error', err);
    return { data: null, error: err };
  }
}
