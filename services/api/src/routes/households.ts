import type { FastifyInstance } from 'fastify';
import { createHouseholdSchema } from '@household-inventory/shared';
import { query } from '../db/client';
import type { DbHousehold } from '../db/client';
import { serializeHousehold } from '../lib/serialize';

export async function householdRoutes(app: FastifyInstance) {
  app.get('/households', async (request) => {
    const user = request.user!;
    const result = await query<DbHousehold>(
      `SELECT h.* FROM households h
       JOIN household_members hm ON hm.household_id = h.id
       WHERE hm.user_id = $1
       ORDER BY h.created_at DESC`,
      [user.id]
    );
    return result.rows.map(serializeHousehold);
  });

  app.post('/households', async (request) => {
    const body = createHouseholdSchema.parse(request.body);
    const user = request.user!;

    const result = await query<DbHousehold>(
      `INSERT INTO households (name, owner_id) VALUES ($1, $2) RETURNING *`,
      [body.name, user.id]
    );
    const household = result.rows[0];

    await query(
      `INSERT INTO household_members (household_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [household.id, user.id]
    );

    return serializeHousehold(household);
  });

  app.get<{ Params: { id: string } }>('/households/:id', async (request, reply) => {
      const user = request.user!;
      const result = await query<DbHousehold>(
        `SELECT h.* FROM households h
         JOIN household_members hm ON hm.household_id = h.id
         WHERE h.id = $1 AND hm.user_id = $2`,
        [request.params.id, user.id]
      );
      if (!result.rows[0]) {
        return reply.status(404).send({ error: 'Household not found' });
      }
      return serializeHousehold(result.rows[0]);
  });
}
