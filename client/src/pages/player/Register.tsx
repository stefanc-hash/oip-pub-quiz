import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  errorMessage: string | null;
  onSubmit: (firstName: string, lastName: string) => void;
}

export function Register({ errorMessage, onSubmit }: Props) {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const valid = first.trim() !== '' && last.trim() !== '';

  return (
    <AppShell className="animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Your name</h1>
        <p className="text-[var(--color-fg-muted)]">So we know who’s on the leaderboard.</p>
      </div>

      <form
        className="flex flex-col gap-5 flex-1"
        onSubmit={e => {
          e.preventDefault();
          if (!valid || submitted) return;
          setSubmitted(true);
          onSubmit(first, last);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="first">First name</Label>
          <Input id="first" autoFocus autoComplete="given-name" value={first} onChange={e => setFirst(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last">Last name</Label>
          <Input id="last" autoComplete="family-name" value={last} onChange={e => setLast(e.target.value)} />
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-incorrect)]/10 border border-[var(--color-incorrect)]/30 p-3 text-sm text-[var(--color-incorrect)]">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Button type="submit" size="xl" className="mt-auto" disabled={!valid || (submitted && !errorMessage)}>
          {submitted && !errorMessage ? <><Loader2 className="h-4 w-4 animate-spin" />Joining…</> : 'Continue'}
        </Button>
      </form>
    </AppShell>
  );
}
