import type { SessionRepo, SessionRow } from '../db/repos/SessionRepo.js';
import type { EventBus } from './EventBus.js';

export class SessionNotFoundError extends Error {
  constructor(id: number) { super(`Session ${id} not found`); }
}

/**
 * Enforces the "at most one active session at a time" invariant.
 * Activating a session auto-ends any currently-active session.
 *
 * Activating an *ended* session is allowed and reopens it — admin uses this
 * to let additional players join a group after it was closed.
 *
 * Emits `active-session-changed` on the EventBus whenever the active
 * session changes.
 */
export class SessionService {
  constructor(
    private readonly sessions: SessionRepo,
    private readonly bus?: EventBus,
  ) {}

  create(name: string): SessionRow {
    const trimmed = name.trim();
    if (trimmed === '') throw new Error('Session name is required');
    return this.sessions.create(trimmed);
  }

  listAll(): SessionRow[] {
    return this.sessions.findAll();
  }

  getById(id: number): SessionRow {
    const s = this.sessions.findById(id);
    if (!s) throw new SessionNotFoundError(id);
    return s;
  }

  getActive(): SessionRow | undefined {
    return this.sessions.findActive();
  }

  activate(id: number, now: number = Date.now()): SessionRow {
    this.getById(id); // throws if missing

    const current = this.sessions.findActive();
    if (current && current.id !== id) {
      this.sessions.end(current.id, now);
    }
    // activate() also clears ended_at, so this works for both fresh activation
    // and reactivation of an ended group.
    this.sessions.activate(id, now);
    this.bus?.emitGlobalEvent({ type: 'active-session-changed' });
    return this.sessions.findById(id)!;
  }

  end(id: number, now: number = Date.now()): SessionRow {
    const target = this.getById(id);
    if (target.ended_at !== null) return target; // idempotent
    const wasActive = target.activated_at !== null;
    this.sessions.end(id, now);
    if (wasActive) this.bus?.emitGlobalEvent({ type: 'active-session-changed' });
    return this.sessions.findById(id)!;
  }

  delete(id: number): void {
    const target = this.getById(id); // throws if missing
    const wasActive = target.activated_at !== null && target.ended_at === null;
    this.sessions.delete(id);
    if (wasActive) this.bus?.emitGlobalEvent({ type: 'active-session-changed' });
  }
}
