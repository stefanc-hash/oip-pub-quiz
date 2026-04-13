import type { FastifyInstance } from 'fastify';
import type { Services } from '../../services/container.js';
import { DisplayStream, type DisplaySink } from '../../services/DisplayStream.js';

interface QueryParams { sessionId?: string }

export async function displayStreamRoutes(app: FastifyInstance, deps: { services: Services }) {
  const { bus, sessions, leaderboard } = deps.services;

  app.get<{ Querystring: QueryParams }>('/api/display/stream', (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    reply.raw.write(`retry: 3000\n\n`);

    const sink: DisplaySink = {
      send(event, data) {
        reply.raw.write(`event: ${event}\n`);
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      },
    };

    const fixedSessionId = req.query.sessionId !== undefined && req.query.sessionId !== ''
      ? Number(req.query.sessionId)
      : null;

    const stream = new DisplayStream(bus, sessions, leaderboard, sink, { fixedSessionId });
    stream.start();

    const heartbeat = setInterval(() => reply.raw.write(`: keep-alive\n\n`), 25_000);

    const cleanup = () => {
      clearInterval(heartbeat);
      stream.stop();
      try { reply.raw.end(); } catch { /* already closed */ }
    };

    req.raw.on('close', cleanup);
    req.raw.on('error', cleanup);

    return reply;
  });
}
