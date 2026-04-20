import { Loader2, AlertCircle, MoonStar } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { useQuizSession } from '@/hooks/useQuizSession';
import { Landing } from './Landing';
import { Register } from './Register';
import { Instructions } from './Instructions';
import { Question } from './Question';
import { Reveal } from './Reveal';
import { Summary } from './Summary';

export function PlayerApp() {
  const session = useQuizSession();
  const { state } = session;

  switch (state.phase) {
    case 'loading':
      return (
        <AppShell>
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[var(--color-fg-muted)]">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Loading…</p>
          </div>
        </AppShell>
      );

    case 'no-active-session':
      return (
        <AppShell>
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)]">
              <MoonStar className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">No active session</h1>
            <p className="text-[var(--color-fg-muted)] max-w-xs">
              Check with the organiser - they’ll start the next round shortly.
            </p>
          </div>
        </AppShell>
      );

    case 'error':
      return (
        <AppShell>
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <AlertCircle className="h-10 w-10 text-[var(--color-incorrect)]" />
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-[var(--color-fg-muted)]">{state.errorMessage}</p>
          </div>
        </AppShell>
      );

    case 'landing':
      return <Landing sessionName={state.activeSession?.name ?? ''} onJoin={session.goToRegistration} />;

    case 'registering':
      return <Register errorMessage={state.errorMessage} onSubmit={session.submitRegistration} />;

    case 'instructions':
      return (
        <Instructions
          name={state.participantName ?? ''}
          totalQuestions={state.questions.length}
          questionTimeSeconds={state.questionTimeSeconds}
          errorMessage={state.errorMessage}
          onStart={session.startQuiz}
        />
      );

    case 'question': {
      const q = state.questions[state.currentIndex];
      if (!q) {
        return (
          <AppShell>
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <AlertCircle className="h-8 w-8 text-[var(--color-incorrect)]" />
              <h1 className="text-xl font-bold">No questions available</h1>
              <p className="text-sm text-[var(--color-fg-muted)]">
                Loaded {state.questions.length} questions; current index {state.currentIndex} is out of range.
              </p>
              {state.errorMessage && <p className="text-sm text-[var(--color-incorrect)]">{state.errorMessage}</p>}
            </div>
          </AppShell>
        );
      }
      return (
        <Question
          question={q}
          index={state.currentIndex}
          total={state.questions.length}
          questionTimeSeconds={state.questionTimeSeconds}
          onSubmit={session.submitAnswer}
        />
      );
    }

    case 'reveal':
      if (!state.lastReveal) return null;
      return (
        <Reveal
          question={state.questions[state.currentIndex]!}
          reveal={state.lastReveal}
          selectedIndex={state.ownAnswers[state.currentIndex]?.selectedIndex ?? null}
          index={state.currentIndex}
          total={state.questions.length}
          isLast={state.currentIndex >= state.questions.length - 1}
          onNext={session.goNext}
        />
      );

    case 'summary':
      return (
        <Summary
          name={state.participantName ?? ''}
          ownAnswers={state.ownAnswers}
          leaderboard={state.leaderboard ?? []}
          totalQuestions={state.questions.length}
        />
      );
  }
}
