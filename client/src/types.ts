// Mirror of server-side response shapes. Kept in sync by hand;
// small enough surface that copying beats setting up a shared package.

export interface ActiveSession { id: number; name: string }

export interface PublicQuestion {
  id: string;
  prompt: string;
  options: string[];
}

export interface QuestionsResponse {
  questionTimeSeconds: number;
  questions: PublicQuestion[];
}

export interface RegisterResponse {
  participantId: number;
  sessionId: number;
  firstName: string;
  lastName: string;
}

export interface GradedAnswer {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
}

export interface LeaderboardRow {
  participantId: number;
  firstName: string;
  lastName: string;
  correctCount: number;
  totalAnswered: number;
  avgResponseTimeMsOnCorrect: number | null;
  completed: boolean;
  rank: number;
}

export interface CompleteResponse {
  completedAt: number;
  leaderboard: LeaderboardRow[];
}

export interface AdminSessionRow {
  id: number;
  name: string;
  createdAt: number;
  activatedAt: number | null;
  endedAt: number | null;
  isActive: boolean;
  participantCount: number;
}

export interface AdminResultsResponse {
  session: { id: number; name: string; activatedAt: number | null; endedAt: number | null };
  leaderboard: LeaderboardRow[];
}

export interface AdminQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AdminQrResponse {
  url: string;
  host: string;
  port: number;
  svg: string;
}
