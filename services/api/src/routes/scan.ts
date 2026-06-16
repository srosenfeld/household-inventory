import type { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { saveScanItemsSchema } from '@household-inventory/shared';
import { query } from '../db/client';
import type { DbItem } from '../db/client';
import { identifyItemsFromImage } from '../lib/ai/vision';
import { generateEmbedding, embeddingToPgVector, itemEmbeddingText } from '../lib/ai/embeddings';
import { serializeItem } from '../lib/serialize';

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

export async function scanRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>('/storage-areas/:id/scan', async (request, reply) => {
    ensureUploadDir();

    const area = await query('SELECT id FROM storage_areas WHERE id = $1', [request.params.id]);
    if (!area.rows[0]) {
      return reply.status(404).send({ error: 'Storage area not found' });
    }

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'Photo file is required' });
    }

    const ext = path.extname(data.filename) || '.jpg';
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, filename);
    await pipeline(data.file, createWriteStream(filepath));

    const photoUrl = `/uploads/${filename}`;
    const scanJobId = uuidv4();

    await query(
      `INSERT INTO scan_jobs (id, storage_area_id, photo_url, status) VALUES ($1, $2, $3, 'processing')`,
      [scanJobId, request.params.id, photoUrl]
    );

    await query('UPDATE storage_areas SET photo_url = $2 WHERE id = $1', [request.params.id, photoUrl]);

    try {
      const items = await identifyItemsFromImage(filepath);
      await query(
        `UPDATE scan_jobs SET status = 'completed', result = $2, completed_at = NOW() WHERE id = $1`,
        [scanJobId, JSON.stringify({ items })]
      );

      return { scanJobId, items };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      await query(
        `UPDATE scan_jobs SET status = 'failed', error_message = $2, completed_at = NOW() WHERE id = $1`,
        [scanJobId, message]
      );
      return reply.status(500).send({ error: message });
    }
  });

  app.post('/scan/save', async (request, reply) => {
    const body = saveScanItemsSchema.parse(request.body);

    const job = await query<{ storage_area_id: string; photo_url: string }>(
      'SELECT storage_area_id, photo_url FROM scan_jobs WHERE id = $1',
      [body.scanJobId]
    );
    if (!job.rows[0]) {
      return reply.status(404).send({ error: 'Scan job not found' });
    }

    const { storage_area_id, photo_url } = job.rows[0];
    const savedItems: ReturnType<typeof serializeItem>[] = [];

    for (const item of body.items) {
      const embedding = await generateEmbedding(
        itemEmbeddingText(item.name, item.description ?? null, item.category)
      );

      const result = await query<DbItem>(
        `INSERT INTO items (storage_area_id, name, description, category, quantity, photo_url, ai_metadata, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector) RETURNING *`,
        [
          storage_area_id,
          item.name,
          item.description ?? null,
          item.category,
          item.quantity,
          photo_url,
          item.aiMetadata ?? null,
          embeddingToPgVector(embedding),
        ]
      );
      savedItems.push(serializeItem(result.rows[0]));
    }

    return { items: savedItems };
  });

  app.get<{ Params: { id: string } }>('/scan/:id', async (request, reply) => {
    const result = await query('SELECT * FROM scan_jobs WHERE id = $1', [request.params.id]);
    if (!result.rows[0]) {
      return reply.status(404).send({ error: 'Scan job not found' });
    }
    const job = result.rows[0] as { id: string; status: string; result: { items: unknown[] } | null };
    return {
      scanJobId: job.id,
      status: job.status,
      items: job.result?.items ?? [],
    };
  });
}
