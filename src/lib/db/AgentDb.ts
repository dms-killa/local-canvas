import Database, { Database as SQLiteDatabase } from 'better-sqlite3';

// 1. Define the interface based on the schema in agent-architecture.md
export interface AgentTask {
  id: string;
  project_id: string;
  file_version_id: number | null;
  agent_type: string;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  resource_estimate: string | null; // JSON string
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
}

export class AgentDb {
  private db: SQLiteDatabase;

  constructor(projectDir: string) {
    this.db = new Database(`${projectDir}/agent.db`);
  }

  // ... (enqueueTask and updateTaskStatus are fine as .run() returns a RunResult)

  claimNextTask(): AgentTask | null {
    // Cast the initial select
    const task = this.db.prepare(`
      SELECT id FROM agent_tasks
      WHERE status = 'pending'
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
    `).get() as { id: string } | undefined;
    
    if (!task?.id) return null;
    
    const updated = this.db.prepare(`
      UPDATE agent_tasks
      SET status = 'running', started_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `).run(task.id);
    
    if (updated.changes === 0) return null;
    
    // Cast the final task return
    return this.db.prepare(`SELECT * FROM agent_tasks WHERE id = ?`).get(task.id) as AgentTask;
  }

  getPendingCount(): number {
    // Cast the return of .get() to access the 'count' property
    const result = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM agent_tasks
      WHERE status = 'pending'
    `).get() as { count: number };
    
    return result.count;
  }

  getTasksByStatus(status: 'pending' | 'running' | 'completed' | 'failed'): AgentTask[] {
    // Cast the array return
    return this.db.prepare(`
      SELECT * FROM agent_tasks
      WHERE status = ?
      ORDER BY created_at ASC
    `).all(status) as AgentTask[];
  }

  updateTaskStatus(
  taskId: string,
  status: 'running' | 'completed' | 'failed',
  error?: string
  ) {
  return this.db.prepare(`
    UPDATE agent_tasks 
    SET status = ?, error = ?, 
        started_at = CASE WHEN ? = 'running' THEN datetime('now') ELSE started_at END,
        completed_at = CASE WHEN ? IN ('completed', 'failed') THEN datetime('now') ELSE completed_at END
    WHERE id = ?
  `).run(status, error ?? null, status, status, taskId);
  }

}