import { useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MoonStar, Trophy, Users, Wifi, WifiOff } from 'lucide-react';
import { useSSE } from '@/hooks/useSSE';
import { AppShell } from '@/components/AppShell';
import { Badge } from '@/components/ui/badge';
import { cn, formatSeconds } from '@/lib/utils';
import type { LeaderboardRow } from '@/types';

interface LeaderboardPayload {
  session: { id: number; name: string };
  rows: LeaderboardRow[];
}

export function Display() {
  const [params] = useSearchParams();
  const sessionId = params.get('sessionId');
  const url = useMemo(
    () => `/api/display/stream${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`,
    [sessionId],
  );
  const { lastEvent, connected } = useSSE(url);

  // Track which participants moved up in rank to flash them
  const prevRanksRef = useRef<Map<number, number>>(new Map());
  const [flashedIds, setFlashedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (lastEvent?.event !== 'leaderboard') return;
    const rows = (lastEvent.data as LeaderboardPayload).rows;
    const movedUp: number[] = [];
    for (const row of rows) {
      const prev = prevRanksRef.current.get(row.participantId);
      if (prev !== undefined && row.rank < prev) movedUp.push(row.participantId);
    }
    prevRanksRef.current = new Map(rows.map(r => [r.participantId, r.rank]));
    if (movedUp.length > 0) {
      setFlashedIds(new Set(movedUp));
      const t = setTimeout(() => setFlashedIds(new Set()), 900);
      return () => clearTimeout(t);
    }
  }, [lastEvent]);

  if (!lastEvent) {
    return (
      <AppShell variant="display">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight">Connecting…</h1>
          <p className="text-2xl text-[var(--color-fg-muted)]">
            {connected ? 'Waiting for first update' : 'Establishing live connection'}
          </p>
        </div>
      </AppShell>
    );
  }

  if (lastEvent.event === 'idle') {
    return (
      <AppShell variant="display">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)]">
            <MoonStar className="h-12 w-12" />
          </div>
          <h1 className="text-6xl font-bold tracking-tight">Waiting for the next round…</h1>
          <p className="text-2xl text-[var(--color-fg-muted)]">
            The organiser hasn’t started a session yet.
          </p>
        </div>
      </AppShell>
    );
  }

  const payload = lastEvent.data as LeaderboardPayload;
  const rows = payload.rows;

  return (
    <AppShell variant="display">
      <header className="flex items-end justify-between gap-6 flex-wrap">
        <div className="space-y-2">
          <div className="text-base uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">Pub Quiz · Live</div>
          <h1 className="text-7xl font-bold tracking-tight">{payload.session.name}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xl text-[var(--color-fg-muted)]">
            <Users className="h-6 w-6" />
            {rows.length}
          </div>
          <Badge variant={connected ? 'secondary' : 'incorrect'} className="text-base px-3 py-1">
            {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {connected ? 'Live' : 'Reconnecting'}
          </Badge>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <div className="text-3xl text-[var(--color-fg-muted)]">No players yet</div>
          <div className="text-2xl text-[var(--color-fg-muted)]">Scan the QR code to join.</div>
        </div>
      ) : (
        <ol className="space-y-3">
          {rows.map((r, i) => (
            <li
              key={r.participantId}
              className={cn(
                'grid grid-cols-[5rem_1fr_8rem_8rem] items-center gap-6 rounded-[var(--radius-xl)] px-8 py-6 transition-all duration-500',
                i === 0 && rows[0]!.correctCount > 0
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
                  : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
                flashedIds.has(r.participantId) && 'animate-rank-up',
              )}
            >
              <div className="flex items-center justify-center text-4xl font-black tabular-nums">
                {i === 0 && rows[0]!.correctCount > 0 ? <Trophy className="h-10 w-10" /> : `#${r.rank}`}
              </div>
              <div className="text-3xl font-bold truncate">{r.firstName} {r.lastName}</div>
              <div className="text-3xl font-bold tabular-nums text-right">{r.correctCount}</div>
              <div className="text-xl tabular-nums text-right opacity-70">
                {formatSeconds(r.avgResponseTimeMsOnCorrect)}
              </div>
            </li>
          ))}
        </ol>
      )}
    </AppShell>
  );
}
