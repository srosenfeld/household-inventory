import type { FastifyInstance } from 'fastify';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');

function ensureUploadDir() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload', async (request, reply) => {
    ensureUploadDir();

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'File is required' });
    }

    const ext = path.extname(data.filename) || '.jpg';
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, filename);
    await pipeline(data.file, createWriteStream(filepath));

    const photoUrl = `/uploads/${filename}`;
    return { photoUrl, url: photoUrl };
  });
}
