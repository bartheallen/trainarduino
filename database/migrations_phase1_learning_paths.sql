-- Phase 1: Learning Path Generation Tables
-- Creates tables for storing and tracking dynamic learning paths

-- Learning Paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estimated_total_minutes INTEGER NOT NULL DEFAULT 0,
  current_node_index INTEGER NOT NULL DEFAULT 0,
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_nodes CHECK (jsonb_array_length(nodes) > 0),
  CONSTRAINT valid_index CHECK (current_node_index >= 0)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_created_at ON learning_paths(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_created ON learning_paths(user_id, created_at DESC);

-- RLS policies
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own paths" ON learning_paths
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create paths for themselves" ON learning_paths
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own paths" ON learning_paths
  FOR UPDATE USING (auth.uid() = user_id);

-- Learning Path Events table (for analytics and debugging)
CREATE TABLE IF NOT EXISTS learning_path_events (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  path_id TEXT NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_path_events_user_id ON learning_path_events(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_events_path_id ON learning_path_events(path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_events_created_at ON learning_path_events(created_at DESC);

ALTER TABLE learning_path_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own path events" ON learning_path_events
  FOR SELECT USING (auth.uid() = user_id);
