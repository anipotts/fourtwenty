-- Drop existing cloud tables and recreate them from scratch
DROP TABLE IF EXISTS cloud_messages CASCADE;
DROP TABLE IF EXISTS cloud_participants CASCADE;
DROP TABLE IF EXISTS cloud_rooms CASCADE;

-- Drop functions and triggers related to these tables
DROP FUNCTION IF EXISTS generate_join_code CASCADE;
DROP FUNCTION IF EXISTS set_join_code_on_insert CASCADE;

-- Recreate tables with simpler structure
-- Create cloud_rooms table
CREATE TABLE cloud_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  join_code VARCHAR(4) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cloud_participants table 
-- Note: removed user_id field and foreign key constraints for simplicity
CREATE TABLE cloud_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES cloud_rooms(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cloud_messages table
CREATE TABLE cloud_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES cloud_rooms(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to generate join codes
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS VARCHAR(4) AS $$
DECLARE
  code VARCHAR(4);
  existing_code BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 4-digit number
    code := LPAD(FLOOR(random() * 10000)::TEXT, 4, '0');
    
    -- Check if this code already exists
    SELECT EXISTS (
      SELECT 1 FROM cloud_rooms WHERE join_code = code
    ) INTO existing_code;
    
    -- Exit the loop if the code is unique
    EXIT WHEN NOT existing_code;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating join codes
CREATE OR REPLACE FUNCTION set_join_code_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := generate_join_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_join_code
BEFORE INSERT ON cloud_rooms
FOR EACH ROW
EXECUTE FUNCTION set_join_code_on_insert();

-- Set up RLS policies
-- Enable RLS on all tables
ALTER TABLE cloud_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_messages ENABLE ROW LEVEL SECURITY;

-- Create very simple policies that allow all operations
-- This avoids the complex policy dependencies that caused infinite recursion

-- Policies for cloud_rooms
CREATE POLICY "Allow full access to cloud_rooms" 
  ON cloud_rooms FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Policies for cloud_participants
CREATE POLICY "Allow full access to cloud_participants" 
  ON cloud_participants FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Policies for cloud_messages
CREATE POLICY "Allow full access to cloud_messages" 
  ON cloud_messages FOR ALL 
  USING (true) 
  WITH CHECK (true); 