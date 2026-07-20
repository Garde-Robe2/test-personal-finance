import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const defaultPath = 'data/personal-finance.sqlite';
export const databasePath = process.env.DATABASE_PATH || defaultPath;

/** Initialize the local database and apply unapplied SQL migrations. */
export function initializeDatabase() {
  const db = openDatabase();
  db.close();
}

/** Open an initialized database for a request. Callers must close the returned handle. */
export function openDatabase() {
  mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');

  const migrationsDir = join(process.cwd(), 'migrations');
  const applied = new Set(db.prepare('SELECT version FROM schema_migrations').all().map((row) => row.version));
  for (const file of readdirSync(migrationsDir).filter((name) => name.endsWith('.sql')).sort()) {
    if (applied.has(file)) continue;
    db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
    db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, datetime(\'now\'))').run(file);
  }
  return db;
}
