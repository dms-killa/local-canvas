## **Refactored Memory Document with Our Architecture:**

```markdown
# Memory Layer: Source of Truth (v1.0)

## Purpose of This Document
This document defines the **memory layer** for the local-canvas project.  
It exists to:
- Prevent over-engineering
- Serve as the authoritative reference for how memory works
- Make explicit what is *in scope* vs *out of scope*
- Anchor future extensions without rewriting fundamentals  

If behavior is unclear, **this document wins**.

---

## Core Principle
**Memory is project state, not AI cognition.**  
The system does not "remember" things the way a chatbot does.  
It **persists, versions, and structures documents** so intelligence can be layered on later.

---

## Architectural Foundations

### Three-Layer Memory Model
```
┌─────────────────────────────────────┐
│    CONTENT MEMORY (project.db)      │
│    • Versioned AI artifacts         │
│    • Immutable, never lost          │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│    AGENT MEMORY (agent.db)          │
│    • Task coordination              │
│    • Rebuildable if lost            │
└─────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│    RUNTIME MEMORY (in-memory)       │
│    • Current execution state        │
│    • Ephemeral, not persisted       │
└─────────────────────────────────────┘
```

### Database Separation
| Database | Scope | Purpose | Durability |
|----------|-------|---------|------------|
| `app.db` | Global | Project discovery and defaults | Persistent |
| `project.db` | Per-project | Content and AI artifacts | **Permanent** |
| `agent.db` | Per-project | Agent coordination state | **Rebuildable** |

---

## On-Disk Project Layout (Canonical)
```
<project-root>/
  project.json      # Project identity (UUID, name, created_at)
  project.db        # Content memory (schema below)
  agent.db          # Agent coordination memory (optional for MVP)
  draft.md          # Content file
```

### `project.json`
```json
{
  "project_id": "uuid-v4",
  "name": "Project Name",
  "created_at": "2026-01-19T03:00:00Z"
}
```
This file allows a project to be recognized even without databases.

---

## Database Schemas (MVP)

### 1. Global Database: `app.db`

#### `projects_index`
Tracks known projects.
```
projects_index
- project_id TEXT PRIMARY KEY    # Matches project.json UUID
- name TEXT NOT NULL
- last_known_path TEXT NOT NULL  # Updated if project moves
- last_opened_at DATETIME
- created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

**Rule:** No document content in global database.

---

### 2. Content Database: `project.db`

#### `project_meta`
Single-row table describing the project.
```
project_meta
- id TEXT PRIMARY KEY           # UUID, matches project.json
- name TEXT NOT NULL
- created_at DATETIME NOT NULL
- updated_at DATETIME
```

#### `files`
Tracks files belonging to the project.
```
files
- id INTEGER PRIMARY KEY
- path TEXT UNIQUE NOT NULL     # Relative to project root
- created_at DATETIME NOT NULL
- last_modified INTEGER         # For external change detection
```

#### `file_versions`
The core of content memory.
```
file_versions
- id INTEGER PRIMARY KEY
- file_id INTEGER NOT NULL
- version_number INTEGER NOT NULL
- content TEXT NOT NULL
- save_type TEXT CHECK(save_type IN ('manual', 'autosave'))
- created_at DATETIME NOT NULL
- FOREIGN KEY(file_id) REFERENCES files(id)
- UNIQUE(file_id, version_number)
```

#### `version_artifacts`
AI-generated content linked to specific versions.
```
version_artifacts
- id INTEGER PRIMARY KEY
- file_version_id INTEGER NOT NULL
- artifact_type TEXT NOT NULL   # 'summary', 'outline', 'analysis', etc.
- content TEXT NOT NULL
- created_at DATETIME NOT NULL
- FOREIGN KEY(file_version_id) REFERENCES file_versions(id) ON DELETE CASCADE
```

---

### 3. Agent Database: `agent.db`

#### `agent_tasks`
Tracks agent execution state (rebuildable).
```
agent_tasks
- id TEXT PRIMARY KEY           # UUID or unique identifier
- project_id TEXT NOT NULL      # Matches project.json UUID
- file_version_id INTEGER       # Target version (nullable)
- agent_type TEXT NOT NULL      # 'summarize', 'analyze', 'embed'
- priority INTEGER DEFAULT 0    # 0=low, 1=normal, 2=high, 3=user_action
- status TEXT DEFAULT 'pending' # 'pending', 'running', 'completed', 'failed'
- resource_estimate TEXT        # JSON: {"ram_mb": 512, "gpu_seconds": 30}
- created_at DATETIME
- started_at DATETIME
- completed_at DATETIME
- error TEXT
```

**Note:** `agent.db` is **rebuildable**. It can be cleared and reconstructed without data loss.

---

## Save Semantics (MVP)

### Manual Save
1. Write editor buffer to disk (`.md` file)
2. Insert new `file_versions` row
3. Increment `version_number`
4. **Represents intentional checkpoint**

### Autosave
- Out of scope for MVP
- Will be added later as rolling/throttled versions

---

## Relationship to AI (MVP)

### Permitted AI Operations
1. ✅ Read from `file_versions` table
2. ✅ Write to `version_artifacts` table  
3. ✅ Use local/LAN Ollama only (`localhost:11434` or LAN IP)

### Forbidden AI Operations
1. ❌ Write directly to disk files
2. ❌ Modify `file_versions` content
3. ❌ Use external AI services (OpenAI, Anthropic, etc.)
4. ❌ Store state outside defined tables

---

## Agent Coordination Principles

### Resource Awareness
Agents must:
1. Check system resources (CPU, RAM, GPU) before running
2. Respect concurrent execution limits
3. Yield immediately to user interactions
4. Queue tasks when resources limited

### Idempotency
- Same `file_version_id` + `agent_type` → same output
- Agents track completion to prevent duplicate work
- Failed tasks can be retried without side effects

---

## Extension Rules

A feature may extend the memory layer only if:

1. **Builds on existing tables** - No schema-breaking changes
2. **Maintains data integrity** - Never invalidates persisted data
3. **Respects separation** - Agent state stays in `agent.db`, content in `project.db`
4. **Remains local-first** - No external dependencies introduced

If a feature violates these, it belongs in `docs/future-extensions.md`.

---

## Validation Requirements

All implementations must pass:

1. **Offline test** - Works with zero internet connectivity
2. **Portability test** - Project folder can be moved/zipped without breaking
3. **Separation test** - Agent state can be rebuilt without content loss
4. **Resource test** - Never assumes infinite CPU/RAM/GPU

---

## Summary

The memory layer is:
- **Deterministic** - Same input → same stored output
- **Auditable** - All changes versioned and traceable  
- **Boring by design** - No cleverness, just persistence
- **Foundation for intelligence** - AI builds upon, doesn't replace

All higher-level understanding depends on this layer being **correct and stable**.

---

*This document is the source of truth for the memory layer.  
Refer to `docs/agent-architecture.md` for agent-specific details.*
```

