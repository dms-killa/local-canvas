import Database, { Database as SQLiteDatabase } from 'better-sqlite3';

export class ProjectDb {
  private db: SQLiteDatabase;

  constructor(projectDir: string) {
    this.db = new Database(`${projectDir}/project.db`);
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
}
