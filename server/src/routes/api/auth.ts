import type { FastifyInstance } from 'fastify';
import type { AuthService } from '../../services/AuthService.js';

interface LoginBody { username: string; password: string }

export async function authRoutes(
  app: FastifyInstance,
  deps: { auth: AuthService; isProduction: boolean },
) {
  const { auth, isProduction } = deps;

  // Aggressive rate limit on login to slow brute-force attempts.
  // 10 attempts per minute per IP is plenty for a human; bots get throttled.
  app.post<{ Body: LoginBody }>('/api/admin/login', {
    config: {
      rateLimit: { max: 10, timeWindow: '1 minute' },
    },
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { username, password } = req.body;
    const ok = auth.verifyCredentials(username, password);
    if (!ok) {
      // Generic message — don't disclose which field was wrong.
      reply.code(401).send({ error: 'Invalid username or password' });
      return;
    }
    const token = auth.issueToken();
    reply
      .setCookie(auth.cookieName, token, {
        path: '/',
        httpOnly: true,                     // not readable by JS
        secure: isProduction,               // HTTPS only in production
        sameSite: 'strict',                 // CSRF protection
        maxAge: auth.maxAge,                // matches token expiry
        signed: false,                      // we sign the value ourselves
      })
      .code(200)
      .send({ ok: true, username });
  });

  app.post('/api/admin/logout', async (_req, reply) => {
    reply
      .clearCookie(auth.cookieName, { path: '/' })
      .code(200)
      .send({ ok: true });
  });

  // Lightweight check the client uses to decide "show login or admin UI".
  app.get('/api/admin/me', async (req, reply) => {
    const user = auth.verifyToken(req.cookies?.[auth.cookieName]);
    if (!user) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }
    return { username: user };
  });
}
