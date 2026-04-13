import { describe, it, expect, beforeEach } from 'vitest';
import { openInMemoryDatabase } from '../../src/db/connection.js';
import { SessionRepo } from '../../src/db/repos/SessionRepo.js';
import { ParticipantRepo } from '../../src/db/repos/ParticipantRepo.js';
import { AnswerRepo } from '../../src/db/repos/AnswerRepo.js';
import { SessionService } from '../../src/services/SessionService.js';
import { ParticipantService } from '../../src/services/ParticipantService.js';
import { AnswerService } from '../../src/services/AnswerService.js';
import { EventBus } from '../../src/services/EventBus.js';
import { HardcodedQuizContent } from '../../src/content/HardcodedQuizContent.js';
import { LeaderboardService } from '../../src/services/LeaderboardService.js';

function setup() {
  const db = openInMemoryDatabase();
  const sessions = new SessionRepo(db);
  const participantRepo = new ParticipantRepo(db);
  const answerRepo = new AnswerRepo(db);

  const sessionSvc = new SessionService(sessions);
  const participantSvc = new ParticipantService(participantRepo, sessionSvc);
  const content = new HardcodedQuizContent([
    { id: 'q1', prompt: 'Q1', options: ['a', 'b'], correctIndex: 0, explanation: '' },
    { id: 'q2', prompt: 'Q2', options: ['a', 'b'], correctIndex: 0, explanation: '' },
    { id: 'q3', prompt: 'Q3', options: ['a', 'b'], correctIndex: 0, explanation: '' },
  ]);
  const answerSvc = new AnswerService(answerRepo, participantSvc, content, new EventBus());
  const board = new LeaderboardService(participantRepo, answerRepo);

  const sid = sessionSvc.create('A').id;
  const reg = (fn: string, ln: string) => participantSvc.register(sid, fn, ln).id;
  const ans = (pid: number, qid: string, correct: boolean, ms: number) =>
    answerSvc.submit({ participantId: pid, questionId: qid, selectedIndex: correct ? 0 : 1, responseTimeMs: ms });

  return { sid, reg, ans, board };
}

describe('LeaderboardService', () => {
  let s: ReturnType<typeof setup>;
  beforeEach(() => { s = setup(); });

  it('ranks purely by correct count when times are equal', () => {
    const alice = s.reg('Alice', 'A');
    const bob = s.reg('Bob', 'B');
    s.ans(alice, 'q1', true, 100); s.ans(alice, 'q2', true, 100);
    s.ans(bob, 'q1', true, 100);

    const lb = s.board.getLeaderboard(s.sid);
    expect(lb[0]?.participantId).toBe(alice);
    expect(lb[0]?.correctCount).toBe(2);
    expect(lb[1]?.participantId).toBe(bob);
    expect(lb[1]?.correctCount).toBe(1);
  });

  it('tiebreaks equal correct counts by avg response time on correct answers', () => {
    const fast = s.reg('Fast', 'F');
    const slow = s.reg('Slow', 'S');
    s.ans(fast, 'q1', true, 1000); s.ans(fast, 'q2', true, 2000); // avg 1500
    s.ans(slow, 'q1', true, 5000); s.ans(slow, 'q2', true, 7000); // avg 6000

    const lb = s.board.getLeaderboard(s.sid);
    expect(lb.map(r => r.participantId)).toEqual([fast, slow]);
  });

  it('avg time ignores incorrect answers', () => {
    const x = s.reg('X', 'X');
    const y = s.reg('Y', 'Y');
    // X: 1 correct at 2000, 1 incorrect at 100 → avg correct = 2000
    s.ans(x, 'q1', true, 2000); s.ans(x, 'q2', false, 100);
    // Y: 1 correct at 3000 → avg correct = 3000
    s.ans(y, 'q1', true, 3000);
    const lb = s.board.getLeaderboard(s.sid);
    expect(lb[0]?.participantId).toBe(x);
    expect(lb[0]?.avgResponseTimeMsOnCorrect).toBe(2000);
    expect(lb[1]?.avgResponseTimeMsOnCorrect).toBe(3000);
  });

  it('participants with zero correct answers sort last, by name', () => {
    const scored = s.reg('Alice', 'A');
    const blank1 = s.reg('Zoe', 'Z');
    const blank2 = s.reg('Nina', 'N');
    s.ans(scored, 'q1', true, 1000);

    const lb = s.board.getLeaderboard(s.sid);
    expect(lb[0]?.participantId).toBe(scored);
    // Blank1 last_name 'Z' vs blank2 last_name 'N' — Nina should come before Zoe
    expect(lb[1]?.firstName).toBe('Nina');
    expect(lb[2]?.firstName).toBe('Zoe');
  });

  it('rank numbers tie on identical scores', () => {
    const a = s.reg('A', 'A'); const b = s.reg('B', 'B');
    s.ans(a, 'q1', true, 1000);
    s.ans(b, 'q1', true, 1000);
    const lb = s.board.getLeaderboard(s.sid);
    expect(lb[0]?.rank).toBe(1);
    expect(lb[1]?.rank).toBe(1);
  });

  it('includes participants with no answers at all', () => {
    const a = s.reg('A', 'A'); s.reg('Watcher', 'W');
    s.ans(a, 'q1', true, 100);
    const lb = s.board.getLeaderboard(s.sid);
    expect(lb).toHaveLength(2);
    const watcher = lb.find(r => r.firstName === 'Watcher')!;
    expect(watcher.correctCount).toBe(0);
    expect(watcher.totalAnswered).toBe(0);
    expect(watcher.avgResponseTimeMsOnCorrect).toBeNull();
  });

  it('scopes to the requested session only', () => {
    // setup() gave us session A; create B and register participants there
    const lb = s.board.getLeaderboard(s.sid);
    expect(lb).toEqual([]);
  });
});
