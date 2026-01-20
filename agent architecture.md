# Agent Architecture (v1.1)

## Relationship to Memory

Agents are **consumers of content memory** and **coordinators via agent memory**.

**Input:** Read from `project.db` (content memory)
**Output:** Write to `version_artifacts` (content memory) + `agent.db` (agent memory)
**Coordination:** Use `agent.db` for task tracking

---

## Agent Coordination Store (`agent.db`)

### Purpose

Track agent execution state separately from content. This database is **rebuildable** - can be cleared without data loss.

### Schema (Production)

```sql
CREATE TABLE agent_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,            -- Matches project.json UUID
  file_version_id INTEGER,             -- Target version (nullable)
  agent_type TEXT NOT NULL,            -- 'summarize', 'analyze', 'embed'
  priority INTEGER NOT NULL DEFAULT 0, -- 0=low, 1=normal, 2=high, 3=user_action
  status TEXT NOT NULL DEFAULT 'pending',
  CHECK (status IN ('pending','running','completed','failed')),
  network_health TEXT,                 -- JSON: {"latency_ms": 45, "available": true, "last_check": "ISO_DATE"}
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  started_at TEXT,
  completed_at TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  timeout_seconds INTEGER DEFAULT 60   -- Task timeout (network operations)
);
```

**No foreign keys to `project.db`** - maintains separation.

---

## Agent Coordination Protocol

### 1. Check Network Health

```typescript
// Before processing, check Ollama host availability
const health = await coordinator.checkNetworkHealth({
  host: 'http://scooter.lan:11434',
  timeoutMs: 5000
});

if (!health.available) {
  // Queue task for later execution
  return { queued: true, reason: 'host_unavailable' };
}
```

### 2. Execute with Network Awareness

```typescript
// Coordinator manages execution with network resilience
const task = await coordinator.executeTask({
  agentType: 'summarize',
  fileVersionId: 123,
  networkConfig: {
    host: process.env.OLLAMA_HOST,
    timeout: 60000,
    maxRetries: 3
  },
  execute: async (context) => {
    // Agent's actual work with network error handling
    const summary = await generateSummary(context.versionId);
    return { artifactType: 'summary', content: summary };
  }
});

// Result automatically saved to version_artifacts
// Task status updated in agent.db with network metrics
```

### 3. Error Handling & Retries

- Network failures → `status: 'pending'` (with retry increment)
- Timeouts → `status: 'failed'` with `error: 'timeout'`
- Users can manually retry failed tasks
- Exponential backoff for network retries (1s, 2s, 4s, 8s)

---

## Agent Types

### Content-Aware Agents

- **Summarization Agent** → `artifact_type: 'summary'`
- **Analysis Agent** → `artifact_type: 'analysis'`
- **Outline Agent** → `artifact_type: 'outline'`
- **Embedding Agent** → `artifact_type: 'embedding'` (future)

### Network Coordination Agents

- **Health Monitor Agent** - Tracks Ollama host availability
- **Queue Manager Agent** - Manages task prioritization during outages
- **Latency Optimizer** - Routes tasks based on network performance
- **Connection Pool Manager** - Manages concurrent network requests

---

## Network Access Rules

### Allowed

- Localhost (`127.0.0.1`, `localhost:11434`)
- LAN addresses (`192.168.x.x:11434`)
- Must respect network segmentation policies

### Forbidden

- Public internet endpoints (unless explicitly tunneled)
- Cloud AI services (OpenAI, Anthropic, Google, etc.)
- External APIs without explicit whitelist
- Production builds must disable external network

### Security Enforcement

```bash
# Development (allows LAN)
npm run dev

# Production (LAN-only, no external)
npm run build -- --lan-only

# Testing (mock network for unit tests)
npm run test:network-mock
```

---

## Network-Aware Task Management

### Health Monitoring

1. **Host Availability**: Periodic pings to Ollama endpoint
2. **Latency Tracking**: Measure response times, adjust timeouts
3. **Queue Management**: Buffer tasks during network outages
4. **Graceful Degradation**: Fallback modes when AI unavailable

### Concurrency Control

- **Network Concurrency**: Max 2 simultaneous Ollama requests
- **Request Timeouts**: Default 60s, configurable per task type
- **Connection Pooling**: Reuse connections, avoid thundering herd
- **Backpressure**: Queue tasks when network saturated

### Priority Handling

1. **User Actions** (priority 3) → Immediate, bypass queue if healthy
2. **Background Processing** (priority 0-1) → Queue during degradation
3. **Automatic Retries** → Exponential backoff, capped attempts

---

## Implementation Status

### Phase C (Completed): Minimal Coordination

- ✅ `agent.db` schema created with constraints
- ✅ `AgentCoordinator` implemented (synchronous)
- ✅ Dummy agents: summarize, analyze, outline
- ✅ Task lifecycle: pending → running → completed/failed
- ✅ Database separation validated

### Phase D (Current): Network-Aware Coordination

- ⏳ **Network Health Monitoring**: Ollama host availability checks
- ⏳ **Task Resilience**: Timeouts, retries, exponential backoff
- ⏳ **Queue Management**: Network-aware task scheduling
- ⏳ **Real AI Integration**: Replace dummy agents with Ollama calls
- ⏳ **Status Dashboard**: UI for monitoring network/task health

### Phase E (Future): Advanced Features

- ⏳ **Multi-Host Support**: Load balancing across multiple Ollama instances
- ⏳ **Adaptive Routing**: Choose fastest available host
- ⏳ **Predictive Queueing**: Estimate wait times based on host load
- ⏳ **Offline Mode**: Cache prompts, batch when network returns

### Phase F (Optional): Local Resource Management

- ⏳ **Local Ollama Integration**: If running Ollama on same host
- ⏳ **Resource Monitoring**: CPU/RAM/GPU usage tracking
- ⏳ **Local Priority Management**: Process scheduling based on local load

---

## Implementation Sequence

### Phase C (Minimal Coordination) ✅

1. Create `agent.db` with schema (done)
2. Implement `AgentCoordinator` with synchronous execution (done)
3. Add dummy agent handlers for validation (done)
4. Prove task lifecycle works end-to-end (done)

### Phase D (Network-Aware Coordination) 🚧

1. **Add Network Health Monitoring**
   - Create `OllamaHealthMonitor` class
   - Periodic health checks (every 30s)
   - Track latency, availability metrics
   - UI status indicators

2. **Enhance AgentCoordinator for Network Resilience**
   - Add timeout handling (configurable per task)
   - Implement exponential backoff for retries
   - Queue tasks when Ollama host unavailable
   - Track network metrics in `agent_tasks`

3. **Integrate Real Ollama Agents**
   - Replace dummy summarization with actual Ollama calls
   - Implement analysis agent with real AI
   - Add outline generation using Ollama
   - Error handling for API failures

4. **Create Network Status Dashboard**
   - Real-time connection status
   - Task queue visualization
   - Error rate and latency graphs
   - Manual retry controls

### Phase E (Advanced Features) 📋

1. Multi-Ollama host support
2. Adaptive routing based on latency
3. Predictive queue wait times
4. Advanced failure recovery

### Phase F (Local Optimization) 📋

1. Local Ollama integration (optional)
2. Local resource monitoring
3. Hybrid local/remote routing

---

## Network Configuration

```typescript
// Example configuration
const networkConfig = {
  ollamaHost: process.env.OLLAMA_HOST || 'http://scooter.lan:11434',
  healthCheckInterval: 30000, // 30 seconds
  requestTimeout: 60000,      // 60 seconds
  maxConcurrentRequests: 2,
  retryPolicy: {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000
  },
  queuePolicy: {
    maxQueueSize: 100,
    priorityLevels: 4
  }
};
```

---

*For architectural foundations, see `architectural-invariants.md`.*

## 🔄 **Key Changes Made**

### **1. Version Bump to v1.1**

- Reflects significant shift in focus
- Acknowledges architectural evolution

### **2. Updated Schema**

- Added `network_health` field (replaces `resource_estimate`)
- Added `retry_count` for tracking attempts
- Added `timeout_seconds` for network operations

### **3. Refocused Protocol**

- **Network health checks** instead of local resource checks
- **Network-aware execution** with timeout/retry logic
- **Queue management** based on host availability

### **4. New Agent Categories**

- **Network Coordination Agents** (health monitor, queue manager, etc.)
- Focus on distributed system concerns vs local resource concerns

### **5. Updated Implementation Status**

- **Phase D now focuses on network-aware coordination**
- **Phase E** = Advanced network features
- **Phase F** = Local resource management (optional, moved to end)

### **6. Added Network Configuration Section**

- Clear configuration structure
- Timeouts, retries, queue policies
- Environment variable usage

### **7. Realistic Security Rules**

- `--lan-only` flag for production
- Network segmentation respected
- Mock network for testing

## 🎯 **Why This Refactor Works**

1. **Acknowledges reality** - Ollama is on separate LAN host
2. **Maintains architectural integrity** - All invariants preserved
3. **Provides clear path forward** - Phase D deliverables are specific
4. **Scales appropriately** - From single host to multi-host possible
5. **Remains flexible** - Can add local resource management later if needed

This document now accurately reflects your **actual architecture** and provides a **practical roadmap** for Phase D implementation.
