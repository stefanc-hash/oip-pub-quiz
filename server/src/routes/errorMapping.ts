import type { FastifyError, FastifyInstance } from 'fastify';
import { SessionNotFoundError } from '../services/SessionService.js';
import { ParticipantNotFoundError, SessionNotActiveError } from '../services/ParticipantService.js';
import { UnknownQuestionError, DuplicateAnswerError } from '../services/AnswerService.js';

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err: FastifyError, _req, reply) => {
    if (err instanceof SessionNotFoundError || err instanceof ParticipantNotFoundError) {
      return reply.code(404).send({ error: err.message });
    }
    if (err instanceof SessionNotActiveError) {
      return reply.code(409).send({ error: err.message });
    }
    if (err instanceof UnknownQuestionError) {
      return reply.code(400).send({ error: err.message });
    }
    if (err instanceof DuplicateAnswerError) {
      return reply.code(409).send({ error: err.message });
    }
    if (err.validation) {
      return reply.code(400).send({ error: err.message });
    }
    // Honour Fastify-native errors (rate-limit → 429, body too large → 413, etc.)
    if (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 500) {
      return reply.code(err.statusCode).send({ error: err.message });
    }
    app.log.error(err);
    return reply.code(500).send({ error: 'Internal Server Error' });
  });
}
