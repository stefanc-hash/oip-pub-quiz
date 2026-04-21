import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, AlertCircle, Trophy, RefreshCw } from 'lucide-react';
import { adminApi } from '@/api';
import type { AdminResultsResponse } from '@/types';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMs } from '@/lib/utils';

const POLL_MS = 5000;

interface Props { sessionId: number; onBack: () => void }

export function Results({ sessionId, onBack }: Props) {
  const [data, setData] = useState<AdminResultsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    try {
      const d = await adminApi.results(sessionId);
      setData(d);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed');
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => load(), POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId]);

  return (
    <AppShell variant="wide">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="self-start" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back to groups
        </Button>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-[var(--color-fg-muted)]">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button variant="ghost" size="icon" disabled={refreshing} onClick={() => load(true)}
            className="h-8 w-8">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-incorrect)]/10 border border-[var(--color-incorrect)]/30 p-3 text-sm text-[var(--color-incorrect)]">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!data && !error && <div className="h-32 animate-pulse rounded-md bg-[var(--color-bg-elevated)]" />}

      {data && (
        <>
          <header className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">Results</div>
              <h1 className="text-2xl font-bold tracking-tight">{data.session.name}</h1>
            </div>
            <div className="text-sm text-[var(--color-fg-muted)]">
              {data.session.endedAt
                ? <>Ended {new Date(data.session.endedAt).toLocaleString()}</>
                : data.session.activatedAt
                  ? <Badge variant="primary">Active - live</Badge>
                  : 'Not yet activated'}
            </div>
          </header>

          <Card>
            <CardContent className="p-2">
              {data.leaderboard.length === 0 ? (
                <p className="p-4 text-[var(--color-fg-muted)] text-sm">No participants in this group yet.</p>
              ) : (
                <ol className="divide-y divide-[var(--color-border)]">
                  {data.leaderboard.map(r => (
                    <li key={r.participantId} className="grid grid-cols-[2.5rem_1fr_auto_auto] items-center gap-3 px-3 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-elevated-2)] text-sm font-semibold tabular-nums">
                        {r.rank === 1 ? <Trophy className="h-4 w-4 text-[var(--color-primary)]" /> : r.rank}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{r.firstName} {r.lastName}</div>
                        <div className="text-xs text-[var(--color-fg-muted)]">
                          {r.totalAnswered} answered · {r.completed ? 'finished' : 'in progress'}
                        </div>
                      </div>
                      <Badge variant={r.correctCount > 0 ? 'primary' : 'default'}>
                        {r.correctCount} correct
                      </Badge>
                      <div className="w-20 text-right text-sm text-[var(--color-fg-muted)] tabular-nums">
                        {formatMs(r.avgResponseTimeMsOnCorrect)}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}
