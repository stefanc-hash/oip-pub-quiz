import Fastify, { type FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { existsSync } from 'node:fs';
import { config } from './config.js';
import { buildServices, type Services } from './services/container.js';
import { AuthService } from './services/AuthService.js';
import { registerErrorHandler } from './routes/errorMapping.js';
import { sessionsRoutes } from './routes/api/sessions.js';
import { quizRoutes } from './routes/api/quiz.js';
import { participantsRoutes } from './routes/api/participants.js';
import { adminRoutes } from './routes/api/admin.js';
import { adminQuestionsRoutes } from './routes/api/adminQuestions.js';
import { authRoutes } from './routes/api/auth.js';
import { qrRoutes } from './routes/api/qr.js';
import { displayStreamRoutes } from './routes/sse/display.js';

export interface BuildAppOptions {
  /** Override services for tests (in-memory db, fakes). */
  services?: Services;
  /** Override auth service for tests. */
  auth?: AuthService;
  /** Logger config passed to Fastify. */
  loggerLevel?: 'info' | 'warn' | 'error' | 'fatal' | 'silent';
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: opts.loggerLevel ?? 'info' },
    // Honour X-Forwarded-* headers from Railway / Fly / Render edges.
    trustProxy: true,
  });

  const services = opts.services ?? buildServices({ dbPath: config.dbPath });
  const auth = opts.auth ?? new AuthService(
    config.adminUsername,
    config.adminPassword,
    config.sessionSecret,
    config.sessionMaxAgeMs,
  );

  // ── Body parser hardening: empty JSON body → null (was 500 before) ──
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    const text = (body as string).trim();
    if (text === '') return done(null, null);
    try { done(null, JSON.parse(text)); } catch (err) { done(err as Error); }
  });

  // ── Security headers (CSP allows inline styles for our shadcn-ish CSS vars) ──
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],   // Tailwind compiled CSS uses none, but Radix injects style attrs
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],                   // SSE same-origin
        fontSrc: ["'self'", 'data:'],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // SSE friendliness
  });

  // ── Cookies + global rate limit (login route adds a tighter override) ──
  await app.register(fastifyCookie);
  await app.register(fastifyRateLimit, {
    global: false, // opt-in per route — login is the only sensitive endpoint
  });

  registerErrorHandler(app);

  // Health
  app.get('/api/health', async () => ({ ok: true, time: Date.now() }));

  // Public + auth + admin API
  await app.register(async (api) => sessionsRoutes(api, { services }));
  await app.register(async (api) => quizRoutes(api, { services }));
  await app.register(async (api) => participantsRoutes(api, { services }));
  await app.register(async (api) => authRoutes(api, { auth, isProduction: config.isProduction }));
  await app.register(async (api) => adminRoutes(api, { services, auth }));
  await app.register(async (api) => adminQuestionsRoutes(api, { services, auth }));
  await app.register(async (api) => qrRoutes(api, { auth }));
  await app.register(async (api) => displayStreamRoutes(api, { services }));

  // Static client (only if built bundle exists)
  if (existsSync(config.clientDist)) {
    await app.register(fastifyStatic, { root: config.clientDist, prefix: '/' });
    app.setNotFoundHandler((req, reply) => {
      if (req.method === 'GET' && !req.url.startsWith('/api')) {
        return reply.sendFile('index.html');
      }
      reply.code(404).send({ error: 'Not Found' });
    });
  }

  return app;
}
