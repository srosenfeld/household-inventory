import type { FastifyInstance } from 'fastify';
import { createItemSchema, updateItemSchema } from '@household-inventory/shared';
import { query } from '../db/client';
import type { DbItem } from '../db/client';
import { serializeItem } from '../lib/serialize';
import { generateEmbedding, embeddingToPgVector, itemEmbeddingText } from '../lib/ai/embeddings';

export async function itemRoutes(app: FastifyInstance) {
  app.get<{ Params: { storageAreaId: string } }>(
    '/storage-areas/:storageAreaId/items',
    async (request) => {
      const result = await query<DbItem>(
        'SELECT * FROM items WHERE storage_area_id = $1 ORDER BY name ASC',
        [request.params.storageAreaId]
      );
      return result.rows.map(serializeItem);
    }
  );

  app.get<{ Querystring: { householdId: string } }>('/items', async (request, reply) => {
    const { householdId } = request.query;
    if (!householdId) {
      return reply.status(400).send({ error: 'householdId is required' });
    }

    const result = await query<DbItem>(
      `SELECT i.* FROM items i
       JOIN storage_areas sa ON sa.id = i.storage_area_id
       JOIN rooms r ON r.id = sa.room_id
       WHERE r.household_id = $1
       ORDER BY i.updated_at DESC
       LIMIT 50`,
      [householdId]
    );
    return result.rows.map(serializeItem);
  });

  app.get<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
    const result = await query<DbItem>('SELECT * FROM items WHERE id = $1', [request.params.id]);
    if (!result.rows[0]) {
      return reply.status(404).send({ error: 'Item not found' });
    }
    return serializeItem(result.rows[0]);
  });

  app.post('/items', async (request) => {
    const body = createItemSchema.parse(request.body);
    const embedding = await generateEmbedding(
      itemEmbeddingText(body.name, body.description ?? null, body.category)
    );

    const result = await query<DbItem>(
      `INSERT INTO items (storage_area_id, name, description, category, quantity, photo_url, ai_metadata, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector) RETURNING *`,
      [
        body.storageAreaId,
        body.name,
        body.description ?? null,
        body.category,
        body.quantity,
        body.photoUrl ?? null,
        body.aiMetadata ?? null,
        embeddingToPgVector(embedding),
      ]
    );
    return serializeItem(result.rows[0]);
  });

  app.patch<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
    const body = updateItemSchema.parse(request.body);
    const existing = await query<DbItem>('SELECT * FROM items WHERE id = $1', [request.params.id]);
    if (!existing.rows[0]) {
      return reply.status(404).send({ error: 'Item not found' });
    }

    const row = existing.rows[0];
    const name = body.name ?? row.name;
    const description = body.description !== undefined ? body.description : row.description;
    const category = body.category ?? row.category;
    const embedding = await generateEmbedding(itemEmbeddingText(name, description, category));

    const result = await query<DbItem>(
      `UPDATE items SET
        storage_area_id = $2,
        name = $3,
        description = $4,
        category = $5,
        quantity = $6,
        photo_url = $7,
        embedding = $8::vector
       WHERE id = $1 RETURNING *`,
      [
        request.params.id,
        body.storageAreaId ?? row.storage_area_id,
        name,
        description,
        category,
        body.quantity ?? row.quantity,
        body.photoUrl !== undefined ? body.photoUrl : row.photo_url,
        embeddingToPgVector(embedding),
      ]
    );
    return serializeItem(result.rows[0]);
  });

  app.delete<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
    const result = await query('DELETE FROM items WHERE id = $1 RETURNING id', [request.params.id]);
    if (!result.rows[0]) {
      return reply.status(404).send({ error: 'Item not found' });
    }
    return { success: true };
  });
}
