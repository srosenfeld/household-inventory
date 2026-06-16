import { query } from '../../db/client';
import type { DbUser } from '../../db/client';
import type { SupabaseJwtPayload } from './supabase';

export async function getOrCreateUserFromToken(payload: SupabaseJwtPayload): Promise<DbUser> {
  const email = payload.email;
  if (!email) {
    throw new Error('Token missing email claim');
  }

  const existing = await query<DbUser>(
    'SELECT * FROM users WHERE supabase_user_id = $1',
    [payload.sub]
  );

  if (existing.rows[0]) {
    const user = existing.rows[0];
    if (user.email !== email) {
      const updated = await query<DbUser>(
        'UPDATE users SET email = $2 WHERE id = $1 RETURNING *',
        [user.id, email]
      );
      return updated.rows[0];
    }
    return user;
  }

  const meta = payload.user_metadata ?? {};
  const inserted = await query<DbUser>(
    `INSERT INTO users (email, supabase_user_id, first_name, last_name, profile_picture_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      email,
      payload.sub,
      meta.first_name ?? null,
      meta.last_name ?? null,
      meta.avatar_url ?? null,
    ]
  );

  return inserted.rows[0];
}
