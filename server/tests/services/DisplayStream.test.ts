import { describe, it, expect, beforeEach } from 'vitest';
import { openInMemoryDatabase } from '../../src/db/connection.js';
import { SessionRepo } from '../../src/db/repos/SessionRepo.js';
import { ParticipantRepo } from '../../src/db/repos/ParticipantRepo.js';
import { AnswerRepo } from '../../src/db/repos/AnswerRepo.js';
import { EventBus } from '../../src/services/EventBus.js';
import { SessionService } from '../../src/services/SessionService.js';
import { ParticipantService } from '../../src/services/ParticipantService.js';
import { AnswerService } from '../../src/services/AnswerService.js';
import { LeaderboardService } from '../../src/services/LeaderboardService.js';
import { HardcodedQuizContent } from '../../src/content/HardcodedQuizContent.js';
import { DisplayStream, type DisplayEventName } from '../../src/services/DisplayStream.js';

interface Frame { event: DisplayEventName; data: any }

function setup() {
  const db = openInMemoryDatabase();
  const bus = new EventBus();
  const sessionSvc = new SessionService(new SessionRepo(db), bus);
  const participantRepo = new ParticipantRepo(db);
  const answerRepo = new AnswerRepo(db);
  const participantSvc = new ParticipantService(participantRepo, sessionSvc);
  const content = new HardcodedQuizContent([
    { id: 'q1', prompt: 'Q', options: ['a', 'b'], correctIndex: 0, explanation: '' },
  ]);
  const answerSvc = new AnswerService(answerRepo, participantSvc, content, bus);
  const leaderboard = new LeaderboardService(participantRepo, answerRepo);

  const frames: Frame[] = [];
  const stream = new DisplayStream(bus, sessionSvc, leaderboard, {
    send: (event, data) => frames.push({ event, data }),
  });

  return { sessionSvc, participantSvc, answerSvc, stream, frames };
}

describe('DisplayStream', () => {
  let s: ReturnType<typeof setup>;
  beforeEach(() => { s = setup(); });

  it('emits idle when no session is active on start', () => {
    s.stream.start();
    expect(s.frames).toHaveLength(1);
    expect(s.frames[0]?.event).toBe('idle');
  });

  it('emits leaderboard snapshot when there is an active session', () => {
    const sess = s.sessionSvc.create('A'); s.sessionSvc.activate(sess.id);
    s.stream.start();
    expect(s.frames).toHaveLength(1);
    expect(s.frames[0]?.event).toBe('leaderboard');
    expect(s.frames[0]?.data.session.id).toBe(sess.id);
    expect(s.frames[0]?.data.rows).toEqual([]);
  });

  it('pushes a new snapshot when an answer is recorded', () => {
    const sess = s.sessionSvc.create('A'); s.sessionSvc.activate(sess.id);
    const p = s.participantSvc.register(sess.id, 'Alice', 'A');
    s.stream.start();
    s.frames.length = 0;

    s.answerSvc.submit({ participantId: p.id, questionId: 'q1', selectedIndex: 0, responseTimeMs: 100 });

    expect(s.frames).toHaveLength(1);
    expect(s.frames[0]?.event).toBe('leaderboard');
    expect(s.frames[0]?.data.rows[0].correctCount).toBe(1);
  });

  it('switches to the new active session when admin rotates', () => {
    const a = s.sessionSvc.create('A'); s.sessionSvc.activate(a.id);
    s.stream.start();
    s.frames.length = 0;

    const b = s.sessionSvc.create('B'); s.sessionSvc.activate(b.id);

    expect(s.frames.some(f => f.event === 'leaderboard' && f.data.session.id === b.id)).toBe(true);
  });

  it('emits idle when active session is ended', () => {
    const a = s.sessionSvc.create('A'); s.sessionSvc.activate(a.id);
    s.stream.start();
    s.frames.length = 0;

    s.sessionSvc.end(a.id);

    expect(s.frames.at(-1)).toEqual({ event: 'idle', data: { reason: 'no-active-session' } });
  });

  it('stops listening after stop()', () => {
    const sess = s.sessionSvc.create('A'); s.sessionSvc.activate(sess.id);
    const p = s.participantSvc.register(sess.id, 'A', 'A');
    s.stream.start();
    s.stream.stop();
    s.frames.length = 0;

    s.answerSvc.submit({ participantId: p.id, questionId: 'q1', selectedIndex: 0, responseTimeMs: 1 });

    expect(s.frames).toHaveLength(0);
  });
});
