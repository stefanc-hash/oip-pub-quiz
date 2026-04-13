import { useState } from 'react';
import { LogIn, AlertCircle, KeyRound } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  onLogin: (username: string, password: string) => Promise<void>;
}

export function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setBusy(false);
    }
  };

  return (
    <AppShell variant="narrow">
      <div className="flex-1 flex flex-col justify-center gap-6 py-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-primary)]">
            <KeyRound className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin sign in</h1>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">Pub Quiz administration</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-5">
            <form className="flex flex-col gap-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="u">Username</Label>
                <Input
                  id="u" autoFocus autoComplete="username"
                  value={username} onChange={e => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p">Password</Label>
                <Input
                  id="p" type="password" autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-incorrect)]/10 border border-[var(--color-incorrect)]/30 p-3 text-sm text-[var(--color-incorrect)]">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" size="lg" disabled={busy || !username || !password}>
                <LogIn className="h-4 w-4" />
                {busy ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
