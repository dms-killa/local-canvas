import path from 'path';
import fs from 'fs';

import { AgentDb } from '../src/lib/db/AgentDb';
import { ProjectDb } from '../src/lib/db/ProjectDb';
import { AgentCoordinator } from '../src/lib/agent/AgentCoordinator';

// ---- config ----
// For now, we process exactly one project.
// This matches Phase C goals.
const PROJECT_ID = process.argv[2] ?? 'smoke-test-project';
const PROJECT_ROOT = path.resolve(
  __dirname,
  '../data/projects',
  PROJECT_ID
);

// ---- sanity checks ----
if (!fs.existsSync(PROJECT_ROOT)) {
  console.error(`❌ Project directory not found: ${PROJECT_ROOT}`);
  process.exit(1);
}

// ---- wiring ----
const agentDb = new AgentDb(PROJECT_ROOT);
const projectDb = new ProjectDb(PROJECT_ROOT);
const coordinator = new AgentCoordinator(agentDb, projectDb);

// ---- run once ----
const didWork = coordinator.processNextTask();

if (didWork) {
  console.log('✔ Processed one agent task');
  process.exit(0);
} else {
  console.log('ℹ No pending agent tasks');
  process.exit(0);
}
