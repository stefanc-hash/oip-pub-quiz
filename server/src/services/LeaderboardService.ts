import type { ParticipantRepo, ParticipantRow } from '../db/repos/ParticipantRepo.js';
import type { AnswerRepo, AnswerRow } from '../db/repos/AnswerRepo.js';

export interface LeaderboardRow {
  participantId: number;
  firstName: string;
  lastName: string;
  correctCount: number;
  totalAnswered: number;
  /** Average response time in ms over correct answers. Null if none correct. */
  avgResponseTimeMsOnCorrect: number | null;
  completed: boolean;
  rank: number;
}

/**
 * Computes a sorted leaderboard for a session.
 *
 * Ranking rule (single source of truth — change here only):
 *   1. correctCount DESC
 *   2. avgResponseTimeMsOnCorrect ASC (null sorts last)
 *   3. lastName ASC, firstName ASC (stable, deterministic tiebreak)
 */
export class LeaderboardService {
  constructor(
    private readonly participants: ParticipantRepo,
    private readonly answers: AnswerRepo,
  ) {}

  getLeaderboard(sessionId: number): LeaderboardRow[] {
    const parts = this.participants.findBySession(sessionId);
    const allAnswers = this.answers.findBySession(sessionId);

    const byParticipant = new Map<number, AnswerRow[]>();
    for (const a of allAnswers) {
      const arr = byParticipant.get(a.participant_id) ?? [];
      arr.push(a);
      byParticipant.set(a.participant_id, arr);
    }

    const rows: Omit<LeaderboardRow, 'rank'>[] = parts.map((p: ParticipantRow) => {
      const as = byParticipant.get(p.id) ?? [];
      const correct = as.filter(a => a.is_correct === 1);
      const avgCorrectMs = correct.length === 0
        ? null
        : Math.round(correct.reduce((s, a) => s + a.response_time_ms, 0) / correct.length);
      return {
        participantId: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        correctCount: correct.length,
        totalAnswered: as.length,
        avgResponseTimeMsOnCorrect: avgCorrectMs,
        completed: p.completed_at !== null,
      };
    });

    rows.sort((a, b) => {
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      const aT = a.avgResponseTimeMsOnCorrect;
      const bT = b.avgResponseTimeMsOnCorrect;
      if (aT === null && bT === null) {
        // both zero correct — fall through to name sort
      } else if (aT === null) return 1;
      else if (bT === null) return -1;
      else if (aT !== bT) return aT - bT;

      const ln = a.lastName.localeCompare(b.lastName);
      if (ln !== 0) return ln;
      return a.firstName.localeCompare(b.firstName);
    });

    let lastKey: string | null = null;
    let lastRank = 0;
    return rows.map((r, i) => {
      const key = `${r.correctCount}|${r.avgResponseTimeMsOnCorrect ?? 'x'}`;
      const rank = key === lastKey ? lastRank : i + 1;
      lastKey = key;
      lastRank = rank;
      return { ...r, rank };
    });
  }
}
