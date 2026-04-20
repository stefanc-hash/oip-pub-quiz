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
        <div className="space-y-0.5">
          <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">Question</div>
          <div className="font-semibold tabular-nums text-sm">
            {index + 1} <span className="text-[var(--color-fg-muted)]">/ {total}</span>
          </div>
        </div>

        {/* Subtle result badge */}
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide animate-scale-in',
            reveal.isCorrect
              ? 'border-[var(--color-correct)]/40 bg-[var(--color-correct)]/10 text-[var(--color-correct)]'
              : 'border-[var(--color-incorrect)]/40 bg-[var(--color-incorrect)]/10 text-[var(--color-incorrect)]',
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
          {reveal.isCorrect ? 'Correct' : 'Incorrect'}
        </div>
      </header>

      <div className="h-0.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
        <div
          className="h-full bg-[var(--color-primary)] transition-all duration-500"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <h1 className="text-2xl font-bold leading-snug pt-2">{question.prompt}</h1>

      <div className="flex flex-col gap-2">
        {question.options.map((opt, i) => {
          const isCorrect = i === reveal.correctIndex;
          const isWrongSelected = !reveal.isCorrect && i === selectedIndex;
          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3',
                'transition-colors duration-200',
                isCorrect
                  ? 'border-[var(--color-correct)]/35 bg-[var(--color-correct)]/8 text-[var(--color-fg)]'
                  : isWrongSelected
                    ? 'border-[var(--color-incorrect)]/35 bg-[var(--color-incorrect)]/8 text-[var(--color-fg)] animate-incorrect-shake'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)]',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isCorrect
                    ? 'bg-[var(--color-correct)]/20 text-[var(--color-correct)]'
                    : isWrongSelected
                      ? 'bg-[var(--color-incorrect)]/20 text-[var(--color-incorrect)]'
                      : 'bg-[var(--color-bg-elevated-2)] text-[var(--color-fg-muted)]',
                )}
              >
                {isCorrect
                  ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  : isWrongSelected
                    ? <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                    : String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 text-sm">{opt}</span>
            </div>
          );
        })}
      </div>

      {reveal.explanation && (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-bg-elevated-2)] border border-[var(--color-border)] p-4 text-sm leading-relaxed text-[var(--color-fg-muted)]">
          <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)]/60 mb-1.5">Interesting Fact</div>
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
