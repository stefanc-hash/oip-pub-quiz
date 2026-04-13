import { EventEmitter } from 'node:events';

export type SessionEvent = { type: 'leaderboard-changed' };
export type GlobalEvent = { type: 'active-session-changed' };

const GLOBAL_CHANNEL = '__global__';

/**
 * In-memory pub/sub for session-scoped and global events.
 * Used by the SSE display handler to push leaderboard updates and to
 * resubscribe when the admin rotates the active session.
 */
export class EventBus {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(100);
  }

  private channel(sessionId: number): string {
    return `session:${sessionId}`;
  }

  onSessionEvent(sessionId: number, listener: (e: SessionEvent) => void): () => void {
    const ch = this.channel(sessionId);
    this.emitter.on(ch, listener);
    return () => this.emitter.off(ch, listener);
  }

  emitSessionEvent(sessionId: number, event: SessionEvent): void {
    this.emitter.emit(this.channel(sessionId), event);
  }

  onGlobalEvent(listener: (e: GlobalEvent) => void): () => void {
    this.emitter.on(GLOBAL_CHANNEL, listener);
    return () => this.emitter.off(GLOBAL_CHANNEL, listener);
  }

  emitGlobalEvent(event: GlobalEvent): void {
    this.emitter.emit(GLOBAL_CHANNEL, event);
  }
}
