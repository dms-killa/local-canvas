// src/lib/db/ProjectDb.ts
import Database, { Database as SQLiteDatabase } from 'better-sqlite3';

export interface FileVersion {
  id: number;
  file_id: number;
  version_number: number;
  content: string;
  save_type: 'manual' | 'autosave';
  created_at: string;
}

export class ProjectDb {
  private db: SQLiteDatabase;

  constructor(projectDir: string) {
    this.db = new Database(`${projectDir}/project.db`);
    this.ensureSchema(); // Critical addition
  }

  private ensureSchema(): void {
    this.db.exec(`
CREATE TABLE IF NOT EXISTS files (
id INTEGER PRIMARY KEY,
path TEXT UNIQUE NOT NULL,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS file_versions (
id INTEGER PRIMARY KEY,
file_id INTEGER NOT NULL,
version_number INTEGER NOT NULL,
content TEXT NOT NULL,
save_type TEXT CHECK(save_type IN ('manual', 'autosave')),
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(file_id) REFERENCES files(id),
UNIQUE(file_id, version_number)
);
CREATE TABLE IF NOT EXISTS version_artifacts (
id INTEGER PRIMARY KEY,
file_version_id INTEGER NOT NULL,
artifact_type TEXT NOT NULL,
content TEXT NOT NULL,
content_sha256 TEXT,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(file_version_id) REFERENCES file_versions(id) ON DELETE CASCADE
);
`);
  }

  /**
   * Atomic Save: Ensures file existence and creates a new version in one block.
   */
  saveVersion(
    filePath: string,
    content: string,
    type: 'manual' | 'autosave' = 'manual'
  ): number {
    const txn = this.db.transaction(() => {
      // 1. Ensure file exists
      this.db
        .prepare('INSERT OR IGNORE INTO files (path) VALUES (?)')
        .run(filePath);

      const file = this.db
        .prepare('SELECT id FROM files WHERE path = ?')
        .get(filePath) as { id: number };

      // 2. Insert new version
      const info = this.db.prepare(`
        INSERT INTO file_versions (file_id, version_number, content, save_type)
        VALUES (
          ?,
          COALESCE(
            (SELECT MAX(version_number) + 1 FROM file_versions WHERE file_id = ?),
            1
          ),
          ?,
          ?
        )
      `).run(file.id, file.id, content, type);

      return info.lastInsertRowid as number;
    });

    return txn();
  }

  addArtifact(versionId: number, type: string, content: string, sha: string) {
    return this.db.prepare(`
      INSERT INTO version_artifacts
      (file_version_id, artifact_type, content, content_sha256)
      VALUES (?, ?, ?, ?)
    `).run(versionId, type, content, sha);
  }

  getLatestVersion(filePath: string) {
  return this.db.prepare(`
    SELECT fv.*
    FROM file_versions fv
    JOIN files f ON f.id = fv.file_id
    WHERE f.path = ?
    ORDER BY fv.version_number DESC
    LIMIT 1
  `).get(filePath);
  }

  getArtifactsForVersion(versionId: number) {
    return this.db.prepare(`
      SELECT *
      FROM version_artifacts
      WHERE file_version_id = ?
      ORDER BY created_at ASC
    `).all(versionId);
  }

  getVersionById(versionId: number): FileVersion | undefined {
    return this.db.prepare(`
      SELECT *
      FROM file_versions
      WHERE id = ?
    `).get(versionId) as FileVersion | undefined;
  }

}