// src/lib/agent/prompts/outline.ts
export function buildOutlinePrompt(source: string): string {
  return `
Create a detailed outline for the following text.

Requirements:
- Break content into logical sections
- Use clear hierarchical structure (1, 2, 3... or A, B, C...)
- Preserve all main points from the original
- Do not add new information
- Do not reference the prompt or instructions

TEXT:
${source}
`.trim();
}