-- Auth user profile fields (Supabase Auth handles credentials)
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_user_id UUID UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Migrate legacy display_name to first_name
UPDATE users SET first_name = display_name WHERE first_name IS NULL AND display_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_supabase_user_id ON users(supabase_user_id);

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
