import { firebaseAdmin } from './firebase-admin';

// Get Realtime Database instance
function getDb() {
  if (!firebaseAdmin.apps.length) {
    throw new Error('Firebase Admin not initialized. Check your environment variables.');
  }
  return firebaseAdmin.database();
}

// Nodes
export async function getAllNodes() {
  try {
    const snapshot = await getDb().ref('nodes').once('value');
    const data = snapshot.val();
    
    if (!data) return { data: [], error: null };
    
    // Convert object to array with IDs, filter out invalid entries
    const nodes = Object.keys(data)
      .map(id => {
        const node = data[id];
        
        // Skip if node is invalid or missing required fields
        if (!node || typeof node !== 'object' || !node.name || !node.location) {
          console.warn(`[RTDB] Skipping invalid node ${id}:`, node);
          return null;
        }
        
        return {
          id,
          name: node.name || '',
          location: node.location || '',
          ip_address: node.ip_address || 'N/A',
          status: typeof node.status === 'string' ? node.status : 'offline',
          last_heartbeat: node.last_heartbeat || null,
          created_at: node.created_at || Date.now(),
          access_token: node.access_token || null,
          created_by: node.created_by || null
        };
      })
      .filter(node => node !== null); // Remove null entries
    
    return { data: nodes, error: null };
  } catch (err: any) {
    console.error('[RTDB] getAllNodes error:', err);
    return { data: null, error: err };
  }
}

export async function getNodeById(nodeId: string) {
  try {
    const snapshot = await getDb().ref(`nodes/${nodeId}`).once('value');
    const node = snapshot.val();
    if (!node) return { data: null, error: null };
    
    return { 
      data: {
        id: nodeId,
        name: node.name || '',
        location: node.location || '',
        ip_address: node.ip_address || '',
        status: typeof node.status === 'string' ? node.status : 'offline',
        last_heartbeat: node.last_heartbeat || null,
        created_at: node.created_at || Date.now(),
        access_token: node.access_token || null,
        created_by: node.created_by || null
      }, 
      error: null 
    };
  } catch (err: any) {
    console.error('[RTDB] getNodeById error:', err);
    return { data: null, error: err };
  }
}

export async function createNode(node: any) {
  try {
    // Validate required fields
    if (!node.name || !node.location) {
      throw new Error('Node name and location are required');
    }
    
    const ref = getDb().ref('nodes').push();
    const nodeData = {
      name: node.name,
      location: node.location,
      ip_address: node.ip_address || 'auto',
      status: 'offline',
      last_heartbeat: null,
      created_at: node.created_at || Date.now(),
      access_token: node.access_token || null,
      created_by: node.created_by || null,
    };
    
    console.log('[RTDB] Creating node:', { id: ref.key, name: nodeData.name, location: nodeData.location });
    
    await ref.set(nodeData);
    
    console.log('[RTDB] Node created successfully:', ref.key);
    
    return { data: { id: ref.key, ...nodeData }, error: null };
  } catch (err: any) {
    console.error('[RTDB] createNode error:', err);
    return { data: null, error: err };
  }
}

export async function updateNode(nodeId: string, updates: any) {
  try {
    const cleanUpdates: any = {};
    if (updates.name !== undefined) cleanUpdates.name = updates.name;
    if (updates.location !== undefined) cleanUpdates.location = updates.location;
    if (updates.ip_address !== undefined) cleanUpdates.ip_address = updates.ip_address;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.last_heartbeat !== undefined) cleanUpdates.last_heartbeat = updates.last_heartbeat;
    if (updates.access_token !== undefined) cleanUpdates.access_token = updates.access_token;
    if (updates.created_by !== undefined) cleanUpdates.created_by = updates.created_by;
    
    await getDb().ref(`nodes/${nodeId}`).update(cleanUpdates);
    const snapshot = await getDb().ref(`nodes/${nodeId}`).once('value');
    const node = snapshot.val();
    
    return { 
      data: {
        id: nodeId,
        name: node.name || '',
        location: node.location || '',
        ip_address: node.ip_address || '',
        status: typeof node.status === 'string' ? node.status : 'offline',
        last_heartbeat: node.last_heartbeat || null,
        created_at: node.created_at || Date.now(),
        access_token: node.access_token || null,
        created_by: node.created_by || null
      }, 
      error: null 
    };
  } catch (err: any) {
    console.error('[RTDB] updateNode error:', err);
    return { data: null, error: err };
  }
}

export async function deleteNode(nodeId: string) {
  try {
    await getDb().ref(`nodes/${nodeId}`).remove();
    return { data: true, error: null };
  } catch (err: any) {
    console.error('[RTDB] deleteNode error:', err);
    return { data: null, error: err };
  }
}

export async function getOnlineNodes() {
  try {
    const snapshot = await getDb().ref('nodes').orderByChild('status').equalTo('online').once('value');
    const data = snapshot.val();
    
    if (!data) return { data: [], error: null };
    
    const nodes = Object.keys(data).map(id => {
      const node = data[id];
      return {
        id,
        name: node.name || '',
        location: node.location || '',
        ip_address: node.ip_address || '',
        status: 'online',
        last_heartbeat: node.last_heartbeat || null,
        created_at: node.created_at || Date.now(),
        access_token: node.access_token || null,
        created_by: node.created_by || null
      };
    });
    
    return { data: nodes, error: null };
  } catch (err: any) {
    console.error('[RTDB] getOnlineNodes error:', err);
    return { data: null, error: err };
  }
}

export async function getNodeByAccessToken(accessToken: string) {
  try {
    console.log('[RTDB] Looking for node with access_token:', accessToken.substring(0, 10) + '...');
    
    // Query by access_token at root level (not nested)
    const snapshot = await getDb().ref('nodes').orderByChild('access_token').equalTo(accessToken).limitToFirst(1).once('value');
    const data = snapshot.val();
    
    console.log('[RTDB] Query result:', data ? 'Found' : 'Not found');
    
    if (!data) return { data: null, error: null };
    
    const nodeId = Object.keys(data)[0];
    const node = data[nodeId];
    
    return { 
      data: {
        id: nodeId,
        name: node.name || '',
        location: node.location || '',
        ip_address: node.ip_address || '',
        status: typeof node.status === 'string' ? node.status : 'offline',
        last_heartbeat: node.last_heartbeat || null,
        created_at: node.created_at || Date.now(),
        access_token: node.access_token || null,
        created_by: node.created_by || null
      }, 
      error: null 
    };
  } catch (err: any) {
    console.error('[RTDB] getNodeByAccessToken error:', err);
    return { data: null, error: err };
  }
}

// Node Stats
export async function getLatestNodeStats(nodeId: string) {
  try {
    const snapshot = await getDb().ref('node_stats').orderByChild('node_id').equalTo(nodeId).limitToLast(1).once('value');
    const data = snapshot.val();
    
    if (!data) return { data: null, error: null };
    
    const statId = Object.keys(data)[0];
    return { data: { id: statId, ...data[statId] }, error: null };
  } catch (err: any) {
    console.error('[RTDB] getLatestNodeStats error:', err);
    return { data: null, error: err };
  }
}

export async function addNodeStats(nodeId: string, stats: any) {
  try {
    const ref = getDb().ref('node_stats').push();
    const statsData = {
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
    };
    await ref.set(statsData);
    return { data: { id: ref.key, ...statsData }, error: null };
  } catch (err: any) {
    console.error('[RTDB] addNodeStats error:', err);
    return { data: null, error: err };
  }
}

// Bots
export async function getBotCountForNode(nodeId: string) {
  try {
    const snapshot = await getDb().ref('bots').orderByChild('node_id').equalTo(nodeId).once('value');
    const data = snapshot.val();
    const count = data ? Object.keys(data).length : 0;
    return { data: count, error: null };
  } catch (err: any) {
    console.error('[RTDB] getBotCountForNode error:', err);
    return { data: null, error: err };
  }
}

export async function getBotsByUser(userId: string) {
  try {
    const snapshot = await getDb().ref('bots').orderByChild('user_id').equalTo(userId).once('value');
    const data = snapshot.val();
    
    if (!data) return { data: [], error: null };
    
    const bots = Object.keys(data).map(id => ({
      id,
      ...data[id]
    }));
    
    return { data: bots, error: null };
  } catch (err: any) {
    console.error('[RTDB] getBotsByUser error:', err);
    return { data: null, error: err };
  }
}

export async function getBotsByNode(nodeId: string) {
  try {
    const snapshot = await getDb().ref('bots').orderByChild('node_id').equalTo(nodeId).once('value');
    const data = snapshot.val();
    
    if (!data) return { data: [], error: null };
    
    const bots = Object.keys(data).map(id => ({
      id,
      ...data[id]
    }));
    
    return { data: bots, error: null };
  } catch (err: any) {
    console.error('[RTDB] getBotsByNode error:', err);
    return { data: null, error: err };
  }
}

export async function getBotById(botId: string) {
  try {
    const snapshot = await getDb().ref(`bots/${botId}`).once('value');
    const data = snapshot.val();
    return { data: data ? { id: botId, ...data } : null, error: null };
  } catch (err: any) {
    console.error('[RTDB] getBotById error:', err);
    return { data: null, error: err };
  }
}

export async function createBot(bot: any) {
  try {
    const ref = getDb().ref('bots').push();
    const botData = {
      ...bot,
      created_at: bot.created_at || Date.now()
    };
    console.log('[RTDB] Creating bot with data:', botData);
    console.log('[RTDB] Bot node_id:', botData.node_id);
    await ref.set(botData);
    return { data: { id: ref.key, ...botData }, error: null };
  } catch (err: any) {
    console.error('[RTDB] createBot error:', err);
    return { data: null, error: err };
  }
}

export async function updateBot(botId: string, updates: any) {
  try {
    await getDb().ref(`bots/${botId}`).update(updates);
    const snapshot = await getDb().ref(`bots/${botId}`).once('value');
    const data = snapshot.val();
    return { data: { id: botId, ...data }, error: null };
  } catch (err: any) {
    console.error('[RTDB] updateBot error:', err);
    return { data: null, error: err };
  }
}

export async function deleteBot(botId: string) {
  try {
    await getDb().ref(`bots/${botId}`).remove();
    return { data: true, error: null };
  } catch (err: any) {
    console.error('[RTDB] deleteBot error:', err);
    return { data: null, error: err };
  }
}

// Bot Logs
export async function addBotLog(botId: string, log: any) {
  try {
    const ref = getDb().ref(`bot_logs/${botId}`).push();
    const logData = { ...log, created_at: Date.now() };
    await ref.set(logData);
    return { data: { id: ref.key, ...logData }, error: null };
  } catch (err: any) {
    console.error('[RTDB] addBotLog error:', err);
    return { data: null, error: err };
  }
}

export async function getBotLogs(botId: string, limit = 100) {
  try {
    const snapshot = await getDb().ref(`bot_logs/${botId}`).orderByChild('created_at').limitToLast(limit).once('value');
    const data = snapshot.val();
    
    if (!data) return { data: [], error: null };
    
    const logs = Object.keys(data).map(id => ({
      id,
      ...data[id]
    })).reverse(); // Most recent first
    
    return { data: logs, error: null };
  } catch (err: any) {
    console.error('[RTDB] getBotLogs error:', err);
    return { data: null, error: err };
  }
}

export async function clearBotLogs(botId: string) {
  try {
    await getDb().ref(`bot_logs/${botId}`).remove();
    await getDb().ref(`bots/${botId}/logs_cleared_at`).set(new Date().toISOString());
    return { data: true, error: null };
  } catch (err: any) {
    console.error('[RTDB] clearBotLogs error:', err);
    return { data: null, error: err };
  }
}

// Commands
export async function createCommand(command: any) {
  try {
    const ref = getDb().ref('commands').push();
    const commandData = {
      user_id: command.user_id,
      node_id: command.node_id,
      bot_id: command.bot_id,
      action: command.action,
      payload: command.payload || {},
      status: 'pending',
      created_at: Date.now(),
      processed_at: null,
    };
    await ref.set(commandData);
    return { data: { id: ref.key, ...commandData }, error: null };
  } catch (err: any) {
    console.error('[RTDB] createCommand error:', err);
    return { data: null, error: err };
  }
}

export async function getCommandsByNode(nodeId: string, limit = 50) {
  try {
    const snapshot = await getDb().ref('commands')
      .orderByChild('node_id')
      .equalTo(nodeId)
      .limitToLast(limit)
      .once('value');
    const data = snapshot.val();
    
    if (!data) return { data: [], error: null };
    
    const commands = Object.keys(data).map(id => ({
      id,
      ...data[id]
    })).reverse(); // Most recent first
    
    return { data: commands, error: null };
  } catch (err: any) {
    console.error('[RTDB] getCommandsByNode error:', err);
    return { data: null, error: err };
  }
}

export async function getPendingCommandsForNode(nodeId: string) {
  try {
    const snapshot = await getDb().ref('commands')
      .orderByChild('node_id')
      .equalTo(nodeId)
      .once('value');
    const data = snapshot.val();
    
    if (!data) return { data: [], error: null };
    
    // Filter only pending commands
    const commands = Object.keys(data)
      .map(id => ({ id, ...data[id] }))
      .filter(cmd => cmd.status === 'pending')
      .sort((a, b) => a.created_at - b.created_at); // Oldest first
    
    return { data: commands, error: null };
  } catch (err: any) {
    console.error('[RTDB] getPendingCommandsForNode error:', err);
    return { data: null, error: err };
  }
}

export async function updateCommand(commandId: string, updates: any) {
  try {
    await getDb().ref(`commands/${commandId}`).update(updates);
    const snapshot = await getDb().ref(`commands/${commandId}`).once('value');
    const data = snapshot.val();
    return { data: { id: commandId, ...data }, error: null };
  } catch (err: any) {
    console.error('[RTDB] updateCommand error:', err);
    return { data: null, error: err };
  }
}

export async function deleteCommand(commandId: string) {
  try {
    await getDb().ref(`commands/${commandId}`).remove();
    return { data: true, error: null };
  } catch (err: any) {
    console.error('[RTDB] deleteCommand error:', err);
    return { data: null, error: err };
  }
}
