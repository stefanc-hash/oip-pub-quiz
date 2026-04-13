import type { DB } from '../connection.js';

export interface SessionRow {
  id: number;
  name: string;
  created_at: number;
  activated_at: number | null;
  ended_at: number | null;
}

export class SessionRepo {
  constructor(private readonly db: DB) {}

  create(name: string, now: number = Date.now()): SessionRow {
    const info = this.db
      .prepare('INSERT INTO sessions (name, created_at) VALUES (?, ?)')
      .run(name, now);
    return this.findById(Number(info.lastInsertRowid))!;
  }

  findById(id: number): SessionRow | undefined {
    return this.db
      .prepare<[number], SessionRow>('SELECT * FROM sessions WHERE id = ?')
      .get(id);
  }

  findAll(): SessionRow[] {
    return this.db
      .prepare<[], SessionRow>('SELECT * FROM sessions ORDER BY id ASC')
      .all();
  }

  findActive(): SessionRow | undefined {
    return this.db
      .prepare<[], SessionRow>(
        'SELECT * FROM sessions WHERE activated_at IS NOT NULL AND ended_at IS NULL LIMIT 1',
      )
      .get();
  }

  /**
   * Mark this session active *now*, clearing any prior ended_at.
   * Idempotent on activated_at (always reset to `now`) so reactivating an
   * ended group restarts its timestamps.
   */
  activate(id: number, now: number = Date.now()): void {
    this.db
      .prepare('UPDATE sessions SET activated_at = ?, ended_at = NULL WHERE id = ?')
      .run(now, id);
  }

  end(id: number, now: number = Date.now()): void {
    this.db
      .prepare('UPDATE sessions SET ended_at = ? WHERE id = ?')
      .run(now, id);
  }
}
