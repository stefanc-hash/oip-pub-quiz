import type { FastifyInstance } from 'fastify';
import type { Services } from '../../services/container.js';
import type { AuthService } from '../../services/AuthService.js';
import { makeAuthGuard } from '../../middleware/requireAdminAuth.js';

interface IdParams { id: string }
interface NameBody { name: string }

export async function adminRoutes(
  app: FastifyInstance,
  deps: { services: Services; auth: AuthService },
) {
  const { sessions, leaderboard, participants } = deps.services;
  const guard = makeAuthGuard(deps.auth);
  app.addHook('preHandler', guard);

  app.get('/api/admin/sessions', async () => {
    return sessions.listAll().map(s => ({
      id: s.id,
      name: s.name,
      createdAt: s.created_at,
      activatedAt: s.activated_at,
      endedAt: s.ended_at,
      isActive: s.activated_at !== null && s.ended_at === null,
      participantCount: participants.countBySession(s.id),
    }));
  });

  app.post<{ Body: NameBody }>('/api/admin/sessions', {
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string' } },
      },
    },
  }, async (req) => {
    const s = sessions.create(req.body.name);
    return { id: s.id, name: s.name, createdAt: s.created_at };
  });

  app.post<{ Params: IdParams }>('/api/admin/sessions/:id/activate', async (req) => {
    const s = sessions.activate(Number(req.params.id));
    return { id: s.id, activatedAt: s.activated_at, endedAt: s.ended_at };
  });

  app.post<{ Params: IdParams }>('/api/admin/sessions/:id/end', async (req) => {
    const s = sessions.end(Number(req.params.id));
    return { id: s.id, endedAt: s.ended_at };
  });

  app.get<{ Params: IdParams }>('/api/admin/sessions/:id/results', async (req) => {
    const sessionId = Number(req.params.id);
    const session = sessions.getById(sessionId);
    return {
      session: {
        id: session.id,
        name: session.name,
        activatedAt: session.activated_at,
        endedAt: session.ended_at,
      },
      leaderboard: leaderboard.getLeaderboard(sessionId),
    };
  });
}
