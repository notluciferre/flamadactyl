/**
 * Firebase Realtime API Client
 * Replaces HTTP polling with real-time Firebase listeners
 */

import { ref, onValue, onChildAdded, push, set, remove, get } from 'firebase/database';
import { getFirebaseDatabase, getFirebaseAuth } from './firebase';
import type { Bot, BotLog, Node, NodeStats } from '@/types/api';

function getDb() {
  const db = getFirebaseDatabase();
  if (!db) {
    console.warn('[Firebase API] Firebase not initialized. Running without real-time features.');
  } else {
    console.log('[Firebase API] Firebase database available');
  }
  return db;
}

// ===== NODE OPERATIONS =====

export function listenToNodes(callback: (nodes: Record<string, Node>) => void) {
  const db = getDb();
  if (!db) return () => {};
  const nodesRef = ref(db, 'nodes');
  const unsubscribe = onValue(nodesRef, (snapshot) => {
    const firebaseData = snapshot.val() || {};
    console.log('[Firebase API] listenToNodes - Raw data from Firebase:', firebaseData);
    
    const mergedNodes: Record<string, Node> = {};
    Object.keys(firebaseData).forEach((id) => {
      mergedNodes[id] = {
        id,
        ...(firebaseData[id] || {}),
      } as Node;
    });
    
    console.log('[Firebase API] listenToNodes - Merged nodes:', mergedNodes);
    console.log('[Firebase API] listenToNodes - Node IDs:', Object.keys(mergedNodes));
    
    callback(mergedNodes);
  });

  return () => {
    unsubscribe();
  };
}

export function listenToNodeStatus(nodeId: string, callback: (status: any) => void) {
  const db = getDb();
  if (!db) return () => {};

  const statusRef = ref(db, `nodes/${nodeId}/status`);
  
  return onValue(statusRef, (snapshot) => {
    callback(snapshot.val());
  });
}

// ===== BOT OPERATIONS =====

export function listenToBots(callback: (bots: Record<string, Bot>) => void) {
  const db = getDb();
  if (!db) {
    console.warn('[Firebase API] Database not initialized in listenToBots');
    callback({}); // Return empty bots if no DB
    return () => {};
  }
  const auth = getFirebaseAuth();
  const currentUser = auth?.currentUser;

  const botsRef = ref(db, 'bots');
  const unsubscribe = onValue(botsRef, (snapshot) => {
    const firebaseData = snapshot.val() || {};
    console.log('[Firebase API] listenToBots - Raw data from Firebase:', firebaseData);
    
    const mergedBots: Record<string, Bot> = {};

    Object.keys(firebaseData).forEach((id) => {
      const bot = firebaseData[id];
      // If user is signed in, filter by user_id
      if (currentUser && bot.user_id !== currentUser.uid) return;

      const firebaseStatus = bot.status || { status: 'stopped', error: null, timestamp: 0 };
      if (firebaseStatus.status === 'deleted') return;

      mergedBots[id] = {
        id,
        ...bot,
        status: firebaseStatus,
      } as Bot;
    });

    console.log('[Firebase API] listenToBots - Merged bots:', mergedBots);
    console.log('[Firebase API] listenToBots - Bot node_ids:', Object.entries(mergedBots).map(([id, b]) => ({ id, node_id: b.node_id })));
    
    callback(mergedBots);
  });

  return () => {
    unsubscribe();
  };
}

export function listenToBotStatus(botId: string, callback: (status: any) => void) {
  const db = getDb();
  if (!db) return () => {};

  const statusRef = ref(db, `bots/${botId}/status`);
  
  return onValue(statusRef, (snapshot) => {
    callback(snapshot.val());
  });
}

export function listenToBotLogs(botId: string, callback: (log: BotLog) => void) {
  const db = getDb();
  if (!db) return () => {};

  const logsRef = ref(db, `bots/${botId}/logs`);
  
  return onChildAdded(logsRef, (snapshot) => {
    const log = snapshot.val();
    if (log) {
      callback({
        id: snapshot.key!,
        ...log,
      });
    }
  });
}

// ===== COMMAND OPERATIONS =====

/**
 * @deprecated Use REST API /api/bots/command instead
 * This function writes directly to Firebase which is no longer monitored by node servers.
 * Node servers now poll commands via REST API.
 */
export async function sendBotCommand(nodeId: string, action: 'start' | 'stop' | 'restart' | 'exec' | 'delete', botId: string, payload?: any) {
  const db = getDb();
  if (!db) throw new Error('Firebase not initialized');

  const commandsRef = ref(db, `nodes/${nodeId}/commands`);
  const newCommandRef = push(commandsRef);
  
  await set(newCommandRef, {
    action,
    bot_id: botId,
    payload: payload || {},
    timestamp: Date.now(),
  });
  
  return newCommandRef.key;
}

export function listenToCommandResult(commandId: string, callback: (result: any) => void) {
  const db = getDb();
  if (!db) return () => {};

  const resultRef = ref(db, `commands/${commandId}/result`);
  
  console.log('[Firebase] Listening to command result:', commandId, 'at path:', `commands/${commandId}/result`);
  
  return onValue(resultRef, (snapshot) => {
    const result = snapshot.val();
    console.log('[Firebase] Command result update:', commandId, result);
    
    if (result) {
      callback(result);
    }
  });
}

// ===== CLEANUP =====

export async function deleteBotData(botId: string) {
  const db = getDb();
  if (!db) return;

  await remove(ref(db, `bots/${botId}`));
}

export async function clearBotLogs(botId: string) {
  const db = getDb();
  if (!db) return;

  await remove(ref(db, `bots/${botId}/logs`));
}

export async function deleteNode(nodeId: string) {
  const db = getDb();
  if (!db) return;

  await remove(ref(db, `nodes/${nodeId}`));
}

// ===== UTILITY =====

export async function getNodeOnlineStatus(nodeId: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  const statusRef = ref(db, `nodes/${nodeId}/status/online`);
  const snapshot = await get(statusRef);
  return snapshot.val() === true;
}

export async function getAllBots(): Promise<Record<string, Bot>> {
  const db = getDb();
  if (!db) return {};

  const botsRef = ref(db, 'bots');
  const snapshot = await get(botsRef);
  return snapshot.val() || {};
}

export async function markLogsCleared(botId: string) {
  const db = getDb();
  if (!db) return;

  const clearedAt = new Date().toISOString();
  await set(ref(db, `bots/${botId}/logs_cleared_at`), clearedAt);
  return clearedAt;
}
