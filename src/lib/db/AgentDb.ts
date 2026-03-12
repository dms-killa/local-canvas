import Database, { Database as SQLiteDatabase } from "better-sqlite3";
import { AgentTaskStatus, AgencyErrorCode } from "./AgentDb";

export interface AgentTask {
  id: string;
  project_id: string;
  file_version_id: number | null;
  agent_type: string;
  priority: number;
  status: AgentTaskStatus;
  network_health: string | null; // Phase D requirement
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  error_code: AgencyErrorCode;
  retry_count: number;          // Phase D requirement
  timeout_seconds: number;      // Phase D requirement
}

export class AgentDb {
  private db: SQLiteDatabase;

  /**
   * Constructs a new AgentDb instance.
   *
   * @param projectDir - Directory where the agent.db sqlite file will be stored.
   *   Defaults to the current working directory ('.') when not provided.
   */
  constructor(private readonly projectDir: string = ".") {
    try {
      import("fs").then(fs => fs.mkdirSync(this.projectDir, { recursive: true }));
    } catch {}
    this.db = new Database(`${this.projectDir}/agent.db`);
  }

  /** Enforces v1.1 Schema Invariants (Idempotent). */
  private ensureSchema(): void {
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS agent_tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        file_version_id INTEGER,
        agent_type TEXT NOT NULL,
        priority INTEGER NOT NULL DEFAULT 0,

        status TEXT NOT NULL DEFAULT "pending"
          CHECK (status IN ("pending","running","completed","failed")),

        network_health TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime("%Y-%m-%dT%H:%fZ","now")),
        started_at TEXT,
        completed_at TEXT,
        error TEXT,
        error_code TEXT,
        retry_count INTEGER DEFAULT 0,
        timeout_seconds INTEGER DEFAULT 60
      )
    `).run();
  }

  /** Claims the next pending task using atomicity. */
  claimNextTask(): AgentTask | null {
    return this.db.transaction(() => {
      const task = this.db.prepare(
        "SELECT * FROM agent_tasks WHERE status = 'pending' ORDER BY priority DESC, created_at ASC LIMIT 1"
      ).get() as AgentTask | undefined;

      if (!task) return null;

      const now = new Date().toISOString();
      this.db.prepare(`UPDATE agent_tasks SET status = ?, started_at = ? WHERE id = ?`).run(now, now, task.id);

      return { ...task, status: "running" as AgentTaskStatus, started_at: now };
    })();
  }

  /** Re‑queues a failed/retried task. */
  requeueTask(id: string, error: string, code: AgencyErrorCode | null, healthJson?: string): void {
    this.db.prepare(`
      UPDATE agent_tasks
        SET status = "pending",
            error = ?,
            error_code = ?,
            network_health = ?
        WHERE id = ?
      `).run(error, code, healthJson ?? null, id);
  }

  /** Marks a task as completed. */
  markTaskCompleted(id: string): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE agent_tasks
        SET status = "completed",
            completed_at = ?,
            error = NULL,
            error_code = NULL
        WHERE id = ?
      `).run(now, id);
  }

  /** Marks a task as permanently failed. */
  markTaskFailed(id: string, error: string, code: AgencyErrorCode): void {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE agent_tasks
        SET status = "failed",
            completed_at = ?,
            error = ?,
            error_code = ?
        WHERE id = ?
      `).run(now, error, code, id);
  }

  /** Inserts a new task entry. */
  enqueueTask(
    id: string,
    projectId: string,
    fileVersionId: number | null,
    agentType: string,
    priority = 0,
    timeout = 60
  ): void {
    this.db.prepare(`
      INSERT INTO agent_tasks (
        id, project_id, file_version_id, agent_type, priority, status, timeout_seconds
      ) VALUES (?, ?, ?, ?, ?, "pending", ?)
    `).run(id, projectId, fileVersionId, agentType, priority, timeout);
  }

  /** Utility getters */
  getTasksByStatus(status: string | "all"): AgentTask[] {
    if (status === "all") {
      return this.db.prepare("SELECT * FROM agent_tasks ORDER BY created_at DESC").all() as AgentTask[];
    }
    return this.db
      .prepare(`SELECT * FROM agent_tasks WHERE status = ? ORDER BY created_at DESC`)
        .all(status) as AgentTask[];
  }

  getPendingCount(): number {
    const { count } = this.db.prepare("SELECT COUNT(*) AS count FROM agent_tasks WHERE status = 'pending'")
      .get() as { count: number };
    return count;
  }
}
