import type { FastifyInstance } from 'fastify';
import type { Services } from '../../services/container.js';

export async function sessionsRoutes(app: FastifyInstance, deps: { services: Services }) {
  const { sessions } = deps.services;

  app.get('/api/session/active', async () => {
    const active = sessions.getActive();
    if (!active) return null;
    return { id: active.id, name: active.name };
  });
}
