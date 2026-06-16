import type { FastifyInstance } from 'fastify';
import { createRoomSchema, updateRoomSchema } from '@household-inventory/shared';
import { query } from '../db/client';
import type { DbRoom } from '../db/client';
import { serializeRoom } from '../lib/serialize';
import { suggestNames } from '../lib/ai/vision';

export async function roomRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { householdId: string } }>('/rooms', async (request, reply) => {
    const { householdId } = request.query;
    if (!householdId) {
      return reply.status(400).send({ error: 'householdId is required' });
    }

    const result = await query<DbRoom>(
      'SELECT * FROM rooms WHERE household_id = $1 ORDER BY created_at DESC',
      [householdId]
    );
    return result.rows.map(serializeRoom);
  });

  app.post('/rooms', async (request) => {
    const body = createRoomSchema.parse(request.body);
    const result = await query<DbRoom>(
      `INSERT INTO rooms (household_id, name, photo_url) VALUES ($1, $2, $3) RETURNING *`,
      [body.householdId, body.name, body.photoUrl ?? null]
    );
    return serializeRoom(result.rows[0]);
  });

  app.get<{ Params: { id: string } }>('/rooms/:id', async (request, reply) => {
    const result = await query<DbRoom>('SELECT * FROM rooms WHERE id = $1', [request.params.id]);
    if (!result.rows[0]) {
      return reply.status(404).send({ error: 'Room not found' });
    }
    return serializeRoom(result.rows[0]);
  });

  app.patch<{ Params: { id: string } }>('/rooms/:id', async (request, reply) => {
    const body = updateRoomSchema.parse(request.body);
    const existing = await query<DbRoom>('SELECT * FROM rooms WHERE id = $1', [request.params.id]);
    if (!existing.rows[0]) {
      return reply.status(404).send({ error: 'Room not found' });
    }

    const row = existing.rows[0];
    const result = await query<DbRoom>(
      `UPDATE rooms SET
        name = $2,
        photo_url = $3,
        layout_metadata = $4
       WHERE id = $1 RETURNING *`,
      [
        request.params.id,
        body.name ?? row.name,
        body.photoUrl !== undefined ? body.photoUrl : row.photo_url,
        body.layoutMetadata !== undefined ? body.layoutMetadata : row.layout_metadata,
      ]
    );
    return serializeRoom(result.rows[0]);
  });

  app.post<{ Params: { id: string }; Body: { context?: string } }>(
    '/rooms/:id/suggest-names',
    async (request, reply) => {
      const room = await query<DbRoom>('SELECT * FROM rooms WHERE id = $1', [request.params.id]);
      if (!room.rows[0]) {
        return reply.status(404).send({ error: 'Room not found' });
      }

      const context = request.body?.context ?? `Room named ${room.rows[0].name}`;
      const suggestions = await suggestNames(context);
      return { suggestions };
    }
  );
}
