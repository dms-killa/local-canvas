#!/usr/bin/env node
/* --------------------------------------------------------------
 * Local‑Canvas – Coordinated Agent Execution Entry Point
 *
 * What this file does:
 *   1️⃣ Loads .env (via dotenv)
 *   2️⃣ Validates all required env vars through NetworkValidator
 *   3️⃣ Instantiates OllamaHealthMonitor (auto‑starts periodic health checks)
 *   4️⃣ Constructs AgentCoordinator with concrete db instances
 *   5️⃣ Starts the core coordination loop (`await coordinator.processNextTask()` in a loop)
 *
 * Usage:
 *    $ npx local-canvas start            # runs until stopped (Ctrl‑C)
 *    $ npx local-canvas run --once       # processes exactly one task then exits
 *    $ OLLAMA_HOST=http://my‑ollama:11434 npm start   # custom host via env var
 *
 * -------------------------------------------------------------- */

import 'dotenv/config';                     // automatically loads .env
import { NetworkValidator } from '../lib/config/NetworkValidator';
import { OllamaHealthMonitor } from '../lib/agent/OllamaHealthMonitor';
import { AgentCoordinator } from '../lib/agent/AgentCoordinator';

// Direct db imports – the relative paths work because we are in src/bin/
import { AgentDb } from '../lib/db/AgentDb';
import { ProjectDb } from '../lib/db/ProjectDb';

const args = process.argv.slice(2);
const onceMode = args.includes('--once');

async function bootstrap(): Promise<void> {
  // 1️⃣ Load & validate configuration
  const config = NetworkValidator.loadAndValidate();

  console.info('🚀 Local‑Canvas started');
  console.info(`   ➤ OLLAMA_HOST    = ${config.host}`);
  console.info(`   ➤ HEALTH INTERVAL= ${config.healthCheckIntervalMs} ms`);
  console.info(`   ➤ MAX CONCURRENCY= ${config.maxConcurrentRequests}\n`);

  // 2️⃣ Create health monitor – it auto‑starts its periodic loop because of the
  //    constructor change we just shipped.
  const healthMonitor = new OllamaHealthMonitor(config);
  console.info('🔍 Health monitoring started (interval: %d ms)…', config.healthCheckIntervalMs);

  // 3️⃣ Build the coordinator with the validated config
  const coordinator = new AgentCoordinator(
    new AgentDb(),
    new ProjectDb(),
    config
  );

  // 4️⃣ Run coordination loop until we either exit or `onceMode` finishes.
  while (true) {
    const finished = await coordinator.processNextTask();
    if (!finished || onceMode) break;
  }

  console.info('🛑 Graceful shutdown – exiting.');
}

bootstrap().catch(err => {
  // Centralised error reporting – helpful for CI / Docker logs
  console.error('\n❌ Fatal start‑up error:');
  console.error(err instanceof Error ? err.message : String(err));
  console.error(err.stack);
  process.exit(1);
});
