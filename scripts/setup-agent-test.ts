// scripts/setup-agent-test.ts
import { AgentDb } from '../src/lib/db/AgentDb';
import path from 'path';

const PROJECT_ID = 'smoke-test-project';
const PROJECT_ROOT = path.resolve(__dirname, '../data/projects', PROJECT_ID);

const agentDb = new AgentDb(PROJECT_ROOT);

// Enqueue three different tasks for testing
agentDb.enqueueTask('task-1', PROJECT_ID, 1, 'summarize');
agentDb.enqueueTask('task-2', PROJECT_ID, 1, 'analyze');
agentDb.enqueueTask('task-3', PROJECT_ID, 1, 'outline');

console.log('✅ Enqueued 3 test tasks');
console.log('Run: npx ts-node scripts/agent-process-once.ts');