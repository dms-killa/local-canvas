// src/lib/agent/prompts/analyze.ts
export function buildAnalysisPrompt(source: string): string {
  return `
Analyze the following text.

Provide:
- Key themes
- Assumptions being made
- Potential risks or implications

Rules:
- Be analytical, not moralizing
- No speculation beyond the text
- No references to the prompt

TEXT:
${source}
`.trim();
}
