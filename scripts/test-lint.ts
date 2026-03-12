// scripts/test-lint.ts
import { AgentCoordinator } from '../src/lib/agent/AgentCoordinator';
import { AgentDb } from '../src/lib/db/AgentDb';
import { ProjectDb } from '../src/lib/db/ProjectDb';

async function testLint() {
  console.log('🚀 Testing Local-Only Lint Agent...');

  // Fix 1: Use proper project directory path instead of database file path
  const projectDir = 'data/projects/smoke-test-project';
  const projectDb = new ProjectDb(projectDir);
  const agentDb = new AgentDb(projectDir);

  const coordinator = new AgentCoordinator(agentDb, projectDb, {
    host: 'http://this-host-does-not-exist.lan',
    timeoutMs: 1000,
    maxConcurrentRequests: 1,
    maxRetries: 3,
    healthCheckIntervalMs: 30_000,
  });

  // Fix 2: Use saveVersion method instead of addFile/addFileVersion
  const versionId = projectDb.saveVersion(
    'test.md',
    'This is a test file.\nIt is very short.',
    'manual'
  );

  // Fix 3: Use proper enqueueTask signature
  agentDb.enqueueTask(
    'lint-task-1', // task ID
    'smoke-test',  // project ID
    versionId,     // file version ID
    'lint',        // agent type
    1              // priority
  );

  // 3. Process task
  const success = await coordinator.processNextTask();
  if (!success) {
    throw new Error('Lint task failed unexpectedly');
  }

  // 4. Verify artifact
  const artifacts = projectDb.getArtifactsForVersion(versionId);

  if (!Array.isArray(artifacts) || artifacts.length === 0) {
    throw new Error('No artifacts produced');
  }

  const lintArtifact = artifacts.find(
    (a): a is { artifact_type: string; content: string } =>
      typeof a === 'object' &&
      a !== null &&
      'artifact_type' in a &&
      a.artifact_type === 'lint_report'
  );

  if (!lintArtifact) {
    throw new Error('Lint report not found');
  }

  console.log('✅ Lint Task Success!');
  console.log('📋 Artifact Type:', lintArtifact.artifact_type);
  console.log('📄 Content:\n', lintArtifact.content);
}

testLint().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});