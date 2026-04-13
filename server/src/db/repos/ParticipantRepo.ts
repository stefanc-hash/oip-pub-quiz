import type { DB } from '../connection.js';

export interface ParticipantRow {
  id: number;
  session_id: number;
  first_name: string;
  last_name: string;
  registered_at: number;
  started_at: number | null;
  completed_at: number | null;
}

export interface CreateParticipantInput {
  sessionId: number;
  firstName: string;
  lastName: string;
}

export class ParticipantRepo {
  constructor(private readonly db: DB) {}

  create(input: CreateParticipantInput, now: number = Date.now()): ParticipantRow {
    const info = this.db
      .prepare(
        'INSERT INTO participants (session_id, first_name, last_name, registered_at) VALUES (?, ?, ?, ?)',
      )
      .run(input.sessionId, input.firstName, input.lastName, now);
    return this.findById(Number(info.lastInsertRowid))!;
  }

  findById(id: number): ParticipantRow | undefined {
    return this.db
      .prepare<[number], ParticipantRow>('SELECT * FROM participants WHERE id = ?')
      .get(id);
  }

  findBySession(sessionId: number): ParticipantRow[] {
    return this.db
      .prepare<[number], ParticipantRow>(
        'SELECT * FROM participants WHERE session_id = ? ORDER BY id ASC',
      )
      .all(sessionId);
  }

  start(id: number, now: number = Date.now()): void {
    this.db
      .prepare('UPDATE participants SET started_at = ? WHERE id = ? AND started_at IS NULL')
      .run(now, id);
  }

  complete(id: number, now: number = Date.now()): void {
    this.db
      .prepare('UPDATE participants SET completed_at = ? WHERE id = ? AND completed_at IS NULL')
      .run(now, id);
  }
}
