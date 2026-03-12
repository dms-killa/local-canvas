// scripts/db-health.ts - COMPLETE VERSION
import path from 'path';
import fs from 'fs';
import { AgentDb } from '../src/lib/db/AgentDb';

const PROJECT_ID = process.argv[2] ?? 'smoke-test-project';
const PROJECT_ROOT = path.resolve(__dirname, '../data/projects', PROJECT_ID);

if (!fs.existsSync(PROJECT_ROOT)) {
  console.error(`❌ Project directory not found: ${PROJECT_ROOT}`);
  process.exit(1);
}

console.log(`🔍 Inspecting network health in ${PROJECT_ID}\n`);

const agentDb = new AgentDb(PROJECT_ROOT);

// Get all tasks
const allTasks = agentDb.getTasksByStatus('all');
console.log(`Total tasks: ${allTasks.length}`);

const tasksWithHealth = allTasks.filter(t => t.network_health);
console.log(`Tasks with health data: ${tasksWithHealth.length}`);

// Show example of health data from tasks
if (tasksWithHealth.length > 0) {
  console.log('\n📊 Network health from recent tasks:');
  tasksWithHealth.slice(0, 5).forEach((task, i) => {
    const time = new Date(task.created_at).toLocaleTimeString();
    try {
      const health = task.network_health ? JSON.parse(task.network_health) : {};
      console.log(
        `${i + 1}. ${time} - ${task.agent_type} - ` +
        `${health.available ? '✅' : '❌'} ` +
        `${health.latency_ms ? `${health.latency_ms}ms` : 'N/A'} ` +
        `${health.error ? `(${health.error.substring(0, 30)}...)` : ''}`
      );
    } catch (e) {
      console.log(`${i + 1}. ${time} - ${task.agent_type} - (invalid health data)`);
    }
  });
}

// Show one example task with health
if (tasksWithHealth.length > 0) {
  const exampleTask = tasksWithHealth[0];
  
  console.log(`\n📝 Example task health linkage:`);
  console.log(`  Task ID: ${exampleTask.id}`);
  console.log(`  Status: ${exampleTask.status}`);
  console.log(`  Agent type: ${exampleTask.agent_type}`);
  
  if (exampleTask.network_health) {
    try {
      const health = JSON.parse(exampleTask.network_health);
      console.log(`  Health available: ${health.available ? 'Yes' : 'No'}`);
      console.log(`  Latency: ${health.latency_ms || 'N/A'}ms`);
      console.log(`  Error: ${health.error || 'None'}`);
    } catch (e) {
      console.log(`  Health data (raw): ${exampleTask.network_health.substring(0, 100)}...`);
    }
  }
}

console.log('\n✅ Health database inspection complete');