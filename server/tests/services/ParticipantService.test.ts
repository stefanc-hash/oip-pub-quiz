import { describe, it, expect, beforeEach } from 'vitest';
import { openInMemoryDatabase } from '../../src/db/connection.js';
import { SessionRepo } from '../../src/db/repos/SessionRepo.js';
import { ParticipantRepo } from '../../src/db/repos/ParticipantRepo.js';
import { SessionService, SessionNotFoundError } from '../../src/services/SessionService.js';
import { ParticipantService, ParticipantNotFoundError, SessionNotActiveError } from '../../src/services/ParticipantService.js';

function setup() {
  const db = openInMemoryDatabase();
  const sessionSvc = new SessionService(new SessionRepo(db));
  const participantSvc = new ParticipantService(new ParticipantRepo(db), sessionSvc);
  return { sessionSvc, participantSvc };
}

describe('ParticipantService', () => {
  let s: ReturnType<typeof setup>;
  beforeEach(() => { s = setup(); });

  it('register creates a participant bound to the session', () => {
    const sess = s.sessionSvc.create('A');
    const p = s.participantSvc.register(sess.id, 'Alice', 'Smith');
    expect(p.session_id).toBe(sess.id);
    expect(p.first_name).toBe('Alice');
    expect(p.last_name).toBe('Smith');
  });

  it('register trims whitespace and rejects empty names', () => {
    const sess = s.sessionSvc.create('A');
    const p = s.participantSvc.register(sess.id, '  Bob  ', '  Jones  ');
    expect(p.first_name).toBe('Bob');
    expect(p.last_name).toBe('Jones');
    expect(() => s.participantSvc.register(sess.id, '', 'X')).toThrow(/required/);
    expect(() => s.participantSvc.register(sess.id, 'X', '   ')).toThrow(/required/);
  });

  it('register fails for unknown session', () => {
    expect(() => s.participantSvc.register(999, 'A', 'B')).toThrow(SessionNotFoundError);
  });

  it('register fails for ended session', () => {
    const sess = s.sessionSvc.create('A');
    s.sessionSvc.activate(sess.id); s.sessionSvc.end(sess.id);
    expect(() => s.participantSvc.register(sess.id, 'A', 'B')).toThrow(SessionNotActiveError);
  });

  it('start/complete update timestamps', () => {
    const sess = s.sessionSvc.create('A');
    const p = s.participantSvc.register(sess.id, 'A', 'B');
    const started = s.participantSvc.start(p.id);
    expect(started.started_at).not.toBeNull();
    const completed = s.participantSvc.complete(p.id);
    expect(completed.completed_at).not.toBeNull();
  });

  it('getById throws for unknown', () => {
    expect(() => s.participantSvc.getById(42)).toThrow(ParticipantNotFoundError);
  });
});
