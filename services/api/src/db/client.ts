import pg from 'pg';

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString:
        process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/household_inventory',
    });
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export interface DbUser {
  id: string;
  email: string;
  display_name: string | null;
  supabase_user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_picture_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbHousehold {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface DbRoom {
  id: string;
  household_id: string;
  name: string;
  photo_url: string | null;
  layout_metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbStorageArea {
  id: string;
  room_id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  photo_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbItem {
  id: string;
  storage_area_id: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  photo_url: string | null;
  ai_metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
}

