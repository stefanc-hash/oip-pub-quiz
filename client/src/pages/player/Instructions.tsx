import { useState } from 'react';
import { ListChecks, Clock, MousePointerClick, Zap, Play, AlertCircle, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  name: string;
  totalQuestions: number;
  questionTimeSeconds: number;
  errorMessage: string | null;
  onStart: () => void;
}

export function Instructions({ name, totalQuestions, questionTimeSeconds, errorMessage, onStart }: Props) {
  const first = name.split(' ')[0] ?? name;
  const [busy, setBusy] = useState(false);

  const rules = [
    { icon: ListChecks, label: 'Questions', value: `${totalQuestions} multiple-choice` },
    { icon: Clock, label: 'Time per question', value: `${questionTimeSeconds} seconds` },
    { icon: MousePointerClick, label: 'Submit', value: 'One tap, one chance' },
    { icon: Zap, label: 'Tiebreaker', value: 'Faster correct answers win' },
  ];

  return (
    <AppShell className="animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Ready, {first}?</h1>
        <p className="text-[var(--color-fg-muted)]">Quick read, then we begin.</p>
      </div>

      <Card>
        <CardContent className="p-2">
          <ul className="divide-y divide-[var(--color-border)]">
            {rules.map(r => (
              <li key={r.label} className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-elevated-2)] text-[var(--color-primary)]">
                  <r.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">{r.label}</div>
                  <div className="font-semibold">{r.value}</div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-incorrect)]/10 border border-[var(--color-incorrect)]/30 p-3 text-sm text-[var(--color-incorrect)]">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button
        size="xl"
        className="mt-auto w-full"
        disabled={busy && !errorMessage}
        onClick={() => { setBusy(true); onStart(); }}
      >
        {busy && !errorMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
        {busy && !errorMessage ? 'Starting…' : 'Start'}
      </Button>
    </AppShell>
  );
}
