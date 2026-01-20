# Architectural Invariants (Non-Negotiable)

## Purpose
These are the immutable rules that define local-canvas. Any code, design, or feature that violates these invariants is **automatically rejected**.

## 1. Three-Layer Memory Model
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

## 2. Database Separation Rules
| Database | Purpose | Durability | Rebuildable |
|----------|---------|------------|-------------|
| `app.db` | Global project registry | Persistent | No |
| `project.db` | Content and AI artifacts | **Permanent** | ❌ Never |
| `agent.db` | Agent coordination state | Persistent | ✅ Yes |

**Rule:** Agent state ≠ content state. They must never mix.

## 3. Network Access Policy
### Allowed (Development & Testing)
- Localhost (`127.0.0.1`, `localhost`)
- LAN addresses (`192.168.x.x`, `10.x.x.x`, `172.16.x.x`)
- Only for Ollama connectivity

### Forbidden (Always)
- Public internet endpoints
- Cloud AI services (OpenAI, Anthropic, Google, etc.)
- External APIs of any kind
- Production builds must disable network access

## 4. Resource Awareness
Agents must:
1. Check available CPU, RAM, GPU before running
2. Never consume >50% of available RAM
3. Respect concurrent execution limits
4. Yield immediately to user interactions
5. Queue tasks when resources limited

## 5. Data Durability Rules
- **Content memory** is permanent and versioned
- **Agent memory** is rebuildable without data loss
- **Runtime memory** is ephemeral and never persisted
- **Projects are portable** (zip folder → works elsewhere)

## 6. Agent Coordination Protocol
1. All agents must go through `AgentCoordinator`
2. No agent may bypass resource checks
3. Agent state is tracked in `agent.db`
4. Agent outputs go to `version_artifacts` in `project.db`

## 7. Extension Constraints
New features must:
1. Build on existing tables and semantics
2. Respect the three-layer separation
3. Maintain offline functionality
4. Never assume infinite resources

## Enforcement
These invariants are checked by:
1. **Code review**: Human verification against invariants
2. **Validation script**: `scripts/validate-architecture.js`
3. **Build flag**: `--disable-network` for production
4. **Documentation**: This document as source of truth

## Violation Protocol
If any code violates these invariants:
1. **Reject** the implementation
2. **Require** redesign that respects invariants
3. **Document** any approved exceptions (rare)

---

*These invariants are the foundation of local-canvas. They prevent cloud thinking and ensure local-first operation.*
```
