import { useEffect, useState } from 'react';
import { Plus, Play, StopCircle, RotateCcw, Monitor, BarChart3, AlertCircle, LogOut } from 'lucide-react';
import { adminApi } from '@/api';
import type { AdminSessionRow } from '@/types';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QrDialog } from './QrDialog';
import { Results } from './Results';
import { cn } from '@/lib/utils';

interface Props { onLogout: () => Promise<void> | void; username: string }

export function Sessions({ onLogout, username }: Props) {
  const [sessions, setSessions] = useState<AdminSessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [openResultsFor, setOpenResultsFor] = useState<number | null>(null);

  async function refresh() {
    try {
      setSessions(await adminApi.listSessions());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load');
    }
  }

  useEffect(() => { refresh(); }, []);

  if (error) {
    return (
      <AppShell variant="wide">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="h-8 w-8 text-[var(--color-incorrect)]" />
          <h1 className="text-xl font-bold">Couldn’t load admin</h1>
          <p className="text-[var(--color-fg-muted)]">{error}</p>
          <Button variant="outline" size="sm" onClick={onLogout}>Sign out</Button>
        </div>
      </AppShell>
    );
  }

  if (openResultsFor !== null) {
    return <Results sessionId={openResultsFor} onBack={() => setOpenResultsFor(null)} />;
  }

  async function activate(id: number) {
    setBusy(true);
    try { await adminApi.activate(id); await refresh(); } finally { setBusy(false); }
  }
  async function endSession(id: number) {
    setBusy(true);
    try { await adminApi.end(id); await refresh(); } finally { setBusy(false); }
  }
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || busy) return;
    setBusy(true);
    try { await adminApi.createSession(newName.trim()); setNewName(''); await refresh(); }
    finally { setBusy(false); }
  }

  const active = sessions.find(s => s.isActive);

  return (
    <AppShell variant="wide">
      <header className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">
            Pub Quiz · Admin · {username}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
        </div>
        <div className="flex gap-2">
          <QrDialog />
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="p-2">
          {sessions.length === 0 ? (
            <p className="p-4 text-[var(--color-fg-muted)] text-sm">
              No groups yet. Create one below to begin.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {sessions.map(s => {
                const status = s.isActive ? 'active' : s.endedAt ? 'ended' : 'created';
                return (
                  <li key={s.id} className={cn('p-4 flex flex-wrap items-center gap-3', s.isActive && 'bg-[var(--color-primary)]/5')}>
                    <div className="flex-1 min-w-[10rem] space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{s.name}</h3>
                        <StatusBadge status={status} />
                      </div>
                      <div className="text-xs text-[var(--color-fg-muted)]">
                        Created {new Date(s.createdAt).toLocaleString()}
                        {s.activatedAt && ` · Activated ${new Date(s.activatedAt).toLocaleTimeString()}`}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {!s.isActive && (
                        <Button size="sm" variant="primary" disabled={busy} onClick={() => activate(s.id)}>
                          {s.endedAt ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                          {s.endedAt ? 'Reopen' : 'Activate'}
                        </Button>
                      )}
                      {s.isActive && (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => endSession(s.id)}>
                          <StopCircle className="h-3.5 w-3.5" />
                          End
                        </Button>
                      )}
                      <Button asChild size="sm" variant="ghost">
                        <a href={`/display?sessionId=${s.id}`} target="_blank" rel="noreferrer">
                          <Monitor className="h-3.5 w-3.5" />
                          Display
                        </a>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setOpenResultsFor(s.id)}>
                        <BarChart3 className="h-3.5 w-3.5" />
                        Results
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={create}>
            <div className="flex-1 space-y-2">
              <Label htmlFor="name">New group name</Label>
              <Input id="name" placeholder="e.g. Friday night, Round 1" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy || !newName.trim()}>
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </form>
          <p className="mt-3 text-xs text-[var(--color-fg-muted)]">
            New groups start inactive. Activate one to receive the next QR scans.
            {active && ` Currently active: ${active.name}.`}
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: 'active' | 'created' | 'ended' }) {
  if (status === 'active') return <Badge variant="primary">Active</Badge>;
  if (status === 'ended') return <Badge variant="default">Ended</Badge>;
  return <Badge variant="outline">Idle</Badge>;
}
