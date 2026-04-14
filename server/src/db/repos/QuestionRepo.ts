import type { DB } from '../connection.js';
import type { Question } from '../../content/QuizContentSource.js';

interface QuestionRow {
  id: string;
  prompt: string;
  options: string;        // raw JSON string
  correct_index: number;
  explanation: string;
  updated_at: number;
}

function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    prompt: row.prompt,
    options: JSON.parse(row.options) as string[],
    correctIndex: row.correct_index,
    explanation: row.explanation,
  };
}

export interface QuestionPatch {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export class QuestionRepo {
  constructor(private readonly db: DB) {}

  findAll(): Question[] {
    return this.db
      .prepare<[], QuestionRow>('SELECT * FROM questions ORDER BY id ASC')
      .all()
      .map(rowToQuestion);
  }

  findById(id: string): Question | undefined {
    const row = this.db
      .prepare<[string], QuestionRow>('SELECT * FROM questions WHERE id = ?')
      .get(id);
    return row ? rowToQuestion(row) : undefined;
  }

  /** Bulk-insert from seed data. INSERT OR IGNORE makes this idempotent. */
  seedAll(questions: readonly Question[], now: number = Date.now()): void {
    const stmt = this.db.prepare(
      `INSERT OR IGNORE INTO questions (id, prompt, options, correct_index, explanation, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const run = this.db.transaction((qs: readonly Question[]) => {
      for (const q of qs) {
        stmt.run(q.id, q.prompt, JSON.stringify(q.options), q.correctIndex, q.explanation, now);
      }
    });
    run(questions);
  }

  update(id: string, patch: QuestionPatch, now: number = Date.now()): Question {
    this.db.prepare(
      `UPDATE questions
       SET prompt = ?, options = ?, correct_index = ?, explanation = ?, updated_at = ?
       WHERE id = ?`,
    ).run(patch.prompt, JSON.stringify(patch.options), patch.correctIndex, patch.explanation, now, id);
    return this.findById(id)!;
  }

  isEmpty(): boolean {
    const row = this.db
      .prepare<[], { n: number }>('SELECT COUNT(*) AS n FROM questions')
      .get();
    return (row?.n ?? 0) === 0;
  }
}
