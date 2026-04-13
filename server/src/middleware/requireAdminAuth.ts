import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AuthService } from '../services/AuthService.js';

/**
 * Returns a Fastify preHandler that 401s if the request lacks a valid
 * admin session cookie. On success, attaches `req.adminUsername`.
 */
export function makeAuthGuard(auth: AuthService) {
  return async function requireAdminAuth(req: FastifyRequest, reply: FastifyReply) {
    const token = req.cookies?.[auth.cookieName];
    const user = auth.verifyToken(token);
    if (!user) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }
    (req as FastifyRequest & { adminUsername?: string }).adminUsername = user;
  };
}
