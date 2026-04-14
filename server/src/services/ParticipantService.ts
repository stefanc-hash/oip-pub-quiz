import type { ParticipantRepo, ParticipantRow } from '../db/repos/ParticipantRepo.js';
import type { SessionService } from './SessionService.js';

export class ParticipantNotFoundError extends Error {
  constructor(id: number) { super(`Participant ${id} not found`); }
}

export class SessionNotActiveError extends Error {
  constructor(id: number) { super(`Session ${id} is not currently open for new players`); }
}

export class ParticipantService {
  constructor(
    private readonly participants: ParticipantRepo,
    private readonly sessionService: SessionService,
  ) {}

  register(sessionId: number, firstName: string, lastName: string): ParticipantRow {
    const fn = firstName.trim(), ln = lastName.trim();
    if (fn === '' || ln === '') throw new Error('First and last name are required');

    // Look up session — throws SessionNotFoundError if missing.
    const session = this.sessionService.getById(sessionId);
    if (session.ended_at !== null) throw new SessionNotActiveError(sessionId);

    return this.participants.create({ sessionId, firstName: fn, lastName: ln });
  }

  getById(id: number): ParticipantRow {
    const p = this.participants.findById(id);
    if (!p) throw new ParticipantNotFoundError(id);
    return p;
  }

  start(id: number): ParticipantRow {
    const p = this.getById(id);
    this.participants.start(id);
    return this.participants.findById(id) ?? p;
  }

  complete(id: number): ParticipantRow {
    const p = this.getById(id);
    this.participants.complete(id);
    return this.participants.findById(id) ?? p;
  }

  countBySession(sessionId: number): number {
    return this.participants.countBySession(sessionId);
  }
}
