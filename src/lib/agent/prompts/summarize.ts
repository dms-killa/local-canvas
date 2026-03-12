// src/lib/agent/prompts/summarize.ts
export function buildSummarizePrompt(source: string): string {
  return `
Summarize the following text.

Requirements:
- Use concise bullet points
- Preserve factual accuracy
- Do not add interpretation or opinion
- Do not reference the prompt or instructions

TEXT:
${source}
`.trim();
}
