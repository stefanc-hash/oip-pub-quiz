import { describe, it, expect, beforeEach } from 'vitest';
import { openInMemoryDatabase, type DB } from '../../src/db/connection.js';
import { SessionRepo } from '../../src/db/repos/SessionRepo.js';
import { ParticipantRepo } from '../../src/db/repos/ParticipantRepo.js';
import { AnswerRepo } from '../../src/db/repos/AnswerRepo.js';

describe('AnswerRepo', () => {
  let db: DB;
  let sessions: SessionRepo;
  let participants: ParticipantRepo;
  let answers: AnswerRepo;
  let participantId: number;

  beforeEach(() => {
    db = openInMemoryDatabase();
    sessions = new SessionRepo(db);
    participants = new ParticipantRepo(db);
    answers = new AnswerRepo(db);
    const s = sessions.create('Group A');
    const p = participants.create({ sessionId: s.id, firstName: 'A', lastName: 'A' });
    participantId = p.id;
  });

  it('records an answer and reads it back', () => {
    const a = answers.record({
      participantId,
      questionId: 'q-001',
      selectedIndex: 2,
      isCorrect: true,
      responseTimeMs: 4200,
    }, 1000);
    expect(a).toMatchObject({
      participant_id: participantId,
      question_id: 'q-001',
      selected_index: 2,
      is_correct: 1,
      response_time_ms: 4200,
      answered_at: 1000,
    });
  });

  it('records null selected_index for timeouts', () => {
    const a = answers.record({
      participantId,
      questionId: 'q-001',
      selectedIndex: null,
      isCorrect: false,
      responseTimeMs: 30000,
    });
    expect(a.selected_index).toBeNull();
    expect(a.is_correct).toBe(0);
  });

  it('unique-index prevents the same participant answering the same question twice', () => {
    answers.record({ participantId, questionId: 'q-001', selectedIndex: 0, isCorrect: true, responseTimeMs: 100 });
    expect(() =>
      answers.record({ participantId, questionId: 'q-001', selectedIndex: 1, isCorrect: false, responseTimeMs: 200 }),
    ).toThrow(/UNIQUE/);
  });

  it('findBySession joins across participants', () => {
    const s2 = sessions.create('Group B');
    const p2 = participants.create({ sessionId: s2.id, firstName: 'X', lastName: 'X' });
    answers.record({ participantId, questionId: 'q-001', selectedIndex: 0, isCorrect: true, responseTimeMs: 1 });
    answers.record({ participantId, questionId: 'q-002', selectedIndex: 1, isCorrect: false, responseTimeMs: 1 });
    answers.record({ participantId: p2.id, questionId: 'q-001', selectedIndex: 2, isCorrect: true, responseTimeMs: 1 });

    expect(answers.findBySession(1).length).toBe(2);
    expect(answers.findBySession(s2.id).length).toBe(1);
  });
});
