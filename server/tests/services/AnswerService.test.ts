import { describe, it, expect, beforeEach } from 'vitest';
import { openInMemoryDatabase } from '../../src/db/connection.js';
import { SessionRepo } from '../../src/db/repos/SessionRepo.js';
import { ParticipantRepo } from '../../src/db/repos/ParticipantRepo.js';
import { AnswerRepo } from '../../src/db/repos/AnswerRepo.js';
import { SessionService } from '../../src/services/SessionService.js';
import { ParticipantService } from '../../src/services/ParticipantService.js';
import { AnswerService, DuplicateAnswerError, UnknownQuestionError } from '../../src/services/AnswerService.js';
import { EventBus, type SessionEvent } from '../../src/services/EventBus.js';
import { HardcodedQuizContent } from '../../src/content/HardcodedQuizContent.js';

function setup() {
  const db = openInMemoryDatabase();
  const sessionSvc = new SessionService(new SessionRepo(db));
  const participantSvc = new ParticipantService(new ParticipantRepo(db), sessionSvc);
  const bus = new EventBus();
  const content = new HardcodedQuizContent([
    { id: 'q-a', prompt: 'Q A', options: ['X', 'Y'], correctIndex: 1, explanation: 'ex-a' },
    { id: 'q-b', prompt: 'Q B', options: ['0', '1', '2'], correctIndex: 0, explanation: 'ex-b' },
  ]);
  const answerSvc = new AnswerService(new AnswerRepo(db), participantSvc, content, bus);
  return { sessionSvc, participantSvc, answerSvc, bus };
}

describe('AnswerService', () => {
  let s: ReturnType<typeof setup>;
  let sessionId: number;
  let participantId: number;

  beforeEach(() => {
    s = setup();
    sessionId = s.sessionSvc.create('A').id;
    participantId = s.participantSvc.register(sessionId, 'Alice', 'Smith').id;
  });

  it('grades correct answer and emits a session event', () => {
    const events: SessionEvent[] = [];
    s.bus.onSessionEvent(sessionId, e => events.push(e));
    const res = s.answerSvc.submit({ participantId, questionId: 'q-a', selectedIndex: 1, responseTimeMs: 1200 });
    expect(res).toEqual({ isCorrect: true, correctIndex: 1, explanation: 'ex-a' });
    expect(events).toEqual([{ type: 'leaderboard-changed' }]);
  });

  it('grades incorrect answer and still reveals correct index', () => {
    const res = s.answerSvc.submit({ participantId, questionId: 'q-a', selectedIndex: 0, responseTimeMs: 900 });
    expect(res).toEqual({ isCorrect: false, correctIndex: 1, explanation: 'ex-a' });
  });

  it('grades a timeout (null selectedIndex) as incorrect', () => {
    const res = s.answerSvc.submit({ participantId, questionId: 'q-a', selectedIndex: null, responseTimeMs: 30000 });
    expect(res.isCorrect).toBe(false);
  });

  it('rejects duplicate submissions', () => {
    s.answerSvc.submit({ participantId, questionId: 'q-a', selectedIndex: 1, responseTimeMs: 100 });
    expect(() =>
      s.answerSvc.submit({ participantId, questionId: 'q-a', selectedIndex: 0, responseTimeMs: 200 }),
    ).toThrow(DuplicateAnswerError);
  });

  it('rejects unknown question ids', () => {
    expect(() =>
      s.answerSvc.submit({ participantId, questionId: 'q-nope', selectedIndex: 0, responseTimeMs: 1 }),
    ).toThrow(UnknownQuestionError);
  });

  it('emits event only to the participant\u2019s session', () => {
    const otherSessionId = s.sessionSvc.create('B').id;
    const otherEvents: SessionEvent[] = [];
    const thisEvents: SessionEvent[] = [];
    s.bus.onSessionEvent(otherSessionId, e => otherEvents.push(e));
    s.bus.onSessionEvent(sessionId, e => thisEvents.push(e));
    s.answerSvc.submit({ participantId, questionId: 'q-a', selectedIndex: 1, responseTimeMs: 1 });
    expect(thisEvents).toHaveLength(1);
    expect(otherEvents).toHaveLength(0);
  });
});
