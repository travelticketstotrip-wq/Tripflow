-- Add worksheet configuration to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS worksheet_count integer DEFAULT 2;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS worksheet_names jsonb DEFAULT '["MASTER DATA", "BACKEND SHEET"]'::jsonb;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS column_mappings jsonb DEFAULT '{
  "trip_id": "A",
  "date": "B",
  "consultant": "C",
  "status": "D",
  "traveller_name": "E",
  "travel_date": "G",
  "travel_state": "H",
  "remarks": "K",
  "nights": "L",
  "pax": "M",
  "hotel_category": "N",
  "meal_plan": "O",
  "phone": "P",
  "email": "Q"
}'::jsonb;

-- Add session tracking for custom auth
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (user_id = auth.uid());

-- Add password field to profiles for custom auth
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- Update leads table to match new sheet structure
ALTER TABLE leads DROP COLUMN IF EXISTS sync_to_sheet;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS remark_history jsonb DEFAULT '[]'::jsonb;