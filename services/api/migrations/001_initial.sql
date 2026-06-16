-- Household Inventory MVP schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS household_members (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (household_id, user_id)
);

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  layout_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS storage_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('shelf','bin','drawer','dresser','cabinet','closet','desk','other')),
  x DOUBLE PRECISION NOT NULL CHECK (x >= 0 AND x <= 1),
  y DOUBLE PRECISION NOT NULL CHECK (y >= 0 AND y <= 1),
  width DOUBLE PRECISION NOT NULL CHECK (width >= 0 AND width <= 1),
  height DOUBLE PRECISION NOT NULL CHECK (height >= 0 AND height <= 1),
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_area_id UUID NOT NULL REFERENCES storage_areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  photo_url TEXT,
  ai_metadata JSONB,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, ''))
  ) STORED,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_area_id UUID NOT NULL REFERENCES storage_areas(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rooms_household ON rooms(household_id);
CREATE INDEX IF NOT EXISTS idx_storage_areas_room ON storage_areas(room_id);
CREATE INDEX IF NOT EXISTS idx_items_storage_area ON items(storage_area_id);
CREATE INDEX IF NOT EXISTS idx_items_search_vector ON items USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_items_embedding ON items USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS households_updated_at ON households;
CREATE TRIGGER households_updated_at BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS rooms_updated_at ON rooms;
CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS storage_areas_updated_at ON storage_areas;
CREATE TRIGGER storage_areas_updated_at BEFORE UPDATE ON storage_areas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS items_updated_at ON items;
CREATE TRIGGER items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
