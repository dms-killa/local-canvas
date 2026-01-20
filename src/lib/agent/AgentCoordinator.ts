import { AgentDb, AgentTask } from '../db/AgentDb';
import { ProjectDb } from '../db/ProjectDb';

export class AgentCoordinator {
  constructor(
    private agentDb: AgentDb,
    private projectDb: ProjectDb
  ) {}

  /**
   * Processes a single pending task.
   * Returns true if a task was processed, false if no work was available.
   */
  processNextTask(): boolean {
    // 1. Claim a task
    const task = this.agentDb.claimNextTask();
    if (!task) {
      return false;
    }

    try {
      // 2. Validate task has a target version
      if (task.file_version_id == null) {
        throw new Error('Task has no file_version_id');
      }

      // 3. Load the source content
      const version = this.projectDb.getVersionById(task.file_version_id);
      if (!version) {
        throw new Error(`File version ${task.file_version_id} not found`);
      }

      // 4. Dispatch to stub agent
      const artifact = this.runStubAgent(task.agent_type, version.content);

      // 5. Persist artifact
      this.projectDb.addArtifact(
        task.file_version_id,
        artifact.type,
        artifact.content,
        artifact.sha
      );

      // 6. Mark task completed
      this.agentDb.updateTaskStatus(task.id, 'completed');

      return true;
    } catch (err: any) {
      // 7. Failure path
      this.agentDb.updateTaskStatus(
        task.id,
        'failed',
        err?.message ?? 'Unknown error'
      );
      return false;
    }
  }

  /**
   * Stub agent implementations.
   * These validate coordination, not intelligence.
   */
  private runStubAgent(
    agentType: string,
    content: string
  ): { type: string; content: string; sha: string } {
    let output: string;

    switch (agentType) {
      case 'summarize':
        output = `Summary:\n${content.slice(0, 200)}`;
        break;

      case 'analyze':
        output = `Analysis:\nLength: ${content.length} characters`;
        break;

      case 'outline':
        output = `Outline:\nI. Introduction\nII. Main Ideas\nIII. Conclusion`;
        break;

      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }

    return {
      type: agentType,
      content: output,
      sha: this.simpleSha(output)
    };
  }

  /**
   * Minimal deterministic hash.
   * This is NOT cryptographic and does not need to be.
   */
  private simpleSha(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16);
  }
}
