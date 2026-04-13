import { useEffect, useRef, useState } from 'react';

interface UseTimerOptions {
  /** Total seconds to run for. Re-running with a new value resets the timer. */
  durationSeconds: number;
  /** Called once when the countdown reaches zero. */
  onExpire?: () => void;
  /** Pause / resume control. Default true. */
  running?: boolean;
  /** Reset trigger — change this value to restart the timer. */
  resetKey?: string | number;
}

/**
 * Per-question countdown timer.
 *
 * Returns:
 *  - secondsLeft: integer, ticks down every ~100ms (smoother UI)
 *  - elapsedMs:   precise elapsed milliseconds since start (for response-time tracking)
 */
export function useTimer({ durationSeconds, onExpire, running = true, resetKey }: UseTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number>(performance.now());
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    startedAtRef.current = performance.now();
    expiredRef.current = false;
    setSecondsLeft(durationSeconds);
    setElapsedMs(0);
  }, [resetKey, durationSeconds]);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const now = performance.now();
      const elapsed = now - startedAtRef.current;
      const remaining = Math.max(0, durationSeconds * 1000 - elapsed);
      setElapsedMs(elapsed);
      setSecondsLeft(Math.ceil(remaining / 1000));
      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current?.();
      }
    };
    const id = window.setInterval(tick, 100);
    tick();
    return () => window.clearInterval(id);
  }, [running, durationSeconds, resetKey]);

  return { secondsLeft, elapsedMs };
}
