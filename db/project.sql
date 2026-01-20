-- project.db schema (per-project content memory)
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

PRAGMA user_version = 1;

CREATE TABLE IF NOT EXISTS project_meta (
  id TEXT PRIMARY KEY,                  -- UUID, matches project.json
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL UNIQUE,            -- relative to project root
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_modified INTEGER                 -- optional: unix ms for external change detection
);

CREATE TABLE IF NOT EXISTS file_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  save_type TEXT NOT NULL CHECK (save_type IN ('manual', 'autosave')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE,
  UNIQUE(file_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_file_versions_file_id_created_at
ON file_versions(file_id, created_at);

CREATE INDEX IF NOT EXISTS idx_file_versions_file_id_version_number
ON file_versions(file_id, version_number);

CREATE TABLE IF NOT EXISTS version_artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_version_id INTEGER NOT NULL,
  artifact_type TEXT NOT NULL,          -- summary, outline, analysis, etc.
  content TEXT NOT NULL,
  content_sha256 TEXT NOT NULL,         -- hex sha256 of content
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY(file_version_id) REFERENCES file_versions(id) ON DELETE CASCADE,
  UNIQUE(file_version_id, artifact_type, content_sha256)
);

CREATE INDEX IF NOT EXISTS idx_version_artifacts_version_id_created_at
ON version_artifacts(file_version_id, created_at);

CREATE INDEX IF NOT EXISTS idx_version_artifacts_type_created_at
ON version_artifacts(artifact_type, created_at);
