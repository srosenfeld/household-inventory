import type { FastifyInstance } from 'fastify';
import { searchRequestSchema } from '@household-inventory/shared';
import { hybridSearch } from '../lib/search/hybrid';

export async function searchRoutes(app: FastifyInstance) {
  app.post('/search', async (request, reply) => {
    const body = searchRequestSchema.parse(request.body);
    try {
      const result = await hybridSearch(body.householdId, body.query);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      return reply.status(500).send({ error: message });
    }
  });
}
