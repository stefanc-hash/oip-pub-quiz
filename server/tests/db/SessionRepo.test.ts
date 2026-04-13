import { describe, it, expect, beforeEach } from 'vitest';
import { openInMemoryDatabase, type DB } from '../../src/db/connection.js';
import { SessionRepo } from '../../src/db/repos/SessionRepo.js';

describe('SessionRepo', () => {
  let db: DB;
  let repo: SessionRepo;

  beforeEach(() => {
    db = openInMemoryDatabase();
    repo = new SessionRepo(db);
  });

  it('creates a session and reads it back by id', () => {
    const s = repo.create('Group A', 1000);
    expect(s).toMatchObject({
      id: expect.any(Number),
      name: 'Group A',
      created_at: 1000,
      activated_at: null,
      ended_at: null,
    });
    expect(repo.findById(s.id)).toEqual(s);
  });

  it('findAll returns sessions in creation order', () => {
    repo.create('A', 1); repo.create('B', 2); repo.create('C', 3);
    expect(repo.findAll().map(s => s.name)).toEqual(['A', 'B', 'C']);
  });

  it('activate sets activated_at; end sets ended_at', () => {
    const s = repo.create('A');
    repo.activate(s.id, 100);
    expect(repo.findById(s.id)?.activated_at).toBe(100);
    repo.end(s.id, 200);
    expect(repo.findById(s.id)?.ended_at).toBe(200);
  });

  it('findActive returns the one session that is activated but not ended', () => {
    const a = repo.create('A'); repo.activate(a.id); repo.end(a.id);
    const b = repo.create('B');                                   // unactivated
    const c = repo.create('C'); repo.activate(c.id);              // active

    const active = repo.findActive();
    expect(active?.id).toBe(c.id);
    expect(b).toBeTruthy();
  });

  it('findActive returns undefined when nothing is active', () => {
    repo.create('A');
    expect(repo.findActive()).toBeUndefined();
  });
});
