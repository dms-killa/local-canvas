-- agent.db schema (per-project coordination memory, rebuildable)
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

PRAGMA user_version = 2;

CREATE TABLE IF NOT EXISTS agent_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  file_version_id INTEGER,
  agent_type TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed')),

  -- Deprecated in Phase D (do not write new data)
  resource_estimate TEXT,

  -- Phase D network observability
  health_check_id INTEGER,

  created_at TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  started_at TEXT,
  completed_at TEXT,
  error TEXT
);

CREATE TABLE IF NOT EXISTS network_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host TEXT NOT NULL,
  available INTEGER NOT NULL CHECK (available IN (0, 1)),
  latency_ms INTEGER,
  last_check TEXT NOT NULL,
  last_success TEXT,
  error TEXT,
  created_at TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_status_priority_created
  ON agent_tasks(status, priority, created_at);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_project_status_created
  ON agent_tasks(project_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_file_version
  ON agent_tasks(file_version_id);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at
  ON agent_tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_network_health_host_created
  ON network_health(host, created_at);
