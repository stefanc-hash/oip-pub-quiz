import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';
import { AppShell } from '@/components/AppShell';
import { RadialTimer } from '@/components/RadialTimer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PublicQuestion } from '@/types';

interface Props {
  question: PublicQuestion;
  index: number;
  total: number;
  questionTimeSeconds: number;
  onSubmit: (selectedIndex: number | null, responseTimeMs: number) => void;
}

export function Question({ question, index, total, questionTimeSeconds, onSubmit }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { secondsLeft, elapsedMs } = useTimer({
    durationSeconds: questionTimeSeconds,
    resetKey: question.id,
    running: !submitted,
    onExpire: () => {
      if (submitted) return;
      setSubmitted(true);
      onSubmit(null, questionTimeSeconds * 1000);
    },
  });

  const submit = (idx: number) => {
    if (submitted) return;
    setSelected(idx);
    setSubmitted(true);
    onSubmit(idx, Math.round(elapsedMs));
  };

  return (
    <AppShell className="animate-fade-in">
      {/* Header: counter left | timer centre | spacer right */}
      <header className="grid grid-cols-3 items-center">
        <div className="space-y-0.5">
          <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">Question</div>
          <div className="font-semibold tabular-nums text-sm">
            {index + 1} <span className="text-[var(--color-fg-muted)]">/ {total}</span>
          </div>
        </div>
        <div className="flex justify-center">
          <RadialTimer secondsLeft={secondsLeft} totalSeconds={questionTimeSeconds} />
        </div>
        <div />
      </header>

      <div className="h-0.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
        <div
          className="h-full bg-[var(--color-primary)] transition-all duration-500"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <h1 className="text-2xl font-bold leading-snug pt-2">{question.prompt}</h1>

      <div className="flex flex-col gap-3 mt-2">
        {question.options.map((opt, i) => (
          <Button
            key={i}
            variant={selected === i ? 'primary' : 'secondary'}
            size="lg"
            disabled={submitted}
            onClick={() => submit(i)}
            className={cn(
              'justify-start text-left px-5 h-auto py-4 whitespace-normal',
              'text-base',
              selected === i
                ? 'ring-1 ring-[var(--color-primary)]/60 ring-offset-1 ring-offset-[var(--color-bg)]'
                : '',
            )}
          >
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)]/25 text-xs font-semibold">
              {submitted && selected === i
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1">{opt}</span>
          </Button>
        ))}
      </div>
    </AppShell>
  );
}
