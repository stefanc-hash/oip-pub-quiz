import type { DB } from '../connection.js';

export interface AnswerRow {
  id: number;
  participant_id: number;
  question_id: string;
  selected_index: number | null;
  is_correct: number; // 0 | 1
  response_time_ms: number;
  answered_at: number;
}

export interface RecordAnswerInput {
  participantId: number;
  questionId: string;
  selectedIndex: number | null;
  isCorrect: boolean;
  responseTimeMs: number;
}

export class AnswerRepo {
  constructor(private readonly db: DB) {}

  /** Insert an answer; throws if the participant already answered this question. */
  record(input: RecordAnswerInput, now: number = Date.now()): AnswerRow {
    const info = this.db
      .prepare(
        `INSERT INTO answers
         (participant_id, question_id, selected_index, is_correct, response_time_ms, answered_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.participantId,
        input.questionId,
        input.selectedIndex,
        input.isCorrect ? 1 : 0,
        input.responseTimeMs,
        now,
      );
    return this.findById(Number(info.lastInsertRowid))!;
  }

  findById(id: number): AnswerRow | undefined {
    return this.db
      .prepare<[number], AnswerRow>('SELECT * FROM answers WHERE id = ?')
      .get(id);
  }

  findByParticipant(participantId: number): AnswerRow[] {
    return this.db
      .prepare<[number], AnswerRow>(
        'SELECT * FROM answers WHERE participant_id = ? ORDER BY id ASC',
      )
      .all(participantId);
  }

  findBySession(sessionId: number): AnswerRow[] {
    return this.db
      .prepare<[number], AnswerRow>(
        `SELECT a.* FROM answers a
         JOIN participants p ON p.id = a.participant_id
         WHERE p.session_id = ?
         ORDER BY a.id ASC`,
      )
      .all(sessionId);
  }
}
