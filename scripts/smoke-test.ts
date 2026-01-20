import path from 'path';
import fs from 'fs';

import { AppDb } from '../src/lib/db/AppDb';
import { ProjectDb } from '../src/lib/db/ProjectDb';
import { AgentDb } from '../src/lib/db/AgentDb';

const PROJECT_ID = 'smoke-test-project';
const PROJECT_ROOT = path.resolve(__dirname, '../data/projects', PROJECT_ID);

// Ensure project directory exists
fs.mkdirSync(PROJECT_ROOT, { recursive: true });

// --- AppDb ---
const appDb = new AppDb('data/app.db');
appDb.registerProject(PROJECT_ID, 'Smoke Test Project', PROJECT_ROOT);

console.log('✔ Project registered');

// --- ProjectDb ---
const projectDb = new ProjectDb(PROJECT_ROOT);

const versionId = projectDb.saveVersion(
  'notes/test.md',
  'This is a smoke test',
  'manual'
);

console.log('✔ File version saved:', versionId);

// --- AgentDb ---
const agentDb = new AgentDb(PROJECT_ROOT);

// Make task ID unique
const taskId = `task-smoke-${Date.now()}`;
agentDb.enqueueTask(
  taskId,
  PROJECT_ID,
  versionId,
  'summarize'
);

console.log('✔ Agent task enqueued:', taskId);

// --- Done ---
console.log('🎉 Smoke test completed successfully');