import type { FastifyInstance } from 'fastify';
import { updateProfileSchema } from '@household-inventory/shared';
import { query } from '../db/client';
import type { DbUser } from '../db/client';
import { serializeUser } from '../lib/serialize';

export async function authRoutes(app: FastifyInstance) {
  app.get('/auth/me', async (request) => {
    return serializeUser(request.user!);
  });

  app.patch('/auth/me', async (request) => {
    const body = updateProfileSchema.parse(request.body);
    const user = request.user!;

    const updates: string[] = [];
    const values: unknown[] = [user.id];
    let paramIndex = 2;

    if (body.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(body.firstName);
    }
    if (body.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(body.lastName);
    }
    if (body.profilePictureUrl !== undefined) {
      updates.push(`profile_picture_url = $${paramIndex++}`);
      values.push(body.profilePictureUrl);
    }

    if (updates.length === 0) {
      return serializeUser(user);
    }

    const result = await query<DbUser>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    return serializeUser(result.rows[0]);
  });
}
