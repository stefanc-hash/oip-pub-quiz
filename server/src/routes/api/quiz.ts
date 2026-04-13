import type { FastifyInstance } from 'fastify';
import type { Services } from '../../services/container.js';
import { toPublic } from '../../content/QuizContentSource.js';
import { config } from '../../config.js';

export async function quizRoutes(app: FastifyInstance, deps: { services: Services }) {
  const { content } = deps.services;

  app.get('/api/quiz/questions', async () => ({
    questionTimeSeconds: config.questionTimeSeconds,
    questions: content.getQuestions().map(toPublic),
  }));
}
