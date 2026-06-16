import type { FastifyInstance } from 'fastify';
import { createRetailerRegistry } from '@household-inventory/shared';

const registry = createRetailerRegistry([]);

export async function integrationRoutes(app: FastifyInstance) {
  app.get('/integrations/retailers', async () => {
    return {
      retailers: registry.listAdapters().map((a) => ({ id: a.id })),
      message: 'Retailer integrations are stubbed for future eBay, Wayfair, and Target support.',
    };
  });
}
