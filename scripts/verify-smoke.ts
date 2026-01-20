import { AppDb } from '../src/lib/db/AppDb';
import { ProjectDb } from '../src/lib/db/ProjectDb';
import { AgentDb } from '../src/lib/db/AgentDb';

console.log('Starting verification...');

try {
  const appDb = new AppDb('data/app.db');
  console.log('✓ AppDb connected');
  
  const projectDb = new ProjectDb('data/projects/smoke-test-project');
  console.log('✓ ProjectDb connected');
  
  const agentDb = new AgentDb('data/projects/smoke-test-project');
  console.log('✓ AgentDb connected');
  
  console.log('All databases working correctly!');
} catch (error) {
  console.error('Error:', error);
}