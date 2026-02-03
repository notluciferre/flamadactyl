-- CakraNode Database Schema for Supabase

-- 1. Nodes Table
-- Stores information about each node server
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')),
    last_heartbeat TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bots Table
-- Stores bot instances (each user can have multiple bots on different nodes)
CREATE TABLE IF NOT EXISTS bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    server_ip VARCHAR(255) NOT NULL,
    server_port INTEGER NOT NULL DEFAULT 19132,
    status VARCHAR(20) DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'error', 'starting', 'stopping')),
    auto_reconnect BOOLEAN DEFAULT true,
    enabled BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(node_id, username, server_ip)
);

-- 3. Commands Table
-- Queue system for commands from web to node
CREATE TABLE IF NOT EXISTS commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('start', 'stop', 'restart', 'exec', 'create', 'delete')),
    payload JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    result JSONB DEFAULT '{}',
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 4. Bot Logs Table
-- Store bot console output and events
CREATE TABLE IF NOT EXISTS bot_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    log_type VARCHAR(20) NOT NULL CHECK (log_type IN ('info', 'warn', 'error', 'server', 'chat')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Node Stats Table
-- Store node resource metrics
CREATE TABLE IF NOT EXISTS node_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    cpu_usage FLOAT NOT NULL,
    ram_used BIGINT NOT NULL,
    ram_total BIGINT NOT NULL,
    disk_used BIGINT NOT NULL,
    disk_total BIGINT NOT NULL,
    network_upload BIGINT DEFAULT 0,
    network_download BIGINT DEFAULT 0,
    bot_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
CREATE INDEX IF NOT EXISTS idx_nodes_last_heartbeat ON nodes(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_bots_user_id ON bots(user_id);
CREATE INDEX IF NOT EXISTS idx_bots_node_id ON bots(node_id);
CREATE INDEX IF NOT EXISTS idx_bots_status ON bots(status);
CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
CREATE INDEX IF NOT EXISTS idx_commands_node_id_status ON commands(node_id, status);
CREATE INDEX IF NOT EXISTS idx_bot_logs_bot_id ON bot_logs(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_logs_created_at ON bot_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_node_stats_node_id ON node_stats(node_id);
CREATE INDEX IF NOT EXISTS idx_node_stats_created_at ON node_stats(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_stats ENABLE ROW LEVEL SECURITY;

-- Nodes policies (admin only can manage nodes)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all nodes" ON nodes;
DROP POLICY IF EXISTS "Authenticated users can view nodes" ON nodes;

-- All authenticated users can view nodes (needed for joins)
CREATE POLICY "Authenticated users can view nodes" ON nodes
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can insert nodes" ON nodes;
CREATE POLICY "Admin can insert nodes" ON nodes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@cakranode.tech'
        )
    );

DROP POLICY IF EXISTS "Admin can update nodes" ON nodes;
CREATE POLICY "Admin can update nodes" ON nodes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@cakranode.tech'
        )
    );

DROP POLICY IF EXISTS "Admin can delete nodes" ON nodes;
CREATE POLICY "Admin can delete nodes" ON nodes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@cakranode.tech'
        )
    );

-- Bots policies (users can only manage their own bots)
CREATE POLICY "Users can view their own bots" ON bots
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bots" ON bots
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bots" ON bots
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bots" ON bots
    FOR DELETE USING (auth.uid() = user_id);

-- Commands policies
CREATE POLICY "Users can view their own commands" ON commands
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own commands" ON commands
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bot logs policies
CREATE POLICY "Users can view logs of their own bots" ON bot_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bots 
            WHERE bots.id = bot_logs.bot_id 
            AND bots.user_id = auth.uid()
        )
    );

-- Node stats policies (all authenticated users can view stats)
CREATE POLICY "Authenticated users can view node stats" ON node_stats
    FOR SELECT USING (auth.role() = 'authenticated');

-- Functions to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for auto-updating updated_at
CREATE TRIGGER update_nodes_updated_at BEFORE UPDATE ON nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON bots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
