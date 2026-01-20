// scripts/debug-simple.ts
import { AgentDb } from '../src/lib/db/AgentDb';
import { ProjectDb } from '../src/lib/db/ProjectDb';
import path from 'path';

console.log("=== Simple Debug ===");

const PROJECT_ROOT = path.resolve(__dirname, '../data/projects/smoke-test-project');

try {
  const agentDb = new AgentDb(PROJECT_ROOT);
  const projectDb = new ProjectDb(PROJECT_ROOT);
  
  // Create version
  const versionId = projectDb.saveVersion('debug.md', 'Debug content', 'manual');
  console.log("Version ID:", versionId);
  
  // Enqueue task
  const taskId = `debug-${Date.now()}`;
  agentDb.enqueueTask(taskId, 'test', versionId, 'summarize');
  console.log("Task enqueued:", taskId);
  
  // Check pending
  const pending = agentDb.getPendingCount();
  console.log("Pending tasks:", pending);
  
} catch (error: any) {
  console.error("ERROR:", error.message);
}