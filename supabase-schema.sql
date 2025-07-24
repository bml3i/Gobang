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

-- Insert initial game tables (8 tables by default)
INSERT INTO game_tables (table_number) 
SELECT generate_series(1, 8)
ON CONFLICT (table_number) DO NOTHING;

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE game_tables;