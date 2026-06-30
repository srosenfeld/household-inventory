import type { FastifyInstance } from 'fastify';
import { query } from '../db/client';
import { buildOrganizationalIntelligence } from '../lib/oi/analyze';

async function assertHouseholdAccess(householdId: string, userId: string) {
  const result = await query<{ id: string }>(
    `SELECT h.id FROM households h
     JOIN household_members hm ON hm.household_id = h.id
     WHERE h.id = $1 AND hm.user_id = $2`,
    [householdId, userId]
  );
  return Boolean(result.rows[0]);
}

export async function oiRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    '/households/:id/organizational-intelligence',
    async (request, reply) => {
      const user = request.user!;
      const { id } = request.params;

      const allowed = await assertHouseholdAccess(id, user.id);
      if (!allowed) {
        return reply.status(404).send({ error: 'Household not found' });
      }

      const report = await buildOrganizationalIntelligence(id);
      return report;
    }
  );
}
