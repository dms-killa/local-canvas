-- app.db schema (global registry only)
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

PRAGMA user_version = 1;

CREATE TABLE IF NOT EXISTS projects_index (
  project_id TEXT PRIMARY KEY,          -- UUID, matches project.json
  name TEXT NOT NULL,
  last_known_path TEXT NOT NULL,        -- absolute path (project root)
  last_opened_at TEXT,                  -- ISO-8601
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_last_opened_at
ON projects_index(last_opened_at);
