// src/lib/agent/AgentTypes.ts
export type AgentType =
  | 'summarize'
  | 'analyze'
  | 'outline'
  | 'rewrite'
  | 'evaluate'
  | 'lint'; // NEW: Non-generative agent

export type ArtifactType =
  | 'summary'
  | 'analysis'
  | 'outline'
  | 'rewrite'
  | 'evaluation_raw'
  | 'evaluation_parsed'
  | 'lint_report'; // NEW: Lint report artifact