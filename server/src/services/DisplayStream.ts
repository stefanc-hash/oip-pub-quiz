import type { EventBus } from './EventBus.js';
import type { SessionService } from './SessionService.js';
import type { LeaderboardService } from './LeaderboardService.js';

export type DisplayEventName = 'leaderboard' | 'idle';

export interface DisplaySink {
  /** Called once per SSE frame. Implementations write to a stream / buffer. */
  send(event: DisplayEventName, data: unknown): void;
}

export interface DisplayStreamOptions {
  /**
   * If set, bind the stream to this specific session id and ignore active-session
   * changes. Lets admin show the leaderboard for any group (including ended ones).
   * If null/undefined, follow whichever session is currently active.
   */
  fixedSessionId?: number | null;
}

/**
 * Manages a single display client's view.
 *
 *  - Default mode (no fixedSessionId): emit a snapshot of the active session,
 *    and resubscribe whenever the admin rotates active sessions.
 *  - Fixed mode (fixedSessionId set): emit and subscribe to *that* session
 *    forever, regardless of which session is "active". Used for per-group
 *    displays opened from the admin UI.
 */
export class DisplayStream {
  private unsubLeaderboard: (() => void) | null = null;
  private unsubGlobal: (() => void) | null = null;
  private stopped = false;
  private readonly fixedSessionId: number | null;

  constructor(
    private readonly bus: EventBus,
    private readonly sessions: SessionService,
    private readonly leaderboard: LeaderboardService,
    private readonly sink: DisplaySink,
    options: DisplayStreamOptions = {},
  ) {
    this.fixedSessionId = options.fixedSessionId ?? null;
  }

  start(): void {
    if (this.fixedSessionId !== null) {
      this.bindToFixed(this.fixedSessionId);
      return;
    }
    this.refreshActive();
    this.unsubGlobal = this.bus.onGlobalEvent(e => {
      if (this.stopped) return;
      if (e.type === 'active-session-changed') this.refreshActive();
    });
  }

  stop(): void {
    this.stopped = true;
    this.unsubLeaderboard?.();
    this.unsubLeaderboard = null;
    this.unsubGlobal?.();
    this.unsubGlobal = null;
  }

  private bindToFixed(sessionId: number): void {
    let session;
    try { session = this.sessions.getById(sessionId); }
    catch {
      this.sink.send('idle', { reason: 'session-not-found' });
      return;
    }
    this.pushSnapshot(session.id, session.name);
    this.unsubLeaderboard = this.bus.onSessionEvent(session.id, () => {
      if (this.stopped) return;
      this.pushSnapshot(session.id, session.name);
    });
  }

  private refreshActive(): void {
    this.unsubLeaderboard?.();
    this.unsubLeaderboard = null;

    const active = this.sessions.getActive();
    if (!active) {
      this.sink.send('idle', { reason: 'no-active-session' });
      return;
    }
    const sessionId = active.id;
    const name = active.name;
    this.pushSnapshot(sessionId, name);
    this.unsubLeaderboard = this.bus.onSessionEvent(sessionId, () => {
      if (this.stopped) return;
      this.pushSnapshot(sessionId, name);
    });
  }

  private pushSnapshot(sessionId: number, name: string): void {
    this.sink.send('leaderboard', {
      session: { id: sessionId, name },
      rows: this.leaderboard.getLeaderboard(sessionId),
    });
  }
}
