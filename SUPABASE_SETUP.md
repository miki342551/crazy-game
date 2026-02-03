# Supabase Database Setup

## Run this SQL in Supabase

1. Go to your Supabase project: https://ifqkqukidrcjtnxbufal.supabase.co
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. **Copy and paste this SQL:**

```sql
-- Create game rooms table
CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  game_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast room lookups
CREATE INDEX IF NOT EXISTS idx_room_code ON game_rooms(room_code);

-- Enable Row Level Security
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read and write (for multiplayer game)
DROP POLICY IF EXISTS "Enable read access for all users" ON game_rooms;
CREATE POLICY "Enable read access for all users" ON game_rooms
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON game_rooms;
CREATE POLICY "Enable insert access for all users" ON game_rooms
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON game_rooms;
CREATE POLICY "Enable update access for all users" ON game_rooms
  FOR UPDATE USING (true);

-- Enable realtime (CRITICAL for multiplayer sync)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'game_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
  END IF;
END $$;
```

> [!IMPORTANT]
> Ensure **"Realtime"** is enabled for the `game_rooms` table in your Supabase Dashboard (Database -> Replication -> supabase_realtime -> Source).

5. Click **"Run"** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

**Once done, type "done" here and I'll continue!**
