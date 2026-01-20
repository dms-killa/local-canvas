-- agent.db schema (per-project coordination memory, rebuildable)
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

PRAGMA user_version = 1;

CREATE TABLE IF NOT EXISTS agent_tasks (
  id TEXT PRIMARY KEY,                  -- UUID
  project_id TEXT NOT NULL,             -- matches project.json UUID
  file_version_id INTEGER,              -- informational only, no FK (nullable)
  agent_type TEXT NOT NULL,             -- summarize, analyze, outline, embed
  priority INTEGER NOT NULL DEFAULT 0,  -- 0 low, 1 normal, 2 high, 3 user_action
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed')),
  resource_estimate TEXT,               -- JSON string
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  started_at TEXT,
  completed_at TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_status_priority_created
ON agent_tasks(status, priority, created_at);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_project_status_created
ON agent_tasks(project_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_file_version
ON agent_tasks(file_version_id);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at
ON agent_tasks(created_at);
