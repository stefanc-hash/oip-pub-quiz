import { describe, it, expect, beforeEach } from 'vitest';
import { openInMemoryDatabase } from '../../src/db/connection.js';
import { SessionRepo } from '../../src/db/repos/SessionRepo.js';
import { SessionService, SessionNotFoundError } from '../../src/services/SessionService.js';

function setup() {
  const db = openInMemoryDatabase();
  return new SessionService(new SessionRepo(db));
}

describe('SessionService', () => {
  let svc: SessionService;
  beforeEach(() => { svc = setup(); });

  it('create rejects empty names', () => {
    expect(() => svc.create('  ')).toThrow(/name is required/);
  });

  it('getById throws SessionNotFoundError for missing ids', () => {
    expect(() => svc.getById(42)).toThrow(SessionNotFoundError);
  });

  it('activate makes a session active', () => {
    const s = svc.create('A');
    const activated = svc.activate(s.id, 1000);
    expect(activated.activated_at).toBe(1000);
    expect(svc.getActive()?.id).toBe(s.id);
  });

  it('activating a second session auto-ends the currently active one', () => {
    const a = svc.create('A'); const b = svc.create('B');
    svc.activate(a.id, 100);
    svc.activate(b.id, 200);
    expect(svc.getActive()?.id).toBe(b.id);
    expect(svc.getById(a.id).ended_at).toBe(200);
  });

  it('activating an ended session reopens it (clears ended_at, sets activated_at to now)', () => {
    const a = svc.create('A');
    svc.activate(a.id, 100);
    svc.end(a.id, 200);
    const reopened = svc.activate(a.id, 300);
    expect(reopened.ended_at).toBeNull();
    expect(reopened.activated_at).toBe(300);
    expect(svc.getActive()?.id).toBe(a.id);
  });

  it('reopening one ended session auto-ends a different active session', () => {
    const a = svc.create('A'); const b = svc.create('B');
    svc.activate(a.id, 100); svc.end(a.id, 200);   // a is ended
    svc.activate(b.id, 300);                         // b is active
    svc.activate(a.id, 400);                         // reopen a
    expect(svc.getActive()?.id).toBe(a.id);
    expect(svc.getById(b.id).ended_at).toBe(400);
  });

  it('end is idempotent', () => {
    const a = svc.create('A'); svc.activate(a.id, 100); svc.end(a.id, 200);
    const again = svc.end(a.id, 300);
    expect(again.ended_at).toBe(200); // unchanged
  });

  it('invariant: at most one session is ever active', () => {
    const a = svc.create('A'); const b = svc.create('B'); const c = svc.create('C');
    svc.activate(a.id); svc.activate(b.id); svc.activate(c.id);
    const actives = svc.listAll().filter(s => s.activated_at !== null && s.ended_at === null);
    expect(actives).toHaveLength(1);
    expect(actives[0]!.id).toBe(c.id);
  });
});
