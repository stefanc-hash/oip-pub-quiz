import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type DB = Database.Database;

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(here, '../../src/db/schema.sql');

function readSchema(): string {
  // schema.sql lives alongside source; when compiled, the file path is
  // server/dist/db/connection.js, but schema.sql is only in src/. Resolve
  // relative to this file, walking up to the server root, then into src/db.
  // Compiled location: server/dist/db → ../../src/db
  // Source location (via tsx):  server/src/db → ../../src/db (same)
  try {
    return readFileSync(schemaPath, 'utf8');
  } catch {
    // Fallback: try alongside (for source-mode)
    return readFileSync(path.resolve(here, './schema.sql'), 'utf8');
  }
}

export function openDatabase(dbPath: string): DB {
  if (dbPath !== ':memory:') {
    mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(readSchema());
  return db;
}

export function openInMemoryDatabase(): DB {
  return openDatabase(':memory:');
}
