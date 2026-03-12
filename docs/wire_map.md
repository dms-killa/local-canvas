Canonical Wire Map for local‑canvas
Protomap Generation – Wires
User → DB Path

When a user writes or chats in the UI, the application does not directly write to a SQLite database. Instead it hands work off to the agent system:

UI Action (Chat/Write) – components such as ChatUI or the editor call a service (often through an OllamaService wrapper) to request an AI operation like summarise, analyse or outline. These calls end up in the AgentCoordinator and do not touch the databases directly.

Enqueue task – the coordinator inserts a row into the agent_tasks table in agent.db with status pending (this is inferred from the memory-layer documentation which states that agent state is tracked in agent.db and tasks transition from pending → running → completed/failed). The record stores the task type and the associated file version ID.

Claim & execute – the AgentCoordinator claims the next pending task, validates network configuration and calls an appropriate agent via the AgentDispatcher. For content‑aware agents, the agent reads the requested file version from project.db and calls out to the configured Ollama host. The memory‑layer invariants emphasise that all agents must go through AgentCoordinator and that agent outputs go to version_artifacts in project.db.

Persist artifact – once the agent produces an artifact (summary, outline, analysis, etc.), the coordinator writes it into the version_artifacts table of project.db and marks the task completed in agent.db. If there is an error, the task status becomes failed and may be re‑queued.

The diagram below summarises this path (keywords only; no long sentences):

Layer	Entities (keywords)	Flow
UI	ChatUI, editor	user triggers AI action
Coordination	AgentCoordinator, AgentDispatcher	enqueues task, claims next task
Agent layer	OllamaAgent, LintEvaluator	performs AI call, generates artifact
Databases	agent.db: agent_tasks, project.db: version_artifacts	save status and artifact
Task Queue Path (Lifecycle through agent.db)

Tasks follow a well‑defined lifecycle managed by AgentDb and enforced by the coordinator:

pending → running → completed/failed – the design docs explicitly state that the task lifecycle moves from pending to running to completed/failed. Each state is persisted in the agent_tasks table and can be inspected via scripts.

Enqueue – AgentDb.enqueueTask() inserts a row with status pending. Only the coordinator should call this (no direct writes from UI).

Claim & run – AgentCoordinator calls AgentDb.claimNextTask() to mark a task running and returns it for processing. Concurrency and network health checks ensure only a limited number of tasks run at once.

Complete – after an agent finishes successfully, AgentDb.markTaskCompleted() sets the status to completed and stores metrics. A failure sets status failed and may include error metadata; the task may be re‑queued depending on retry policy.

The Air‑Gap Check – Cross‑layer Imports

The memory‑layer documentation imposes a strict separation: agent state lives in agent.db, content lives in project.db, and all agents must be orchestrated through AgentCoordinator. Files that import both AgentDb and ProjectDb can violate this air‑gap. The analysis of the repository shows the following cross‑imports:

File	Reason for flag
scripts/agent-process-once.ts	CLI runner that directly creates AgentDb and ProjectDb instances and processes a task; it bypasses the UI and may circumvent coordination checks.
scripts/debug-simple.ts	Script used for debugging that imports both DB utilities; likely writes directly to both databases.
scripts/diagnose-full.ts	Diagnostic script that accesses AgentDb and ProjectDb; potential bypass.
scripts/smoke-test.ts	Smoke test script reading/writing both DBs.
scripts/test-evaluation.ts	Test script that interacts with both databases and the coordinator.
scripts/test-lint.ts	Lint test script that creates tasks and runs them outside of the UI.
src/lib/agent/AgentCoordinator.ts	It legitimately imports both AgentDb and ProjectDb to mediate between them; this is allowed because the coordinator is the sanctioned gateway.

In production, only AgentCoordinator should touch both databases. The other scripts should remain development/testing tools and must not be run in user‑facing environments or they will violate the air‑gap.

Variable Flow – OLLAMA_HOST from .env to Fetch

Environment declaration – .env.example defines a variable OLLAMA_HOST (example value http://scooter.lan:11434). When the application starts, environment variables are loaded via dotenv.

Network configuration – NetworkConfig.load() constructs a networkConfig object that reads process.env.OLLAMA_HOST. Documentation shows an example where the coordinator executes a task with networkConfig: { host: process.env.OLLAMA_HOST, timeout: 60000, maxRetries: 3 }.

Default & fallback – later in the document a network configuration example defines ollamaHost: process.env.OLLAMA_HOST || 'http://scooter.lan:11434' with health‑check intervals, timeouts and concurrency limits. This ensures that if the variable is not set, a safe LAN address is used.

Fetch call – the OllamaAgent uses the resolved ollamaHost to construct HTTP requests to /generate. The host is passed down by the coordinator along with timeouts and retry parameters. The result is saved to version_artifacts and the task status updated in agent.db.

This flow ensures that network endpoints remain configurable via environment variables and that only LAN endpoints are allowed, as mandated by the network policies (no public cloud services).

Task 2 – Orphan & Poison Detection
Orphan Files (no parent or memory reference)

The following files appear in the manifest but are not referenced by any parent component and are not mentioned in memory_layer.md. They are likely leftover utilities or migration scripts:

scripts/migrate-phase-d.ts – empty migration file; appears unused.

scripts/migrate-storage.ts – script for moving data; no imports in UI or coordinator.

scripts/test-dotenv.ts and scripts/test-dotenv2.ts – test harnesses for environment loading.

scripts/validate-config.ts – validates configuration; not referenced in runtime.

scripts/setup-ai.sh – shell script for setting up Ollama; outside the TypeScript runtime.

While these may be useful during development, they are not wired into the application. They should either be documented as maintenance tools or removed to prevent confusion.

Poison (One‑off) Scripts Bypassing the Coordinator

Several scripts import both AgentDb and ProjectDb and perform operations directly. Running them in a production context would circumvent the agent‑coordination protocol:

scripts/agent-process-once.ts – Processes one task by directly instantiating both databases and a coordinator. Useful for CLI processing but could write to databases without UI checks.

scripts/debug-simple.ts – Simplified runner for debugging that manually calls agents; bypasses queue management.

scripts/diagnose-full.ts – Full diagnostic that reads tasks and versions; may bypass concurrency and health monitoring.

scripts/smoke-test.ts – Simulates end‑to‑end but outside of UI; duplicates logic contained in the coordinator.

scripts/test-evaluation.ts and scripts/test-lint.ts – Test scripts that enqueue and execute tasks; they import both databases and could inadvertently modify production data.

These scripts are labelled as poison because they blur the separation between content and coordination layers. According to the invariants, all agents must go through AgentCoordinator and agent state must remain in agent.db, with outputs in project.db. The presence of these scripts necessitates clear documentation and restrictions to ensure they are only run in development or testing environments.

Conclusion

The local‑canvas system enforces a strict three‑layer architecture: immutable content (project.db), rebuildable agent state (agent.db) and runtime memory. UI actions feed into this pipeline via AgentCoordinator, which manages task lifecycles, enforces concurrency and writes results back to project.db. Cross‑layer contamination is prevented by using the coordinator as the single entry point; however, several scripts import both database utilities and should be quarantined to avoid air‑gap violations. The environment variable OLLAMA_HOST flows from .env through NetworkConfig into the fetch call to the Ollama host. Proper handling of this configuration and removal or isolation of orphan and poison scripts will preserve the system’s local‑first guarantees.
