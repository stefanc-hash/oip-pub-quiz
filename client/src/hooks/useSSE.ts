import { useEffect, useState } from 'react';

export interface SSEFrame { event: string; data: unknown }

export function useSSE(url: string): { lastEvent: SSEFrame | null; connected: boolean; error: string | null } {
  const [lastEvent, setLastEvent] = useState<SSEFrame | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLastEvent(null);
    const es = new EventSource(url);
    setConnected(false); setError(null);

    es.onopen = () => setConnected(true);
    es.onerror = () => {
      setConnected(false);
      setError('connection lost');
      // EventSource auto-reconnects; we leave it open.
    };

    const handle = (event: string) => (e: MessageEvent<string>) => {
      try {
        setLastEvent({ event, data: JSON.parse(e.data) });
      } catch {
        setLastEvent({ event, data: e.data });
      }
    };
    es.addEventListener('leaderboard', handle('leaderboard') as EventListener);
    es.addEventListener('idle', handle('idle') as EventListener);

    return () => es.close();
  }, [url]);

  return { lastEvent, connected, error };
}
