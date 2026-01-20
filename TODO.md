# Local Canvas Development Tracker

## Current Phase (Now)

Phase C: Minimal Agent Coordination

### Immediate Tasks

- [ ] Implement `AgentCoordinator` class (~40-50 lines)
- [ ] Create three dummy agent handlers (summarize/analyze/outline with static output)
- [ ] Write agent ↔ content integration test
- [ ] Build simple CLI runner (`npm run agent:process`)
- [ ] Validate: Task lifecycle (pending → running → completed)

**Definition of Done**: Agent coordination works end-to-end with deterministic state transitions, independent of AI behavior.

---

## Next Phase (Upcoming)

Phase D: Configuration & Resource Management

### Priority Tasks

- [ ] Move Ollama host/port to `.env` configuration (see `.env.example`)
- [ ] Implement resource limits from environment (RAM %, concurrency)
- [ ] Add basic logging configuration
- [ ] Create config validation (ensures settings respect invariants)

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
