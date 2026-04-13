import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load .env from project root (two levels up from server/src)
const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, '../../.env') });

function str(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function int(name: string, fallback: number): number {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) throw new Error(`Env var ${name} is not an integer: ${v}`);
  return n;
}

function requireProd(name: string, devFallback: string): string {
  const v = process.env[name];
  if (v && v.trim() !== '') return v;
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error(
      `Env var ${name} must be set in production. ` +
      `Generate one with: openssl rand -hex 32`,
    );
  }
  // Dev fallback — never used when NODE_ENV=production
  return devFallback;
}

export const config = {
  port: int('PORT', 3000),
  host: str('HOST', '0.0.0.0'),
  dbPath: str('DB_PATH', './data/quiz.db'),
  questionTimeSeconds: int('QUESTION_TIME_SECONDS', 30),

  // ─── Admin auth (login-based) ───
  adminUsername: str('ADMIN_USERNAME', 'admin'),
  adminPassword: requireProd('ADMIN_PASSWORD', 'change-me-in-dev'),
  /** HMAC key used to sign the admin session cookie. Required in prod. */
  sessionSecret: requireProd('SESSION_SECRET', 'dev-only-not-secret'),
  /** Session lifetime in milliseconds. Default 12 hours. */
  sessionMaxAgeMs: int('SESSION_MAX_AGE_MS', 12 * 60 * 60 * 1000),

  /**
   * Public URL the players reach (e.g. https://oip-pub-quiz.up.railway.app).
   * When set, the QR endpoint uses this instead of detecting a LAN IP.
   * Trailing slash optional.
   */
  publicUrl: process.env['PUBLIC_URL']?.trim() || null,

  isProduction: process.env['NODE_ENV'] === 'production',

  // Resolve the built client directory relative to the compiled server
  clientDist: path.resolve(here, '../../client/dist'),
} as const;
