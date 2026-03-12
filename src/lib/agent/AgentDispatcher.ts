// src/lib/agent/AgentDispatcher.ts
import { OllamaAgent } from './OllamaAgent';
import { LintEvaluator, LintReport } from './LintEvaluator';
import { parseEvaluationOutput, isValidEvaluation } from './parser/evaluateParser';
import { 
  buildSummarizePrompt, 
  buildAnalysisPrompt, 
  buildOutlinePrompt, 
  buildRewritePrompt, 
  buildEvaluatePrompt 
} from './prompts';
import { AgentType, ArtifactType } from './AgentTypes';
import { createHash } from 'crypto';

export interface Artifact {
  type: ArtifactType;
  content: string; // Always tagged Markdown
  sha256: string;
}

// Strict mapping of agent type to artifact types
export const AGENT_ARTIFACT_MAP: Record<AgentType, ArtifactType[]> = {
  summarize: ['summary'],
  analyze: ['analysis'],
  outline: ['outline'],
  rewrite: ['rewrite'],
  evaluate: ['evaluation_raw', 'evaluation_parsed'],
  lint: ['lint_report'],
};

export class AgentDispatcher {
  private lintEvaluator: LintEvaluator;

  constructor(private readonly ollamaAgent: OllamaAgent) {
    this.lintEvaluator = new LintEvaluator();
  }

  async dispatch(
    agentType: AgentType,
    source: string,
    timeoutMs: number
  ): Promise<Artifact[]> {
    switch (agentType) {
      case 'evaluate':
        return this.runEvaluation(source, timeoutMs);
      case 'lint':
        return this.runLint(source);
      default:
        return this.runStandardAgent(agentType, source, timeoutMs);
    }
  }

  private async runEvaluation(
    source: string,
    timeoutMs: number
  ): Promise<Artifact[]> {
    const prompt = buildEvaluatePrompt(source);
    const rawMarkdown = await this.ollamaAgent.generate(prompt, timeoutMs, { temperature: 0.1 });
    
    // Parse deterministically
    const parsed = parseEvaluationOutput(rawMarkdown);
    
    if (!isValidEvaluation(parsed)) {
      throw new Error(`Evaluation parser failed: missing SCORE or VERDICT`);
    }
    
    // Convert parsed evaluation to tagged markdown (NOT JSON)
    const parsedMarkdown = this.convertParsedToMarkdown(parsed);

    return [
      {
        type: 'evaluation_raw',
        content: rawMarkdown,
        sha256: this.computeSHA256(rawMarkdown)
      },
      {
        type: 'evaluation_parsed',
        content: parsedMarkdown,
        sha256: this.computeSHA256(parsedMarkdown)
      }
    ];
  }

  private convertParsedToMarkdown(parsed: {
    thoughts: string | null;
    score: number | null;
    verdict: string | null;
  }): string {
    return `### THOUGHTS\n${parsed.thoughts || 'No thoughts provided'}\n\n### SCORE\n${parsed.score || 0}\n\n### VERDICT\n${parsed.verdict || 'fail'}`;
  }

  private runLint(source: string): Artifact[] {
    const report = this.lintEvaluator.evaluate(source);
    const markdown = this.convertLintReportToMarkdown(report);
    
    return [
      {
        type: 'lint_report',
        content: markdown,
        sha256: this.computeSHA256(markdown)
      }
    ];
  }

  private convertLintReportToMarkdown(report: LintReport): string {
    let markdown = `### LINT SCORE\n${report.score}/100\n\n`;
    
    if (report.issues.length > 0) {
      markdown += `### ISSUES\n`;
      report.issues.forEach(issue => {
        markdown += `- ${issue}\n`;
      });
      markdown += `\n`;
    }
    
    if (report.warnings.length > 0) {
      markdown += `### WARNINGS\n`;
      report.warnings.forEach(warning => {
        markdown += `- ${warning}\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `### METRICS\n`;
    markdown += `- Word Count: ${report.metrics.wordCount}\n`;
    markdown += `- Line Count: ${report.metrics.lineCount}\n`;
    markdown += `- Heading Count: ${report.metrics.headingCount}\n`;
    markdown += `- Avg Sentence Length: ${report.metrics.avgSentenceLength.toFixed(1)}\n`;
    
    return markdown;
  }

  private async runStandardAgent(
    agentType: AgentType,
    source: string,
    timeoutMs: number
  ): Promise<Artifact[]> {
    let prompt: string;

    switch (agentType) {
      case 'summarize':
        prompt = buildSummarizePrompt(source);
        break;
      case 'analyze':
        prompt = buildAnalysisPrompt(source);
        break;
      case 'outline':
        prompt = buildOutlinePrompt(source);
        break;
      case 'rewrite':
        prompt = buildRewritePrompt(source);
        break;
      default:
        throw new Error(`Unsupported agent type: ${agentType}`);
    }

    const content = await this.ollamaAgent.generate(prompt, timeoutMs, {
      temperature: 0.2,
    });

    // 🔐 Enforced invariant: agent type → artifact type
    const [artifactType] = AGENT_ARTIFACT_MAP[agentType];

    return [
      {
        type: artifactType,
        content,
        sha256: this.computeSHA256(content),
      }
    ];
  }
    private computeSHA256(content: string): string {
    return createHash('sha256').update(content, 'utf8').digest('hex');
  }
}
