// scripts/diagnose-agent.ts
import path from 'path';
import fs from 'fs';
import { AgentDb } from '../src/lib/db/AgentDb';

const PROJECT_ID = process.argv[2] ?? 'smoke-test-project';
const PROJECT_ROOT = path.resolve(__dirname, '../data/projects', PROJECT_ID);

if (!fs.existsSync(PROJECT_ROOT)) {
  console.error(`❌ Project directory not found: ${PROJECT_ROOT}`);
  process.exit(1);
}

const agentDb = new AgentDb(PROJECT_ROOT);

console.log('🔍 Diagnosing agent database...\n');

// Check pending tasks
const pendingTasks = agentDb.getTasksByStatus('pending');
console.log(`Pending tasks: ${pendingTasks.length}`);

if (pendingTasks.length > 0) {
  console.log('\nFirst pending task details:');
  console.log(JSON.stringify(pendingTasks[0], null, 2));
  
  // Check if it has required fields
  const task = pendingTasks[0];
  console.log('\nField validation:');
  console.log(`- Has file_version_id: ${task.file_version_id !== null && task.file_version_id !== undefined}`);
  console.log(`- file_version_id value: ${task.file_version_id}`);
  console.log(`- Agent type: ${task.agent_type}`);
}

// Check all tasks
const allTasks = agentDb.getTasksByStatus('all'); // You might need to implement this
console.log('\n--- All tasks ---');
console.log(allTasks);