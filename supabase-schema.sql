-- ========================================
-- 清空数据库对象 - 恢复到初始状态
-- ========================================

-- 删除触发器
DROP TRIGGER IF EXISTS update_game_tables_updated_at ON game_tables;

-- 删除函数
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS reset_game_tables_on_server_restart();
DROP FUNCTION IF EXISTS register_server_instance(TEXT);

-- 删除策略
DROP POLICY IF EXISTS "Allow all operations on game_tables" ON game_tables;

-- 删除索引
DROP INDEX IF EXISTS idx_game_tables_table_number;
DROP INDEX IF EXISTS idx_game_tables_game_state;

-- 删除表
DROP TABLE IF EXISTS game_tables CASCADE;
DROP TABLE IF EXISTS server_status CASCADE;

-- ========================================
-- 重新创建数据库对象
-- ========================================

-- Create game_tables table for storing game state
CREATE TABLE IF NOT EXISTS game_tables (
  id SERIAL PRIMARY KEY,
  table_number INTEGER NOT NULL UNIQUE,
  player1_id TEXT,
  player1_nickname TEXT,
  player1_avatar TEXT,
  player1_ready BOOLEAN DEFAULT FALSE,
  player2_id TEXT,
  player2_nickname TEXT,
  player2_avatar TEXT,
  player2_ready BOOLEAN DEFAULT FALSE,
  game_state TEXT DEFAULT 'waiting' CHECK (game_state IN ('waiting', 'playing', 'finished')),
  board JSONB DEFAULT '[[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]]',
  current_player INTEGER DEFAULT 1 CHECK (current_player IN (1, 2)),
  winner INTEGER CHECK (winner IN (1, 2)),
  last_move_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_game_tables_table_number ON game_tables(table_number);
CREATE INDEX IF NOT EXISTS idx_game_tables_game_state ON game_tables(game_state);

-- Enable Row Level Security (RLS)
ALTER TABLE game_tables ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this based on your needs)
CREATE POLICY "Allow all operations on game_tables" ON game_tables
  FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS '
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
' LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_game_tables_updated_at
    BEFORE UPDATE ON game_tables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create server_status table to track server restarts
CREATE TABLE IF NOT EXISTS server_status (
  id SERIAL PRIMARY KEY,
  server_instance_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to reset all game tables on server restart
CREATE OR REPLACE FUNCTION reset_game_tables_on_server_restart()
RETURNS VOID AS '
BEGIN
  -- Delete all existing game tables
  DELETE FROM game_tables;
  
  -- Insert fresh game tables (8 tables by default)
  INSERT INTO game_tables (table_number) 
  SELECT generate_series(1, 8);
  
END;
' LANGUAGE plpgsql;

-- Create function to register server instance and cleanup if needed
CREATE OR REPLACE FUNCTION register_server_instance(instance_id TEXT)
RETURNS BOOLEAN AS '
DECLARE
  existing_instance TEXT;
  should_reset BOOLEAN := FALSE;
BEGIN
  -- Check if this is a new server instance
  SELECT server_instance_id INTO existing_instance 
  FROM server_status 
  WHERE server_instance_id = instance_id;
  
  IF existing_instance IS NULL THEN
    -- New server instance, check if we need to cleanup old instances
    -- If there are any existing instances, it means server restarted
    IF EXISTS (SELECT 1 FROM server_status LIMIT 1) THEN
      should_reset := TRUE;
      -- Clear old instances
      DELETE FROM server_status;
    END IF;
    
    -- Register new instance
    INSERT INTO server_status (server_instance_id) VALUES (instance_id);
    
    -- Reset game tables if this is a server restart
    IF should_reset THEN
      PERFORM reset_game_tables_on_server_restart();
    END IF;
    
    RETURN should_reset;
  ELSE
    -- Update heartbeat for existing instance
    UPDATE server_status 
    SET last_heartbeat = NOW() 
    WHERE server_instance_id = instance_id;
    
    RETURN FALSE;
  END IF;
END;
' LANGUAGE plpgsql;

-- Insert initial game tables (8 tables by default)
INSERT INTO game_tables (table_number) 
SELECT generate_series(1, 8)
ON CONFLICT (table_number) DO NOTHING;

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE game_tables;