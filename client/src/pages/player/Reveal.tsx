import { Check, X, ArrowRight, Trophy } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PublicQuestion, GradedAnswer } from '@/types';

interface Props {
  question: PublicQuestion;
  reveal: GradedAnswer;
  selectedIndex: number | null;
  index: number;
  total: number;
  isLast: boolean;
  onNext: () => void;
}

export function Reveal({ question, reveal, selectedIndex, index, total, isLast, onNext }: Props) {
  const Icon = reveal.isCorrect ? Check : X;

  return (
    <AppShell className="animate-fade-in">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">Question</div>
          <div className="font-semibold tabular-nums">{index + 1} <span className="text-[var(--color-fg-muted)]">/ {total}</span></div>
        </div>
      </header>

      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
        <div
          className="h-full bg-[var(--color-primary)] transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <h1 className="text-2xl font-bold leading-snug pt-2">{question.prompt}</h1>

      <div className="flex flex-col gap-2.5">
        {question.options.map((opt, i) => {
          const isCorrect = i === reveal.correctIndex;
          const isWrongSelected = !reveal.isCorrect && i === selectedIndex;
          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3.5',
                isCorrect
                  ? 'border-[var(--color-correct)] bg-[var(--color-correct)]/10 text-[var(--color-fg)] animate-correct-pulse'
                  : isWrongSelected
                    ? 'border-[var(--color-incorrect)] bg-[var(--color-incorrect)]/10 text-[var(--color-fg)] animate-incorrect-shake'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)]',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  isCorrect
                    ? 'bg-[var(--color-correct)] text-[var(--color-correct-fg)]'
                    : isWrongSelected
                      ? 'bg-[var(--color-incorrect)] text-[var(--color-incorrect-fg)]'
                      : 'bg-[var(--color-bg-elevated-2)]',
                )}
              >
                {isCorrect
                  ? <Check className="h-4 w-4" strokeWidth={3} />
                  : isWrongSelected
                    ? <X className="h-4 w-4" strokeWidth={3} />
                    : String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          'flex items-center gap-3 self-start rounded-full px-4 py-2 font-semibold animate-scale-in',
          reveal.isCorrect
            ? 'bg-[var(--color-correct)] text-[var(--color-correct-fg)]'
            : 'bg-[var(--color-incorrect)] text-[var(--color-incorrect-fg)]',
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={3} />
        {reveal.isCorrect ? 'Correct' : 'Incorrect'}
      </div>

      {reveal.explanation && (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-elevated-2)] p-4 text-sm leading-relaxed">
          <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)] mb-1">Why</div>
          {reveal.explanation}
        </div>
      )}

      <Button size="xl" className="mt-auto w-full" onClick={onNext}>
        {isLast ? <Trophy className="h-5 w-5" /> : null}
        {isLast ? 'See results' : 'Next question'}
        {!isLast && <ArrowRight className="h-5 w-5" />}
      </Button>
    </AppShell>
  );
}
