import Database, { Database as SQLiteDatabase } from 'better-sqlite3';

export class AgentDb {
  private db: SQLiteDatabase;

  constructor(projectDir: string) {
    this.db = new Database(`${projectDir}/agent.db`);
  }

    enqueueTask(
    taskId: string,
    projectId: string,
    versionId: number,
    agentType: string,
    priority: number = 0
    ) {
    return this.db.prepare(`
        INSERT INTO agent_tasks
        (id, project_id, file_version_id, agent_type, priority, status, created_at)
        VALUES
        (?, ?, ?, ?, ?, 'pending', datetime('now'))
    `).run(taskId, projectId, versionId, agentType, priority);
    }

  updateTaskStatus(taskId: string, status: 'running' | 'completed' | 'failed', error?: string) {
    return this.db.prepare(`
      UPDATE agent_tasks 
      SET status = ?, error = ?, 
          started_at = CASE WHEN ? = 'running' THEN datetime('now') ELSE started_at END,
          completed_at = CASE WHEN ? IN ('completed', 'failed') THEN datetime('now') ELSE completed_at END
      WHERE id = ?
    `).run(status, error || null, status, status, taskId);
  }

  claimNextTask() {
    const task = this.db.prepare(`
      SELECT id
      FROM agent_tasks
      WHERE status = 'pending'
      ORDER BY priority DESC, created_at ASC
      LIMIT 1
    `).get() as { id?: string } | undefined;
    
    if (!task?.id) {
      return null;
    }
    
    const updated = this.db.prepare(`
      UPDATE agent_tasks
      SET status = 'running',
          started_at = datetime('now')
      WHERE id = ?
      AND status = 'pending'
    `).run(task.id);
    
    // If another worker raced us, rowcount will be 0
    if (updated.changes === 0) {
      return null;
    }
    
    return this.db.prepare(`
      SELECT *
      FROM agent_tasks
      WHERE id = ?
    `).get(task.id);
  }
}