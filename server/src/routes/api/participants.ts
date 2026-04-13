import type { FastifyInstance } from 'fastify';
import type { Services } from '../../services/container.js';

interface RegisterBody { sessionId: number; firstName: string; lastName: string }
interface IdParams { id: string }
interface AnswerBody {
  questionId: string;
  selectedIndex: number | null;
  responseTimeMs: number;
}

export async function participantsRoutes(app: FastifyInstance, deps: { services: Services }) {
  const { participants, answers, leaderboard } = deps.services;

  app.post<{ Body: RegisterBody }>('/api/participants', {
    schema: {
      body: {
        type: 'object',
        required: ['sessionId', 'firstName', 'lastName'],
        properties: {
          sessionId: { type: 'integer' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
        },
      },
    },
  }, async (req) => {
    const p = participants.register(req.body.sessionId, req.body.firstName, req.body.lastName);
    return { participantId: p.id, sessionId: p.session_id, firstName: p.first_name, lastName: p.last_name };
  });

  app.post<{ Params: IdParams }>('/api/participants/:id/start', async (req) => {
    const p = participants.start(Number(req.params.id));
    return { startedAt: p.started_at };
  });

  app.post<{ Params: IdParams; Body: AnswerBody }>('/api/participants/:id/answers', {
    schema: {
      body: {
        type: 'object',
        required: ['questionId', 'responseTimeMs'],
        properties: {
          questionId: { type: 'string' },
          selectedIndex: { type: ['integer', 'null'] },
          responseTimeMs: { type: 'integer', minimum: 0 },
        },
      },
    },
  }, async (req) => {
    return answers.submit({
      participantId: Number(req.params.id),
      questionId: req.body.questionId,
      selectedIndex: req.body.selectedIndex ?? null,
      responseTimeMs: req.body.responseTimeMs,
    });
  });

  app.post<{ Params: IdParams }>('/api/participants/:id/complete', async (req) => {
    const p = participants.complete(Number(req.params.id));
    return {
      completedAt: p.completed_at,
      leaderboard: leaderboard.getLeaderboard(p.session_id),
    };
  });

  app.get<{ Params: IdParams }>('/api/participants/:id/leaderboard', async (req) => {
    const p = participants.getById(Number(req.params.id));
    return { leaderboard: leaderboard.getLeaderboard(p.session_id) };
  });
}
