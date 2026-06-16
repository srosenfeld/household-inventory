import type { FastifyInstance } from 'fastify';
import { createStorageAreaSchema, updateStorageAreaSchema } from '@household-inventory/shared';
import { query } from '../db/client';
import type { DbStorageArea } from '../db/client';
import { serializeStorageArea } from '../lib/serialize';
import { suggestNames } from '../lib/ai/vision';

export async function storageAreaRoutes(app: FastifyInstance) {
  app.get<{ Params: { roomId: string } }>('/rooms/:roomId/storage-areas', async (request) => {
    const result = await query<DbStorageArea>(
      'SELECT * FROM storage_areas WHERE room_id = $1 ORDER BY created_at ASC',
      [request.params.roomId]
    );
    return result.rows.map(serializeStorageArea);
  });

  app.post<{ Params: { roomId: string } }>('/rooms/:roomId/storage-areas', async (request, reply) => {
    const body = createStorageAreaSchema.parse(request.body);
    const room = await query('SELECT id FROM rooms WHERE id = $1', [request.params.roomId]);
    if (!room.rows[0]) {
      return reply.status(404).send({ error: 'Room not found' });
    }

    const result = await query<DbStorageArea>(
      `INSERT INTO storage_areas (room_id, name, type, x, y, width, height, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        request.params.roomId,
        body.name,
        body.type,
        body.x,
        body.y,
        body.width,
        body.height,
        body.photoUrl ?? null,
      ]
    );
    return serializeStorageArea(result.rows[0]);
  });

  app.get<{ Params: { id: string } }>('/storage-areas/:id', async (request, reply) => {
    const result = await query<DbStorageArea>('SELECT * FROM storage_areas WHERE id = $1', [
      request.params.id,
    ]);
    if (!result.rows[0]) {
      return reply.status(404).send({ error: 'Storage area not found' });
    }
    return serializeStorageArea(result.rows[0]);
  });

  app.patch<{ Params: { id: string } }>('/storage-areas/:id', async (request, reply) => {
    const body = updateStorageAreaSchema.parse(request.body);
    const existing = await query<DbStorageArea>('SELECT * FROM storage_areas WHERE id = $1', [
      request.params.id,
    ]);
    if (!existing.rows[0]) {
      return reply.status(404).send({ error: 'Storage area not found' });
    }

    const row = existing.rows[0];
    const result = await query<DbStorageArea>(
      `UPDATE storage_areas SET
        name = $2, type = $3, x = $4, y = $5, width = $6, height = $7, photo_url = $8
       WHERE id = $1 RETURNING *`,
      [
        request.params.id,
        body.name ?? row.name,
        body.type ?? row.type,
        body.x ?? row.x,
        body.y ?? row.y,
        body.width ?? row.width,
        body.height ?? row.height,
        body.photoUrl !== undefined ? body.photoUrl : row.photo_url,
      ]
    );
    return serializeStorageArea(result.rows[0]);
  });

  app.delete<{ Params: { id: string } }>('/storage-areas/:id', async (request, reply) => {
    const result = await query('DELETE FROM storage_areas WHERE id = $1 RETURNING id', [request.params.id]);
    if (!result.rows[0]) {
      return reply.status(404).send({ error: 'Storage area not found' });
    }
    return { success: true };
  });

  app.post<{ Params: { id: string }; Body: { type?: string; context?: string } }>(
    '/storage-areas/:id/suggest-names',
    async (request, reply) => {
      const area = await query<DbStorageArea>('SELECT * FROM storage_areas WHERE id = $1', [
        request.params.id,
      ]);
      if (!area.rows[0]) {
        return reply.status(404).send({ error: 'Storage area not found' });
      }

      const row = area.rows[0];
      const context = request.body?.context ?? `${row.type} in storage area`;
      const suggestions = await suggestNames(context, request.body?.type ?? row.type);
      return { suggestions };
    }
  );
}
