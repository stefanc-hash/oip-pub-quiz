import type { FastifyInstance } from 'fastify';
import type { Services } from '../../services/container.js';
import type { AuthService } from '../../services/AuthService.js';
import { makeAuthGuard } from '../../middleware/requireAdminAuth.js';

interface IdParams { id: string }

interface QuestionBody {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export async function adminQuestionsRoutes(
  app: FastifyInstance,
  deps: { services: Services; auth: AuthService },
) {
  const { content, questionRepo } = deps.services;
  const guard = makeAuthGuard(deps.auth);
  app.addHook('preHandler', guard);

  app.get('/api/admin/questions', async () => {
    return content.getQuestions().map(q => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    }));
  });

  app.put<{ Params: IdParams; Body: QuestionBody }>(
    '/api/admin/questions/:id',
    {
      schema: {
        body: {
          type: 'object',
          required: ['prompt', 'options', 'correctIndex', 'explanation'],
          properties: {
            prompt:       { type: 'string', minLength: 1 },
            options:      { type: 'array', items: { type: 'string', minLength: 1 }, minItems: 2, maxItems: 4 },
            correctIndex: { type: 'integer', minimum: 0, maximum: 3 },
            explanation:  { type: 'string', minLength: 1 },
          },
          additionalProperties: false,
        },
      },
    },
    async (req, reply) => {
      const { id } = req.params;
      if (!content.getQuestion(id)) {
        return reply.code(404).send({ error: `Question ${id} not found` });
      }
      const { prompt, options, correctIndex, explanation } = req.body;
      if (correctIndex >= options.length) {
        return reply.code(400).send({ error: 'correctIndex out of range for options array' });
      }
      const updated = questionRepo.update(id, { prompt, options, correctIndex, explanation });
      content.reload();
      return {
        id: updated.id,
        prompt: updated.prompt,
        options: updated.options,
        correctIndex: updated.correctIndex,
        explanation: updated.explanation,
      };
    },
  );
}
