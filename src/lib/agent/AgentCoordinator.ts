// src/lib/agent/AgentCoordinator.ts
import type { AgentTask } from '../db/AgentDb';
import { AgentDb } from '../db/AgentDb';
import { ProjectDb } from '../db/ProjectDb';
import type { NetworkConfig } from '../config/NetworkValidator';
import { OllamaHealthMonitor } from './OllamaHealthMonitor';
import { OllamaAgent, OllamaAgentError } from './OllamaAgent';
import { AgentDispatcher, AGENT_ARTIFACT_MAP } from './AgentDispatcher';
import { AgentType } from './AgentTypes';

/**
 * Semaphore for network concurrency control
 */
class NetworkSemaphore {
  private available: number;
  constructor(count: number) { this.available = count; }
  
  tryAcquire(): boolean {
    if (this.available <= 0) return false;
    this.available -= 1;
    return true;
  }
  
  release(): void { this.available += 1; }
}

export class AgentCoordinator {
  private readonly healthMonitor: OllamaHealthMonitor;
  private readonly ollamaAgent: OllamaAgent;
  private readonly dispatcher: AgentDispatcher;
  private readonly netSem: NetworkSemaphore;
  private readonly nextAttemptAt = new Map<string, number>();

  constructor(
    private agentDb: AgentDb,
    private projectDb: ProjectDb,
    private networkConfig: NetworkConfig
  ) {
    this.healthMonitor = new OllamaHealthMonitor(networkConfig);
    const model = process.env.OLLAMA_MODEL || 'mistral';
    this.ollamaAgent = new OllamaAgent(networkConfig, model);
    this.dispatcher = new AgentDispatcher(this.ollamaAgent);
    this.netSem = new NetworkSemaphore(networkConfig.maxConcurrentRequests);
  }

  /**
   * Main entry point: process next available task
   * Implements binary gate logic:
   * - Non-generative tasks (lint) execute immediately
   * - Generative tasks require health + semaphore gates
   */
  async processNextTask(): Promise<boolean> {
    // 1. Atomic Task Claim (First Gate)
    const task = this.agentDb.claimNextTask();
    if (!task) return false;

    // 2. Binary Gate: Is this a non-generative task?
    if (task.agent_type === 'lint') {
      // Non-generative: execute immediately, no network gates
      return this.executeTask(task, null);
    }

    // 3. Generative Task Path: Ollama or Nothing
    return this.processGenerativeTask(task);
  }

  private async processGenerativeTask(task: AgentTask): Promise<boolean> {
    // 3a. Health Gate
    const health = await this.healthMonitor.checkHealth();
    if (!health.available) {
      this.agentDb.requeueTask(
        task.id, 
        'Ollama host unavailable', 
        'HOST_UNAVAILABLE', 
        JSON.stringify(health)
      );
      return false;
    }

    // 3b. Semaphore Gate
    if (!this.netSem.tryAcquire()) {
      this.agentDb.requeueTask(
        task.id,
        'Network concurrency limit reached',
        'CONCURRENCY_LIMIT',
        null
      );
      return false;
    }

    try {
      return await this.executeTask(task, JSON.stringify(health));
    } finally {
      this.netSem.release();
    }
  }

  /**
   * Execute task and persist artifacts
   */
  private async executeTask(
    task: AgentTask, 
    healthJson: string | null
  ): Promise<boolean> {
    console.log(`🎯 Executing task ${task.id} (${task.agent_type})`);
    try {
      // 1. Validate task has content target
      if (task.file_version_id == null) {
        throw new Error('Task has no file_version_id');
      }

      const version = this.projectDb.getVersionById(task.file_version_id);
      if (!version) {
        throw new Error(`File version ${task.file_version_id} not found`);
      }

      const timeoutMs = (task.timeout_seconds ?? 60) * 1000;

      // 2. Delegate to AgentDispatcher (prompt → LLM → parse)
      const artifacts = await this.dispatcher.dispatch(
        task.agent_type as AgentType,
        version.content,
        timeoutMs
      );

      // 3. Validate artifact mapping
      const expectedArtifactTypes = AGENT_ARTIFACT_MAP[task.agent_type as AgentType];
      if (!expectedArtifactTypes) {
        throw new Error(`No artifact mapping for agent type: ${task.agent_type}`);
      }

      // 4. Persist artifacts to project.db (content memory)
      for (const artifact of artifacts) {
        if (!expectedArtifactTypes.includes(artifact.type)) {
          throw new Error(`Unexpected artifact type ${artifact.type} for agent ${task.agent_type}`);
        }
        
        this.projectDb.addArtifact(
          task.file_version_id,
          artifact.type,
          artifact.content, // Already tagged markdown
          artifact.sha256
        );
      }

      // 5. Update agent memory (rebuildable coordination)
      this.agentDb.markTaskCompleted(task.id);
      this.nextAttemptAt.delete(task.id);
      
      return true;

    } catch (err) {
      const { transient, code, message } = this.classifyError(err);

      if (transient && task.retry_count < this.networkConfig.maxRetries) {
        const waitMs = Math.min(1000 * Math.pow(2, task.retry_count), 60000);
        this.nextAttemptAt.set(task.id, Date.now() + waitMs);
        
        this.agentDb.requeueTask(task.id, message, code, healthJson);
      } else {
        this.agentDb.markTaskFailed(task.id, message, code);
      }
      return false;
    }
  }

  /**
   * Classify errors for network-aware retry logic
   */
  private classifyError(err: unknown): {
    transient: boolean;
    code: string | null;
    message: string;
  } {
    if (err instanceof OllamaAgentError) {
      const transient =
        err.code === 'HOST_UNAVAILABLE' ||
        err.code === 'HTTP_5XX' ||
        err.code === 'HTTP_429';

      return {
        transient,
        code: err.code,
        message: err.message,
      };
    }

    const message = err instanceof Error ? err.message : String(err);
    
    // Parser failures are non-transient (won't improve with retry)
    if (message.includes('parser failed') || message.includes('missing SCORE')) {
      return {
        transient: false,
        code: 'PARSE_FAILURE',
        message,
      };
    }

    return {
      transient: false,
      code: null,
      message,
    };
  }
}