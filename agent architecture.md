### **agent-architecture.md`**

```markdown
# Agent Architecture (v1.0)

## Relationship to Memory
Agents are **consumers of content memory** and **coordinators via agent memory**.

**Input:** Read from `project.db` (content memory)
**Output:** Write to `version_artifacts` (content memory) + `agent.db` (agent memory)
**Coordination:** Use `agent.db` for task tracking

---

## Agent Coordination Store (`agent.db`)

### Purpose
Track agent execution state separately from content. This database is **rebuildable** - can be cleared without data loss.

### Schema (MVP)
```sql
CREATE TABLE agent_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,            -- Matches project.json UUID
  file_version_id INTEGER,             -- Target version (nullable)
  agent_type TEXT NOT NULL,            -- 'summarize', 'analyze', 'embed'
  priority INTEGER DEFAULT 0,          -- 0=low, 1=normal, 2=high, 3=user_action
  status TEXT DEFAULT 'pending',       -- 'pending', 'running', 'completed', 'failed'
  resource_estimate TEXT,              -- JSON: {"ram_mb": 512, "gpu_seconds": 30}
  created_at DATETIME,
  started_at DATETIME,
  completed_at DATETIME,
  error TEXT
);
```

**No foreign keys to `project.db`** - maintains separation.

---

## Agent Coordination Protocol

### 1. Request Resources
```typescript
// All agents must use this pattern
const coordinator = new AgentCoordinator();
const approval = await coordinator.requestResources({
  agentType: 'summarize',
  priority: 3,  // user_action
  estimatedResources: { ram_mb: 512, gpu_seconds: 30 }
});

if (!approval.approved) {
  // Will be queued automatically
  return { queued: true, position: approval.queuePosition };
}
```

### 2. Execute with Coordination
```typescript
// Coordinator manages execution
const task = await coordinator.executeTask({
  agentType: 'summarize',
  fileVersionId: 123,
  execute: async () => {
    // Agent's actual work
    const summary = await generateSummary(versionId);
    return { artifactType: 'summary', content: summary };
  }
});

// Result automatically saved to version_artifacts
// Task status updated in agent.db
```

### 3. Error Handling
- Failed tasks → `status: 'failed'` with error message
- Users can retry failed tasks
- No automatic retries without user configuration

---

## Agent Types

### Content-Aware Agents
- **Summarization Agent** → `artifact_type: 'summary'`
- **Analysis Agent** → `artifact_type: 'analysis'`
- **Outline Agent** → `artifact_type: 'outline'`
- **Embedding Agent** → `artifact_type: 'embedding'` (future)

### Coordination Agents
- **Scheduler Agent** - Manages task execution order
- **Resource Monitor** - Tracks system availability
- **Dependency Resolver** - Ensures proper execution order

---

## Network Access Rules

### Allowed
- Localhost (`127.0.0.1`, `localhost:11434`)
- LAN addresses (`192.168.1.x:11434`) for testing

### Forbidden
- Any public internet endpoints
- Any cloud AI services
- Production builds must disable network

### Security Note
```bash
# Development
npm run dev  # LAN allowed

# Production  
npm run build -- --disable-network  # No network access
```

---

## Resource Management
Agents must respect:
1. **RAM Limit**: No agent >50% available RAM
2. **Concurrency Limit**: Max 2 agents simultaneously
3. **GPU Priority**: User interactions > background tasks
4. **Queueing**: When limits reached, queue tasks

---

## Implementation Sequence

### Phase 1 (MVP)
1. Create `agent.db` with minimal schema
2. Implement `AgentCoordinator` with sync execution
3. Add resource checking (stubbed)
4. Test with simple summarization agent

### Phase 2 (Post-MVP)
1. Add background task execution
2. Implement priority-based scheduling
3. Add dependency tracking
4. Add retry mechanisms

---

*For architectural foundations, see `architectural-invariants.md`.*
```
