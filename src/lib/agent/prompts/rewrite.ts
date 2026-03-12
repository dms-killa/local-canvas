// src/lib/agent/prompts/rewrite.ts
export function buildRewritePrompt(source: string): string {
  return `
Rewrite the following text to improve clarity and structure.

Requirements:
- Preserve original meaning
- Improve flow and readability
- Do not add new facts
- Do not remove important details
- Do not reference the prompt or instructions

TEXT:
${source}
`.trim();
}
