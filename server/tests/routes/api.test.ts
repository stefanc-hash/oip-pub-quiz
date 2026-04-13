import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { buildServices, type Services } from '../../src/services/container.js';
import { AuthService } from '../../src/services/AuthService.js';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'test-pass-very-strong';
const SECRET = 'test-secret-min-16-chars-please';

async function setup() {
  const services = buildServices({ dbPath: ':memory:' });
  const auth = new AuthService(ADMIN_USER, ADMIN_PASS, SECRET, 60_000);
  const app = await buildApp({ services, auth, loggerLevel: 'silent' });
  return { app, services, auth };
}

async function login(app: Awaited<ReturnType<typeof setup>>['app']): Promise<string> {
  const res = await app.inject({
    method: 'POST', url: '/api/admin/login',
    payload: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  if (res.statusCode !== 200) throw new Error(`login failed: ${res.statusCode}`);
  const setCookie = res.headers['set-cookie'];
  const raw = Array.isArray(setCookie) ? setCookie[0]! : setCookie!;
  // extract pq_admin=...; portion
  const match = /pq_admin=([^;]+)/.exec(raw);
  if (!match) throw new Error('no pq_admin cookie');
  return `pq_admin=${match[1]}`;
}

describe('Public API', () => {
  let app: Awaited<ReturnType<typeof setup>>['app'];
  let services: Services;

  beforeEach(async () => {
    ({ app, services } = await setup());
  });

  it('GET /api/health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true });
  });

  it('GET /api/session/active returns null when no active session', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/session/active' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('null');
  });

  it('GET /api/session/active returns the active session id+name', async () => {
    const s = services.sessions.create('Group A');
    services.sessions.activate(s.id);
    const res = await app.inject({ method: 'GET', url: '/api/session/active' });
    expect(res.json()).toEqual({ id: s.id, name: 'Group A' });
  });

  it('GET /api/quiz/questions strips correctIndex and explanation', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/quiz/questions' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.questionTimeSeconds).toBe(30);
    expect(body.questions.length).toBeGreaterThan(0);
    for (const q of body.questions) {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('prompt');
      expect(q).toHaveProperty('options');
      expect(q).not.toHaveProperty('correctIndex');
      expect(q).not.toHaveProperty('explanation');
    }
  });

  it('full player loop: register → start → answer → complete', async () => {
    const s = services.sessions.create('Group A');
    services.sessions.activate(s.id);

    const reg = await app.inject({
      method: 'POST', url: '/api/participants',
      payload: { sessionId: s.id, firstName: 'Alice', lastName: 'Smith' },
    });
    expect(reg.statusCode).toBe(200);
    const { participantId } = reg.json();

    const start = await app.inject({ method: 'POST', url: `/api/participants/${participantId}/start` });
    expect(start.statusCode).toBe(200);

    const ans = await app.inject({
      method: 'POST', url: `/api/participants/${participantId}/answers`,
      payload: { questionId: 'q-001', selectedIndex: 1, responseTimeMs: 1500 },
    });
    expect(ans.statusCode).toBe(200);
    expect(ans.json()).toMatchObject({ isCorrect: true, correctIndex: 1 });

    const done = await app.inject({ method: 'POST', url: `/api/participants/${participantId}/complete` });
    expect(done.statusCode).toBe(200);
    const body = done.json();
    expect(body.leaderboard).toHaveLength(1);
    expect(body.leaderboard[0]).toMatchObject({ firstName: 'Alice', correctCount: 1, rank: 1 });
  });

  it('register validates required fields', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/participants',
      payload: { sessionId: 1, firstName: 'A' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('register with unknown session returns 404', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/participants',
      payload: { sessionId: 9999, firstName: 'A', lastName: 'B' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('answer with unknown question id returns 400', async () => {
    const s = services.sessions.create('A');
    const p = services.participants.register(s.id, 'A', 'B');
    const res = await app.inject({
      method: 'POST', url: `/api/participants/${p.id}/answers`,
      payload: { questionId: 'nope', selectedIndex: 0, responseTimeMs: 1 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('duplicate answer returns 409', async () => {
    const s = services.sessions.create('A');
    const p = services.participants.register(s.id, 'A', 'B');
    const payload = { questionId: 'q-001', selectedIndex: 0, responseTimeMs: 1 };
    const r1 = await app.inject({ method: 'POST', url: `/api/participants/${p.id}/answers`, payload });
    expect(r1.statusCode).toBe(200);
    const r2 = await app.inject({ method: 'POST', url: `/api/participants/${p.id}/answers`, payload });
    expect(r2.statusCode).toBe(409);
  });

  it('leaderboard for unknown participant returns 404', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/participants/9999/leaderboard' });
    expect(res.statusCode).toBe(404);
  });
});

describe('Admin auth', () => {
  let app: Awaited<ReturnType<typeof setup>>['app'];

  beforeEach(async () => {
    ({ app } = await setup());
  });

  it('login with correct credentials returns 200 + signed cookie', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/admin/login',
      payload: { username: ADMIN_USER, password: ADMIN_PASS },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true, username: ADMIN_USER });
    const setCookie = res.headers['set-cookie'];
    const cookieStr = Array.isArray(setCookie) ? setCookie[0]! : (setCookie ?? '');
    expect(cookieStr).toMatch(/pq_admin=/);
    expect(cookieStr).toMatch(/HttpOnly/i);
    expect(cookieStr).toMatch(/SameSite=Strict/i);
  });

  it('login with wrong password returns 401 and no cookie', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/admin/login',
      payload: { username: ADMIN_USER, password: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('login with wrong username returns 401', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/admin/login',
      payload: { username: 'nope', password: ADMIN_PASS },
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/admin/me returns 401 without cookie', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/me' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/admin/me returns username with valid cookie', async () => {
    const cookie = await login(app);
    const res = await app.inject({
      method: 'GET', url: '/api/admin/me',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ username: ADMIN_USER });
  });

  it('logout clears the cookie', async () => {
    const cookie = await login(app);
    const res = await app.inject({
      method: 'POST', url: '/api/admin/logout',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const setCookie = res.headers['set-cookie'];
    const str = Array.isArray(setCookie) ? setCookie[0]! : (setCookie ?? '');
    expect(str).toMatch(/pq_admin=;/);
  });

  it('tampered cookie is rejected', async () => {
    const cookie = await login(app);
    const tampered = cookie.replace(/.$/, 'X');
    const res = await app.inject({
      method: 'GET', url: '/api/admin/me',
      headers: { cookie: tampered },
    });
    expect(res.statusCode).toBe(401);
  });

  it('login is rate-limited after many attempts', async () => {
    let lastStatus = 0;
    for (let i = 0; i < 12; i++) {
      const res = await app.inject({
        method: 'POST', url: '/api/admin/login',
        payload: { username: ADMIN_USER, password: 'wrong' },
      });
      lastStatus = res.statusCode;
    }
    // After 10 attempts/min, subsequent ones should be 429
    expect(lastStatus).toBe(429);
  });
});

describe('Admin API (cookie-protected)', () => {
  let app: Awaited<ReturnType<typeof setup>>['app'];
  let services: Services;
  let cookie: string;

  beforeEach(async () => {
    ({ app, services } = await setup());
    cookie = await login(app);
  });

  it('rejects requests with no cookie', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/sessions' });
    expect(res.statusCode).toBe(401);
  });

  it('lists sessions with cookie', async () => {
    services.sessions.create('A');
    services.sessions.create('B');
    const res = await app.inject({
      method: 'GET', url: '/api/admin/sessions',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().map((s: { name: string }) => s.name)).toEqual(['A', 'B']);
  });

  it('creates and activates a session', async () => {
    const create = await app.inject({
      method: 'POST', url: '/api/admin/sessions',
      headers: { cookie },
      payload: { name: 'Group A' },
    });
    expect(create.statusCode).toBe(200);
    const id = create.json().id;

    const act = await app.inject({
      method: 'POST', url: `/api/admin/sessions/${id}/activate`,
      headers: { cookie },
    });
    expect(act.statusCode).toBe(200);
    expect(services.sessions.getActive()?.id).toBe(id);
  });

  it('activating one session ends the previously active one', async () => {
    const a = (await app.inject({
      method: 'POST', url: '/api/admin/sessions',
      headers: { cookie }, payload: { name: 'A' },
    })).json().id;
    const b = (await app.inject({
      method: 'POST', url: '/api/admin/sessions',
      headers: { cookie }, payload: { name: 'B' },
    })).json().id;
    await app.inject({ method: 'POST', url: `/api/admin/sessions/${a}/activate`, headers: { cookie } });
    await app.inject({ method: 'POST', url: `/api/admin/sessions/${b}/activate`, headers: { cookie } });
    expect(services.sessions.getById(a).ended_at).not.toBeNull();
    expect(services.sessions.getActive()?.id).toBe(b);
  });

  it('returns results for a session', async () => {
    const s = services.sessions.create('A'); services.sessions.activate(s.id);
    const p = services.participants.register(s.id, 'Alice', 'Smith');
    services.answers.submit({ participantId: p.id, questionId: 'q-001', selectedIndex: 1, responseTimeMs: 1000 });
    const res = await app.inject({
      method: 'GET', url: `/api/admin/sessions/${s.id}/results`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.session.name).toBe('A');
    expect(body.leaderboard[0].correctCount).toBe(1);
  });

  it('results for unknown session returns 404', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/admin/sessions/99999/results',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(404);
  });

  it('GET /api/admin/qr returns SVG when authenticated', async () => {
    const res = await app.inject({
      method: 'GET', url: '/api/admin/qr',
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.svg).toMatch(/^<svg/);
    expect(body.url).toMatch(/^http/);
  });

  it('GET /api/admin/qr returns 401 without cookie', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/admin/qr' });
    expect(res.statusCode).toBe(401);
  });
});
