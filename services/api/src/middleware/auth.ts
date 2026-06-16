import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DbUser } from '../db/client';
import { verifySupabaseToken } from '../lib/auth/supabase';
import { getOrCreateUserFromToken } from '../lib/auth/user-sync';

declare module 'fastify' {
  interface FastifyRequest {
    user?: DbUser;
  }
}

function extractBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = extractBearerToken(request);
  if (!token) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  try {
    const payload = await verifySupabaseToken(token);
    request.user = await getOrCreateUserFromToken(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    return reply.status(401).send({ error: message });
  }
}
