/**
 * Firebase Realtime API Client
 * Replaces HTTP polling with real-time Firebase listeners
 */

import { ref, onValue, onChildAdded, push, set, remove, get } from 'firebase/database';
import { getFirebaseDatabase } from './firebase';
import { supabase } from './supabase';
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

  let unsubscribe: (() => void) | null = null;

  // Get nodes from Supabase first
  const fetchNodes = async () => {
    try {
      const { data: nodesData, error } = await supabase
        .from('nodes')
        .select('*');
      
      if (error) {
        console.error('[Firebase API] Failed to fetch nodes from Supabase:', error);
        return;
      }
      
      if (!nodesData) return;
      
      // Listen to Firebase for real-time status
      const nodesRef = ref(db, 'nodes');
      unsubscribe = onValue(nodesRef, (snapshot) => {
        const firebaseData = snapshot.val() || {};
        
        // Merge Supabase data (static) with Firebase data (real-time status)
        const mergedNodes: Record<string, Node> = {};
        nodesData.forEach((node) => {
          mergedNodes[node.id] = {
            ...node,
            status: firebaseData[node.id]?.status || { online: false, lastUpdate: 0 },
          };
        });
        
        callback(mergedNodes);
      });
    } catch (err) {
      console.error('[Firebase API] Error in listenToNodes:', err);
    }
  };
  
  fetchNodes();
  
  // Return proper unsubscribe function
  return () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
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

  let unsubscribe: (() => void) | null = null;

  // Get user's bots from Supabase first
  const fetchUserBots = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('[Firebase API] Failed to get user:', userError);
        callback({}); // Return empty bots if no user
        return;
      }
      
      console.log('[Firebase API] Fetching bots for user:', user.id);
      
      const { data: userBots, error: botsError } = await supabase
        .from('bots')
        .select('*')
        .eq('user_id', user.id);
      
      if (botsError) {
        console.error('[Firebase API] Failed to fetch bots from Supabase:', botsError);
        callback({}); // Return empty bots on error
        return;
      }
      
      if (!userBots || userBots.length === 0) {
        console.log('[Firebase API] No bots found for user');
        callback({}); // Return empty bots if none found
        return;
      }
      
      console.log('[Firebase API] Found', userBots.length, 'bots, setting up Firebase listener');
      
      // Listen to Firebase for real-time status
      const botsRef = ref(db, 'bots');
      unsubscribe = onValue(botsRef, (snapshot) => {
        const firebaseData = snapshot.val() || {};
        
        // Merge Supabase data (static) with Firebase data (real-time status)
        const mergedBots: Record<string, Bot> = {};
        userBots.forEach((bot) => {
          const firebaseStatus = firebaseData[bot.id]?.status || { status: 'stopped', error: null, timestamp: 0 };
          
          // Skip bots with "deleted" status from Firebase
          if (firebaseStatus.status === 'deleted') {
            return;
          }
          
          mergedBots[bot.id] = {
            ...bot,
            status: firebaseStatus,
          };
        });
        
        console.log('[Firebase API] Merged bots count:', Object.keys(mergedBots).length);
        callback(mergedBots);
      });
    } catch (err) {
      console.error('[Firebase API] Error in listenToBots:', err);
    }
  };
  
  fetchUserBots();
  
  // Return proper unsubscribe function
  return () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
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
