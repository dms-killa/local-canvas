// scripts/agent-process-once.ts
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { AgentDb } from '../src/lib/db/AgentDb';
import { ProjectDb } from '../src/lib/db/ProjectDb';
import { AgentCoordinator } from '../src/lib/agent/AgentCoordinator';
import { NetworkValidator } from '../src/lib/config/NetworkValidator';
import dotenv from 'dotenv';

dotenv.config();

// Fix for __dirname in ESM if needed, otherwise keep your current path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  // ---- config ----
  const PROJECT_ID = process.argv[2] ?? 'smoke-test-project';
  const PROJECT_ROOT = path.resolve(__dirname, '../data/projects', PROJECT_ID);

  // ---- sanity checks ----
  if (!fs.existsSync(PROJECT_ROOT)) {
    console.error(`❌ Project directory not found: ${PROJECT_ROOT}`);
    process.exit(1);
  }

  try {
    // ---- Validate at the boundary ----
    console.log('🔍 Validating network configuration...');
    const networkConfig = NetworkValidator.loadAndValidate();
    console.log('✅ Configuration validated:', networkConfig.host);

    // ---- wiring with validated config ----
    // AgentDb ensureSchema() is called in constructor (idempotent migration)
    const agentDb = new AgentDb(PROJECT_ROOT);
    const projectDb = new ProjectDb(PROJECT_ROOT);
    const coordinator = new AgentCoordinator(agentDb, projectDb, networkConfig);

    // ---- run once (Phase D: Now Asynchronous) ----
    console.log('🤖 Coordinator checking for tasks...');
    
    // We MUST use 'await' here because network calls are involved
    const didWork = await coordinator.processNextTask();

    if (didWork) {
      console.log('✔ Processed one agent task');
    } else {
      console.log('ℹ No pending agent tasks or network unavailable');
    }
    
    process.exit(0);

  } catch (err) {
    console.error('❌ agent-process-once failed with error:');
    console.error(err);
    process.exit(1);
  }
}

// Execute the async function
run();