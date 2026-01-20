import path from 'path';
import fs from 'fs';
import { AgentDb } from '../src/lib/db/AgentDb';
import { ProjectDb } from '../src/lib/db/ProjectDb';

console.log("=== FULL DIAGNOSTIC ===\n");

const PROJECT_ROOT = path.resolve(__dirname, '../data/projects/smoke-test-project');

// 1. Check directory exists
console.log("1. Directory exists:", fs.existsSync(PROJECT_ROOT));

// 2. Check database files
const agentDbPath = path.join(PROJECT_ROOT, 'agent.db');
const projectDbPath = path.join(PROJECT_ROOT, 'project.db');
console.log("2. Agent DB exists:", fs.existsSync(agentDbPath));
console.log("   Project DB exists:", fs.existsSync(projectDbPath));

// 3. Try to instantiate
try {
  const agentDb = new AgentDb(PROJECT_ROOT);
  console.log("3. AgentDb instantiated ✓");
  
  const projectDb = new ProjectDb(PROJECT_ROOT);
  console.log("   ProjectDb instantiated ✓\n");
  
  // 4. Check pending tasks
  const pendingCount = agentDb.getPendingCount();
  console.log(`4. Pending tasks: ${pendingCount}`);
  
  // 5. Create a test task if none exist
  if (pendingCount === 0) {
    console.log("5. No tasks found. Creating test task...");
    
    // First, create a file version
    const versionId = projectDb.saveVersion('diagnostic.md', 'Diagnostic content', 'manual');
    console.log(`   Created version: ${versionId}`);
    
    // Then enqueue a task
    agentDb.enqueueTask('diag-task-1', 'smoke-test-project', versionId, 'summarize', 0);
    console.log("   Enqueued task: diag-task-1");
    
    // Verify
    const newPending = agentDb.getPendingCount();
    console.log(`   New pending count: ${newPending}`);
  }
  
  // 6. Show all pending tasks
  const pendingTasks = agentDb.getPendingTasks();
  console.log(`6. Pending tasks details:`, JSON.stringify(pendingTasks, null, 2));
  
} catch (error: any) {
  console.error("ERROR:", error.message);
  console.error(error.stack);
}

console.log("\n=== DIAGNOSTIC COMPLETE ===");