import './env';
import path from 'path';
import fs from 'fs';
import { ZodError } from 'zod';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { householdRoutes } from './routes/households';
import { authRoutes } from './routes/auth';
import { roomRoutes } from './routes/rooms';
import { storageAreaRoutes } from './routes/storage-areas';
import { itemRoutes } from './routes/items';
import { scanRoutes } from './routes/scan';
import { searchRoutes } from './routes/search';
import { uploadRoutes } from './routes/upload';
import { integrationRoutes } from './routes/integrations';
import { requireAuth } from './middleware/auth';

const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? 'uploads');
const port = Number(process.env.PORT ?? 3001);

const publicPaths = new Set(['/health']);

function isPublicPath(pathOnly: string): boolean {
  if (publicPaths.has(pathOnly)) return true;
  // Static files — loaded by <Image> without auth headers
  if (pathOnly.startsWith('/uploads/')) return true;
  return false;
}

async function main() {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const app = Fastify({ logger: true });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: error.issues.map((i) => i.message).join('; '),
      });
    }
    const err = error as { statusCode?: number; message?: string };
    const statusCode = err.statusCode ?? 500;
    reply.status(statusCode).send({
      error: err.message ?? 'Internal Server Error',
    });
  });

  await app.register(cors, { origin: true });
  await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });
  await app.register(fastifyStatic, {
    root: uploadDir,
    prefix: '/uploads/',
    decorateReply: false,
  });

  app.get('/health', async () => ({ status: 'ok' }));

  app.addHook('preHandler', async (request, reply) => {
    const pathOnly = request.url.split('?')[0];
    if (isPublicPath(pathOnly)) return;
    await requireAuth(request, reply);
  });

  await app.register(authRoutes);
  await app.register(householdRoutes);
  await app.register(roomRoutes);
  await app.register(storageAreaRoutes);
  await app.register(itemRoutes);
  await app.register(scanRoutes);
  await app.register(searchRoutes);
  await app.register(uploadRoutes);
  await app.register(integrationRoutes);

  await app.listen({ port, host: '0.0.0.0' });
  console.log(`API listening on http://localhost:${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
