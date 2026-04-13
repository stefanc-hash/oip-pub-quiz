import { describe, it, expect, beforeEach } from 'vitest';
import { openInMemoryDatabase, type DB } from '../../src/db/connection.js';
import { SessionRepo } from '../../src/db/repos/SessionRepo.js';
import { ParticipantRepo } from '../../src/db/repos/ParticipantRepo.js';

describe('ParticipantRepo', () => {
  let db: DB;
  let sessions: SessionRepo;
  let participants: ParticipantRepo;
  let sessionId: number;

  beforeEach(() => {
    db = openInMemoryDatabase();
    sessions = new SessionRepo(db);
    participants = new ParticipantRepo(db);
    sessionId = sessions.create('Group A').id;
  });

  it('creates a participant linked to a session', () => {
    const p = participants.create(
      { sessionId, firstName: 'Alice', lastName: 'Smith' },
      500,
    );
    expect(p).toMatchObject({
      id: expect.any(Number),
      session_id: sessionId,
      first_name: 'Alice',
      last_name: 'Smith',
      registered_at: 500,
      started_at: null,
      completed_at: null,
    });
  });

  it('findBySession scopes to that session only', () => {
    const other = sessions.create('Group B').id;
    participants.create({ sessionId, firstName: 'A', lastName: 'A' });
    participants.create({ sessionId, firstName: 'B', lastName: 'B' });
    participants.create({ sessionId: other, firstName: 'C', lastName: 'C' });
    expect(participants.findBySession(sessionId).map(p => p.first_name)).toEqual(['A', 'B']);
  });

  it('start and complete set timestamps exactly once', () => {
    const p = participants.create({ sessionId, firstName: 'A', lastName: 'A' });
    participants.start(p.id, 100);
    participants.start(p.id, 999); // no-op because started_at already set
    expect(participants.findById(p.id)?.started_at).toBe(100);

    participants.complete(p.id, 200);
    participants.complete(p.id, 999);
    expect(participants.findById(p.id)?.completed_at).toBe(200);
  });

  it('referential integrity: cannot insert with non-existent session', () => {
    expect(() =>
      participants.create({ sessionId: 999999, firstName: 'X', lastName: 'Y' }),
    ).toThrow(/FOREIGN KEY/);
  });
});
