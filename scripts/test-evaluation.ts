// scripts/test-evaluation.ts
import { AgentCoordinator } from '../src/lib/agent/AgentCoordinator';
import { AgentDb } from '../src/lib/db/AgentDb';
import { ProjectDb } from '../src/lib/db/ProjectDb';
import { NetworkConfig } from '../src/lib/config/NetworkConfig';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
console.log('OLLAMA_HOST from env:', process.env.OLLAMA_HOST); 

/**
 * PHASE D VALIDATION SCRIPT
 * This script proves the "Self-Healing" and "Data Separation" invariants.
 * Includes debugging to identify the exact point of failure.
 */
async function runEvaluationTest() {
  console.log("🚀 Starting Phase D: Evaluation Logic Test...");

  // 1. Setup minimal config
  const config = NetworkConfig.load(); // Use the static load method
  console.log('🔧 Loaded network configuration:', config);

  // 2. Ensure directory structure exists - THIS IS THE KEY FIX FOR COLD START
  const projectPath = 'data/projects/smoke-test-project';
  const agentDbPath = path.join(projectPath, 'agent.db');
  const projectDbPath = path.join(projectPath, 'project.db');
  
  // Create directories if they don't exist - this fixes the cold start problem
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
    console.log(`📁 Created directory: ${projectPath}`);
  }

  // 3. Clear any existing agent.db to avoid "ghost task" problem
  if (fs.existsSync(agentDbPath)) {
    console.log('🧹 Clearing existing agent.db to avoid ghost tasks...');
    fs.unlinkSync(agentDbPath);
  }

  // 4. Initialize databases - the constructors will now work properly
  console.log('💾 Initializing databases...');
  const agentDb = new AgentDb(projectPath);
  const projectDb = new ProjectDb(projectPath);
  
  console.log('🔄 Creating coordinator...');
  const coordinator = new AgentCoordinator(agentDb, projectDb, config);

  // 5. Enqueue an evaluation task
  const taskId = `test-eval-${Date.now()}`;
  const versionId = 1; // Assuming version 1 exists from smoke test
  
  console.log(`📝 Enqueueing evaluation task: ${taskId}`);
  agentDb.enqueueTask(taskId, 'smoke-test-project', versionId, 'evaluate', 2);

  // 6. Verify the task was enqueued correctly
  const pendingTasks = agentDb.getTasksByStatus('pending');
  console.log(`📋 Pending tasks after enqueue: ${pendingTasks.length}`);
  if (pendingTasks.length > 0) {
    console.log('📋 First pending task details:', pendingTasks[0]);
  }

  // 7. Process the task with detailed debugging
  console.log("🤖 Coordinator processing task via Ollama...");
  
  // Add timeout to prevent hanging
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout: Ollama processing took too long')), 60000); // 30 second timeout
  });

  try {
    console.log('🔍 About to call coordinator.processNextTask()...');
    const processPromise = coordinator.processNextTask();
    console.log('⏳ Waiting for processNextTask() to complete...');
    
    const success = await Promise.race([processPromise, timeoutPromise]);
    console.log('✅ processNextTask() completed with result:', success);
    
    if (success) {
      console.log("✅ Task processed successfully.");
      
      // 8. Verify Invariants
      const artifacts = projectDb.getArtifactsForVersion(versionId);
      
      // Type assertion to help TypeScript understand the structure
      const raw = artifacts.find((a: any) => a.artifact_type === 'evaluation_raw');
      const parsed = artifacts.find((a: any) => a.artifact_type === 'evaluation_parsed');

    if (raw && parsed) {
      console.log("💎 INVARIANT CHECK: Data Integrity");
      console.log("   - Raw AI output persisted: ✅");
      console.log("   - Parsed output persisted: ✅");
      
      // The parsed artifact is TAGGED MARKDOWN, not JSON
      const parsedContent = parsed.content;
      console.log("Parsed artifact content:");
      console.log(parsedContent);
      
      // Parse the tagged markdown to get the score
      // Example format: "### SCORE\n85\n\n### VERDICT\npass"
      const scoreMatch = parsedContent.match(/### SCORE\s*\n(\d+)/);
      const verdictMatch = parsedContent.match(/### VERDICT\s*\n(\w+)/);
      
      if (scoreMatch) {
        const score = parseInt(scoreMatch[1], 10);
        console.log(`📊 Evaluation Score: ${score}/100`);
        if (verdictMatch) {
          console.log(`📋 Verdict: ${verdictMatch[1]}`);
        }
      }
    } else {
      console.log("❌ Error: Missing artifacts in project.db");
    }
  } catch (error) {
    console.error("❌ Task processing failed:", error);
    console.log("This might be due to Ollama not responding or network issues.");
    
    // Debug: Check what tasks exist after failure
    const allTasks = agentDb.getTasksByStatus('all');
    console.log('📋 All tasks in database after failure:', allTasks);
  }
}

runEvaluationTest().catch(console.error);