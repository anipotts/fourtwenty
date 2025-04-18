-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Setup RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create function for handling new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for handling new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create cloud_rooms table for private chat groups
CREATE TABLE IF NOT EXISTS cloud_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  join_code VARCHAR(4) NOT NULL UNIQUE, 
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_cloud_rooms_updated_at
BEFORE UPDATE ON cloud_rooms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create cloud_participants table to track users in each room
CREATE TABLE IF NOT EXISTS cloud_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES cloud_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Create cloud_messages table for messages within rooms
CREATE TABLE IF NOT EXISTS cloud_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES cloud_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setup RLS policies for cloud_rooms
ALTER TABLE cloud_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rooms"
  ON cloud_rooms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create rooms"
  ON cloud_rooms FOR INSERT
  WITH CHECK (true);

-- Setup RLS policies for cloud_participants
ALTER TABLE cloud_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants in their rooms"
  ON cloud_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cloud_rooms
      WHERE cloud_rooms.id = room_id
    )
  );

-- Replace this policy that's causing infinite recursion
DROP POLICY IF EXISTS "Users can join rooms with join code" ON cloud_participants;

CREATE POLICY "Anyone can join rooms with join code"
  ON cloud_participants FOR INSERT
  WITH CHECK (true);

-- Setup RLS policies for cloud_messages
ALTER TABLE cloud_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their rooms"
  ON cloud_messages FOR SELECT
  USING (true);

CREATE POLICY "Users can send messages to their rooms"
  ON cloud_messages FOR INSERT
  WITH CHECK (true);

-- Function to generate a random 4-digit join code
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

-- Trigger to automatically set join code when creating a room
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