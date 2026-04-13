import { describe, it, expect, afterEach } from 'vitest';
import { request } from 'node:http';
import { buildApp } from '../../src/app.js';
import { buildServices } from '../../src/services/container.js';

interface SseFrame { event: string; data: string }

function parseFrames(buf: string): SseFrame[] {
  const frames: SseFrame[] = [];
  for (const block of buf.split('\n\n')) {
    if (!block.trim()) continue;
    const lines = block.split('\n');
    let event = 'message';
    let data = '';
    for (const line of lines) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data += line.slice(5).trim();
    }
    if (data) frames.push({ event, data });
  }
  return frames;
}

function openSseStream(port: number): Promise<{
  framesSoFar: () => SseFrame[];
  waitForFrame: (predicate: (f: SseFrame) => boolean, timeoutMs?: number) => Promise<SseFrame>;
  close: () => void;
}> {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path: '/api/display/stream', method: 'GET' }, res => {
      if (res.statusCode !== 200) return reject(new Error(`status ${res.statusCode}`));
      let buf = '';
      let waiters: Array<{ predicate: (f: SseFrame) => boolean; resolve: (f: SseFrame) => void }> = [];

      res.setEncoding('utf8');
      res.on('data', (chunk: string) => {
        buf += chunk;
        const frames = parseFrames(buf);
        // Notify waiters whose predicate now matches
        waiters = waiters.filter(w => {
          const found = frames.find(w.predicate);
          if (found) { w.resolve(found); return false; }
          return true;
        });
      });

      resolve({
        framesSoFar: () => parseFrames(buf),
        waitForFrame: (predicate, timeoutMs = 2000) => new Promise<SseFrame>((res2, rej2) => {
          // Check existing buffer first
          const existing = parseFrames(buf).find(predicate);
          if (existing) return res2(existing);
          const t = setTimeout(() => {
            waiters = waiters.filter(w => w.predicate !== predicate);
            rej2(new Error('Timed out waiting for SSE frame'));
          }, timeoutMs);
          waiters.push({
            predicate,
            resolve: f => { clearTimeout(t); res2(f); },
          });
        }),
        close: () => req.destroy(),
      });
    });
    req.on('error', reject);
    req.end();
  });
}

describe('SSE display stream (integration)', () => {
  let stop: (() => Promise<void>) | null = null;

  afterEach(async () => {
    if (stop) await stop();
    stop = null;
  });

  it('emits initial leaderboard snapshot and pushes updates on answer', async () => {
    const services = buildServices({ dbPath: ':memory:' });
    const app = await buildApp({ services, adminKey: 'k', loggerLevel: 'silent' });
    await app.listen({ port: 0, host: '127.0.0.1' });
    const port = (app.server.address() as { port: number }).port;
    stop = async () => {
      app.server.closeAllConnections();
      await app.close();
    };

    // Pre-create an active session and a registered participant
    const s = services.sessions.create('A'); services.sessions.activate(s.id);
    const p = services.participants.register(s.id, 'Alice', 'Smith');

    const stream = await openSseStream(port);

    // Initial frame: leaderboard with Alice registered but no answers yet
    const initial = await stream.waitForFrame(f => f.event === 'leaderboard');
    const initialPayload = JSON.parse(initial.data);
    expect(initialPayload.session.name).toBe('A');
    expect(initialPayload.rows).toHaveLength(1);
    expect(initialPayload.rows[0].correctCount).toBe(0);

    // Submit an answer; expect a leaderboard frame reflecting the new state
    services.answers.submit({ participantId: p.id, questionId: 'q-001', selectedIndex: 1, responseTimeMs: 1000 });
    const updated = await stream.waitForFrame(f =>
      f.event === 'leaderboard' && /"correctCount":1/.test(f.data));
    const payload = JSON.parse(updated.data);
    expect(payload.rows).toHaveLength(1);
    expect(payload.rows[0].firstName).toBe('Alice');
    expect(payload.rows[0].correctCount).toBe(1);

    stream.close();
  });

  it('pushes idle frame when active session is ended', async () => {
    const services = buildServices({ dbPath: ':memory:' });
    const app = await buildApp({ services, adminKey: 'k', loggerLevel: 'silent' });
    await app.listen({ port: 0, host: '127.0.0.1' });
    const port = (app.server.address() as { port: number }).port;
    stop = async () => {
      app.server.closeAllConnections();
      await app.close();
    };

    const s = services.sessions.create('A'); services.sessions.activate(s.id);
    const stream = await openSseStream(port);
    await stream.waitForFrame(f => f.event === 'leaderboard');

    services.sessions.end(s.id);
    const idle = await stream.waitForFrame(f => f.event === 'idle');
    expect(JSON.parse(idle.data).reason).toBe('no-active-session');

    stream.close();
  });
});
