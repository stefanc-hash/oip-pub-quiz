import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

/**
 * Stateless cookie-based admin authentication.
 *
 *  - Login: verifies username + password with a constant-time compare;
 *    issues a signed cookie containing the issuance time + username.
 *  - Verify: HMAC-checks the cookie and rejects expired tokens.
 *
 * Cookie format: base64url(JSON.stringify({u, iat})) + "." + base64url(hmac)
 *
 * No server-side session store — the cookie is the source of truth.
 * Rotating the secret invalidates all sessions.
 */
export class AuthService {
  constructor(
    private readonly username: string,
    private readonly password: string,
    private readonly secret: string,
    private readonly maxAgeMs: number,
  ) {
    if (secret.length < 16) {
      throw new Error('Session secret must be at least 16 characters');
    }
  }

  /** Verifies credentials in constant time. */
  verifyCredentials(username: string, password: string): boolean {
    const userOk = constantTimeEqual(username, this.username);
    const passOk = constantTimeEqual(password, this.password);
    return userOk && passOk;
  }

  /** Issues a signed session cookie value. */
  issueToken(now: number = Date.now()): string {
    const payload = { u: this.username, iat: now };
    const body = b64url(JSON.stringify(payload));
    const sig = b64url(this.sign(body));
    return `${body}.${sig}`;
  }

  /** Returns the username if the token is valid + unexpired, otherwise null. */
  verifyToken(token: string | undefined, now: number = Date.now()): string | null {
    if (!token || typeof token !== 'string') return null;
    const dot = token.indexOf('.');
    if (dot <= 0) return null;
    const body = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    const expected = b64url(this.sign(body));
    if (!constantTimeEqual(sig, expected)) return null;

    let payload: { u?: unknown; iat?: unknown };
    try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); }
    catch { return null; }

    if (typeof payload.u !== 'string' || typeof payload.iat !== 'number') return null;
    if (now - payload.iat > this.maxAgeMs) return null;
    if (payload.u !== this.username) return null; // username changed in env → invalidate
    return payload.u;
  }

  get cookieName(): string { return 'pq_admin'; }
  get maxAge(): number { return Math.floor(this.maxAgeMs / 1000); }

  private sign(body: string): Buffer {
    return createHmac('sha256', this.secret).update(body).digest();
  }

  /** Helper for tests / setup scripts: print a strong random secret. */
  static generateSecret(): string {
    return randomBytes(32).toString('hex');
  }
}

function b64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64url');
}

function constantTimeEqual(a: string, b: string): boolean {
  // timingSafeEqual requires equal-length buffers, so pad to a fixed length first.
  const len = Math.max(a.length, b.length, 32);
  const ab = Buffer.alloc(len);
  const bb = Buffer.alloc(len);
  ab.write(a);
  bb.write(b);
  return timingSafeEqual(ab, bb) && a.length === b.length;
}
