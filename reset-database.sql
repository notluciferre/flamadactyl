-- RESET DATABASE SCRIPT
-- Run this to clear all data and reset schema

-- Drop all triggers
DROP TRIGGER IF EXISTS update_nodes_updated_at ON nodes;
DROP TRIGGER IF EXISTS update_bots_updated_at ON bots;

-- Drop all policies on nodes
DROP POLICY IF EXISTS "Authenticated users can view nodes" ON nodes;
DROP POLICY IF EXISTS "Admin can insert nodes" ON nodes;
DROP POLICY IF EXISTS "Admin can update nodes" ON nodes;
DROP POLICY IF EXISTS "Admin can delete nodes" ON nodes;

-- Drop all policies on bots
DROP POLICY IF EXISTS "Users can view their own bots" ON bots;
DROP POLICY IF EXISTS "Users can insert their own bots" ON bots;
DROP POLICY IF EXISTS "Users can update their own bots" ON bots;
DROP POLICY IF EXISTS "Users can delete their own bots" ON bots;

-- Drop all policies on commands
DROP POLICY IF EXISTS "Users can view their own commands" ON commands;
DROP POLICY IF EXISTS "Users can insert their own commands" ON commands;

-- Drop all policies on bot_logs
DROP POLICY IF EXISTS "Users can view logs of their own bots" ON bot_logs;

-- Drop all policies on node_stats
DROP POLICY IF EXISTS "Authenticated users can view node stats" ON node_stats;

-- Drop all tables (CASCADE akan drop foreign keys)
DROP TABLE IF EXISTS node_stats CASCADE;
DROP TABLE IF EXISTS bot_logs CASCADE;
DROP TABLE IF EXISTS commands CASCADE;
DROP TABLE IF EXISTS bots CASCADE;
DROP TABLE IF EXISTS nodes CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Now run supabase-schema.sql to recreate everything
