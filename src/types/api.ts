// Node Management API Types
export interface Node {
  id: string;
  name: string;
  location: string;
  ip_address: string;
  status: 'online' | 'offline' | 'maintenance';
  last_heartbeat: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NodeStats {
  id: string;
  node_id: string;
  cpu_usage: number;
  ram_used: number;
  ram_total: number;
  disk_used: number;
  disk_total: number;
  network_upload: number;
  network_download: number;
  bot_count: number;
  created_at: string;
}

// Bot Management API Types
export interface Bot {
  id: string;
  user_id: string;
  node_id: string;
  username: string;
  server_ip: string;
  server_port: number;
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping';
  auto_reconnect: boolean;
  enabled: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BotLog {
  id: string;
  bot_id: string;
  log_type: 'info' | 'warn' | 'error' | 'server' | 'chat';
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}

// Command Queue Types
export interface Command {
  id: string;
  user_id: string;
  node_id: string;
  bot_id: string | null;
  action: 'start' | 'stop' | 'restart' | 'exec' | 'create' | 'delete';
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result: Record<string, any>;
  error: string | null;
  created_at: string;
  processed_at: string | null;
  completed_at: string | null;
}

// API Request/Response Types
export interface NodeRegisterRequest {
  name: string;
  location: string;
  ip_address: string;
  secret_key: string;
}

export interface NodeHeartbeatRequest {
  node_id: string;
  secret_key: string;
  stats: {
    cpu_usage: number;
    ram_used: number;
    ram_total: number;
    disk_used: number;
    disk_total: number;
    network_upload: number;
    network_download: number;
    bot_count: number;
  };
}

export interface CreateBotRequest {
  node_id: string;
  username: string;
  server_ip: string;
  server_port?: number;
  auto_reconnect?: boolean;
}

export interface BotCommandRequest {
  bot_id: string;
  action: 'start' | 'stop' | 'restart' | 'exec';
  command?: string; // for exec action
}

export interface CommandPollResponse {
  commands: Command[];
}

export interface CommandUpdateRequest {
  command_id: string;
  status: 'processing' | 'completed' | 'failed';
  result?: Record<string, any>;
  error?: string;
}
