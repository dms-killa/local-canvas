# Local Canvas Development Tracker

## Current Phase (Now)

## Recently Completed ✅

### Phase C: Minimal Agent Coordination (Validated)

- [x] `AgentCoordinator` class implemented and working
- [x] Three dummy agent handlers (summarize, analyze, outline) producing artifacts
- [x] Agent ↔ content integration proven (read versions, write artifacts)
- [x] CLI runner processes tasks end-to-end
- [x] Database state transitions verified (pending → running → completed/failed)
- [x] Error handling works (failed tasks logged)

**Definition of Done Met**: ✅ Agent coordination works end-to-end with deterministic state transitions, independent of AI behavior.

### Key Evidence

- Smoke test: Created version 1, enqueued task, processed successfully
- Setup test: Enqueued 3 tasks, 2 completed, 1 failed (proper error handling)
- Artifacts created: summarize, analyze, outline all produced content
- Database integrity: All tables updated correctly

## Development Commands (Using tsx)

```bash
# Database & Validation
npm run smoke        # Full smoke test
npm run validate     # Verify architecture

# Agent System
npm run agent:setup  # Create test tasks
npm run agent:process # Process one task
npm run agent:diagnose # Full diagnostic

---

## Current Phase (Now)
**Phase D: Task Coordination & Status Monitoring (Network-Aware)**

### Goals
- Ollama host/port to `.env` configuration (see `.env.example`)
- Replace dummy agents with real Ollama integration
- Add network health monitoring for remote Ollama host
- Implement task timeout and retry logic
- Create basic status dashboard in UI
- Add basic logging configuration
- Create config validation (ensures settings respect invariants)

### Completed Sub‑goals ✅
- **Health‑monitor auto‑start**: `OllamaHealthMonitor` now auto‑starts periodic health checks on instantiation. Opt‑out via `OLLAMA_HEALTH_LOOP=false` for debugging.  


### Key Decisions
- Shelving local resource management (Ollama is on separate LAN host)
- Focus on network-aware task coordination instead
- Maintain all architectural invariants
- Keep system working when Ollama host is unavailable

---

## Future Phases (Documented Elsewhere)

- **Agent Intelligence**: Real AI integration (summarize → Ollama)
- **Advanced Coordination**: Retry mechanisms, dependency graphs
- **Enhanced UI**: Memory stats dashboard, interactive monitoring

*Detailed designs in:*

- `docs/future-extensions.md` (feature specifications)
- `docs/agent-architecture.md` (agent roadmap)
- `.env.example` (configuration template)

---

## Recently Completed ✅

### Phase B: First Instantiation (Validated)

- [x] Three database adapters implemented (`AppDb`, `ProjectDb`, `AgentDb`)
- [x] Smoke test proving end-to-end happy path
- [x] Database separation verified (content ≠ coordination)

### Phase A: Memory Schema (Foundational)

- [x] Three-layer memory model documented
- [x] Database schemas defined and created
- [x] Architectural invariants established

---

## Critical Constraints (Non-Negotiable)

- ✅ **Local-only**: No external APIs, no internet access in production
- ✅ **Resource-aware**: Respect RAM/CPU limits, no infinite resource assumptions  
- ✅ **Layer separation**: Content memory ≠ agent coordination
- ✅ **Offline-first**: All operations interruptible, resumable

---

## Quick Reference

### Directory Structure
