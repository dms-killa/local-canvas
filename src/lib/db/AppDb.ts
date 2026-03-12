// src/lib/db/AppDb.ts

import Database, { Database as SQLiteDatabase } from 'better-sqlite3';

export class AppDb {
  private db: SQLiteDatabase;

  constructor(dbPath: string = 'data/app.db') {
    this.db = new Database(dbPath);
    this.ensureSchema(); // Critical addition
  }

  private ensureSchema(): void {
    this.db.exec(`
CREATE TABLE IF NOT EXISTS projects_index (
project_id TEXT PRIMARY KEY,
name TEXT NOT NULL,
last_known_path TEXT NOT NULL,
last_opened_at DATETIME,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);
  }

  registerProject(id: string, name: string, path: string) {
    const stmt = this.db.prepare(`
      INSERT INTO projects_index (project_id, name, last_known_path, last_opened_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(project_id) DO UPDATE SET
        name = excluded.name,
        last_known_path = excluded.last_known_path,
        last_opened_at = excluded.last_opened_at
    `);
    return stmt.run(id, name, path);
  }

  getProjectPath(id: string): string | undefined {
    const row = this.db.prepare('SELECT last_known_path FROM projects_index WHERE project_id = ?')
      .get(id) as { last_known_path: string } | undefined;
    return row?.last_known_path;
  }
}