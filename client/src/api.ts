import type {
  ActiveSession, QuestionsResponse, RegisterResponse,
  GradedAnswer, CompleteResponse, LeaderboardRow,
  AdminSessionRow, AdminResultsResponse, AdminQrResponse, AdminQuestion,
} from './types.js';

class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> ?? {}) };
  if (init?.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(path, {
    credentials: 'same-origin',  // send the admin cookie
    ...init,
    headers,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = (await res.json()).error ?? msg; } catch { /* ignore */ }
    throw new ApiError(res.status, msg);
  }
  // Endpoint that returns null literal still parses fine
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const api = {
  getActiveSession: () => req<ActiveSession | null>('/api/session/active'),

  getQuestions: () => req<QuestionsResponse>('/api/quiz/questions'),

  register: (sessionId: number, firstName: string, lastName: string) =>
    req<RegisterResponse>('/api/participants', {
      method: 'POST',
      body: JSON.stringify({ sessionId, firstName, lastName }),
    }),

  start: (participantId: number) =>
    req<{ startedAt: number }>(`/api/participants/${participantId}/start`, { method: 'POST' }),

  submitAnswer: (
    participantId: number,
    questionId: string,
    selectedIndex: number | null,
    responseTimeMs: number,
  ) => req<GradedAnswer>(`/api/participants/${participantId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ questionId, selectedIndex, responseTimeMs }),
  }),

  complete: (participantId: number) =>
    req<CompleteResponse>(`/api/participants/${participantId}/complete`, { method: 'POST' }),

  getLeaderboard: (participantId: number) =>
    req<{ leaderboard: LeaderboardRow[] }>(`/api/participants/${participantId}/leaderboard`),
};

export const adminApi = {
  // Auth
  login: (username: string, password: string) =>
    req<{ ok: true; username: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => req<{ ok: true }>('/api/admin/logout', { method: 'POST' }),
  me: () => req<{ username: string }>('/api/admin/me'),

  // Sessions / groups
  listSessions: () => req<AdminSessionRow[]>('/api/admin/sessions'),
  createSession: (name: string) =>
    req<{ id: number; name: string; createdAt: number }>('/api/admin/sessions', {
      method: 'POST', body: JSON.stringify({ name }),
    }),
  activate: (id: number) =>
    req<{ id: number; activatedAt: number; endedAt: number | null }>(
      `/api/admin/sessions/${id}/activate`, { method: 'POST' },
    ),
  end: (id: number) =>
    req<{ id: number; endedAt: number }>(
      `/api/admin/sessions/${id}/end`, { method: 'POST' },
    ),
  results: (id: number) => req<AdminResultsResponse>(`/api/admin/sessions/${id}/results`),
  qr: () => req<AdminQrResponse>('/api/admin/qr'),

  // Questions
  listQuestions: () => req<AdminQuestion[]>('/api/admin/questions'),
  updateQuestion: (id: string, patch: Omit<AdminQuestion, 'id'>) =>
    req<AdminQuestion>(`/api/admin/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),
};

export { ApiError };
