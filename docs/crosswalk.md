# Wire Map → Memory Layer Crosswalk (Truth Table)

Purpose:
- A boring, declarative truth table that proves when and where each layer may be touched.
- Used by tooling to avoid false “air-gap” flags.
- This doc does NOT define new behavior. It only encodes what the wire_map and memory invariants already require.

## Canonical Wires

| Logic Wire | Trigger (Source) | Coordination Layer (agent.db) | Content Layer (project.db) | Notes |
|---|---|---|---|---|
| Summarize File | UI action (ChatUI / editor button) | Insert task in `agent_tasks` with `status='pending'` | None | UI never writes to DB directly |
| Analyze File | UI action | Insert task in `agent_tasks` with `status='pending'` | None | Same as summarize |
| Outline File | UI action | Insert task in `agent_tasks` with `status='pending'` | None | Same as summarize |
| Claim Next Task | Worker / coordinator loop | Transition `pending → running` | None | Coordination only |
| Execute Agent | AgentCoordinator dispatch | Update task timing fields and metrics | Read `file_versions` for `file_version_id` | Content read is allowed |
| Persist Artifact | AgentCoordinator post-exec | Transition `running → completed` or `failed` | Write `version_artifacts` (immutable artifact) | Content write is artifacts only |
| Retry Task (Network Fail) | Coordinator retry policy | Increment retry count, queue back to `pending` | None | No content writes |
| Network Health Check | Health monitor | Record health metadata on task or health record | None | LAN-only Ollama host |

## Air-Gap Allowlist (Cross-Layer Bridges)

The following repo-relative files are allowed to touch both:
- Coordination logic (agent.db) AND content logic (project.db)
because they are the explicit bridge required by the architecture.

ALLOWLIST:
- src/lib/agent/AgentCoordinator.ts
- src/lib/agent/AgentDispatcher.ts

Notes:
- If other files touch both layers, that is a violation unless they are added here intentionally.
- Prefer adding bridges only when they are orchestrators. DB adapters themselves should remain layer-specific.

## Doc Authority Order

If conflicts exist:
1) docs/wire_map.md is the canonical behavioral spec.
2) memory_layer.md defines persistence and durability semantics.
3) agent architecture.md defines coordination mechanics.
4) This crosswalk is a derived mapping used for enforcement tooling.

