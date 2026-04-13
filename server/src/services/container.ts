import { openDatabase, type DB } from '../db/connection.js';
import { SessionRepo } from '../db/repos/SessionRepo.js';
import { ParticipantRepo } from '../db/repos/ParticipantRepo.js';
import { AnswerRepo } from '../db/repos/AnswerRepo.js';
import { SessionService } from './SessionService.js';
import { ParticipantService } from './ParticipantService.js';
import { AnswerService } from './AnswerService.js';
import { LeaderboardService } from './LeaderboardService.js';
import { EventBus } from './EventBus.js';
import { HardcodedQuizContent } from '../content/HardcodedQuizContent.js';
import type { QuizContentSource } from '../content/QuizContentSource.js';

export interface Services {
  db: DB;
  bus: EventBus;
  content: QuizContentSource;
  sessions: SessionService;
  participants: ParticipantService;
  answers: AnswerService;
  leaderboard: LeaderboardService;
}

export function buildServices(opts: { dbPath: string }): Services {
  const db = openDatabase(opts.dbPath);
  const sessionRepo = new SessionRepo(db);
  const participantRepo = new ParticipantRepo(db);
  const answerRepo = new AnswerRepo(db);

  const bus = new EventBus();
  const content = new HardcodedQuizContent();
  const sessions = new SessionService(sessionRepo, bus);
  const participants = new ParticipantService(participantRepo, sessions);
  const answers = new AnswerService(answerRepo, participants, content, bus);
  const leaderboard = new LeaderboardService(participantRepo, answerRepo);

  return { db, bus, content, sessions, participants, answers, leaderboard };
}
