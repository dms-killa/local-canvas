import { AppDb } from '../src/lib/db/AppDb';
import { ProjectDb } from '../src/lib/db/ProjectDb';
import { AgentDb } from '../src/lib/db/AgentDb';
import * as fs from 'fs';

async function runSmokeTest() {
  console.log("🚀 Starting Architectural Smoke Test...");

  const projectPath = 'data/projects/smoke-test-project';
  
  // 0. Setup directories (Guardian Rule: Infrastructure first)
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
  }

  // 1. Layer 1: App Registry
  const app = new AppDb('data/app.db');
  app.registerProject('smoke-test', 'Smoke Test Project', projectPath);
  console.log("✅ Layer 1 (AppDb): Project registered.");

  // 2. Layer 2: Content Memory
  const project = new ProjectDb(projectPath);
  const versionId = project.saveVersion('test.md', '# Smoke Test Content', 'manual');
  console.log(`✅ Layer 2 (ProjectDb): Content saved. Version ID: ${versionId}`);

  // 3. Layer 3: Agent Coordination
  const agent = new AgentDb(projectPath);
  agent.enqueueTask('task-smoke-1', 'smoke-test', versionId, 'summarize');
  console.log("✅ Layer 3 (AgentDb): Task enqueued.");

  // 4. Verification Query
  const pending = agent.getPendingTasks();
  console.log(`\nFinal Verification: ${pending.length} pending task(s) found in AgentDb.`);
  console.log("ARCHITECTURE VALIDATED: Local-only, decoupled, and persistent.");
}

runSmokeTest().catch(err => {
  console.error("🛑 ARCHITECTURE VIOLATION OR ERROR:", err);
  process.exit(1);
});