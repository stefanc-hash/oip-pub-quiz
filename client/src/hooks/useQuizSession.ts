import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api.js';
import type {
  ActiveSession, PublicQuestion, GradedAnswer, LeaderboardRow,
} from '../types.js';

/**
 * Player phases. The flow is strictly sequential:
 *
 *   loading  ──►  no-active-session
 *           └─►  landing  ─►  registering  ─►  instructions  ─►  question
 *                                                              ↕
 *                                                          ┌── reveal
 *                                                          ▼
 *                                                       summary
 */
export type Phase =
  | 'loading'
  | 'no-active-session'
  | 'landing'
  | 'registering'
  | 'instructions'
  | 'question'
  | 'reveal'
  | 'summary'
  | 'error';

export interface QuizState {
  phase: Phase;
  errorMessage: string | null;
  activeSession: ActiveSession | null;
  participantId: number | null;
  participantName: string | null;
  questions: PublicQuestion[];
  questionTimeSeconds: number;
  currentIndex: number;
  lastReveal: GradedAnswer | null;
  /** Per-question selection (or null for timeout) — mirror of what was sent. */
  ownAnswers: { selectedIndex: number | null; isCorrect: boolean }[];
  leaderboard: LeaderboardRow[] | null;
}

const initialState: QuizState = {
  phase: 'loading',
  errorMessage: null,
  activeSession: null,
  participantId: null,
  participantName: null,
  questions: [],
  questionTimeSeconds: 30,
  currentIndex: 0,
  lastReveal: null,
  ownAnswers: [],
  leaderboard: null,
};

export function useQuizSession() {
  const [state, setState] = useState<QuizState>(initialState);

  // Bootstrap: load active session + questions in parallel
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [active, q] = await Promise.all([api.getActiveSession(), api.getQuestions()]);
        if (cancelled) return;
        if (!active) {
          setState(s => ({ ...s, phase: 'no-active-session', questions: q.questions, questionTimeSeconds: q.questionTimeSeconds }));
        } else {
          setState(s => ({
            ...s, phase: 'landing', activeSession: active,
            questions: q.questions, questionTimeSeconds: q.questionTimeSeconds,
          }));
        }
      } catch (err) {
        if (cancelled) return;
        setState(s => ({ ...s, phase: 'error', errorMessage: errMsg(err) }));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const goToRegistration = useCallback(() => {
    setState(s => ({ ...s, phase: 'registering' }));
  }, []);

  const submitRegistration = useCallback(async (firstName: string, lastName: string) => {
    setState(s => ({ ...s, phase: 'registering', errorMessage: null }));
    try {
      const sessionId = (await api.getActiveSession())?.id;
      if (!sessionId) {
        setState(s => ({ ...s, phase: 'no-active-session' }));
        return;
      }
      const r = await api.register(sessionId, firstName, lastName);
      setState(s => ({
        ...s,
        phase: 'instructions',
        participantId: r.participantId,
        participantName: `${r.firstName} ${r.lastName}`,
        activeSession: { id: r.sessionId, name: s.activeSession?.name ?? '' },
      }));
    } catch (err) {
      setState(s => ({ ...s, errorMessage: errMsg(err) }));
    }
  }, []);

  const startQuiz = useCallback(async () => {
    if (!state.participantId) return;
    try {
      await api.start(state.participantId);
      setState(s => ({ ...s, phase: 'question', currentIndex: 0, lastReveal: null, ownAnswers: [] }));
    } catch (err) {
      setState(s => ({ ...s, errorMessage: errMsg(err) }));
    }
  }, [state.participantId]);

  const submitAnswer = useCallback(async (selectedIndex: number | null, responseTimeMs: number) => {
    if (!state.participantId) return;
    const q = state.questions[state.currentIndex];
    if (!q) return;
    try {
      const reveal = await api.submitAnswer(state.participantId, q.id, selectedIndex, responseTimeMs);
      setState(s => ({
        ...s,
        phase: 'reveal',
        lastReveal: reveal,
        ownAnswers: [...s.ownAnswers, { selectedIndex, isCorrect: reveal.isCorrect }],
      }));
    } catch (err) {
      setState(s => ({ ...s, errorMessage: errMsg(err) }));
    }
  }, [state.participantId, state.questions, state.currentIndex]);

  const goNext = useCallback(async () => {
    const isLast = state.currentIndex >= state.questions.length - 1;
    if (!isLast) {
      setState(s => ({ ...s, phase: 'question', currentIndex: s.currentIndex + 1, lastReveal: null }));
      return;
    }
    if (!state.participantId) return;
    try {
      const done = await api.complete(state.participantId);
      setState(s => ({ ...s, phase: 'summary', leaderboard: done.leaderboard }));
    } catch (err) {
      setState(s => ({ ...s, errorMessage: errMsg(err) }));
    }
  }, [state.currentIndex, state.questions.length, state.participantId]);

  return { state, goToRegistration, submitRegistration, startQuiz, submitAnswer, goNext };
}

function errMsg(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}
