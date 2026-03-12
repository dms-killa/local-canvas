// src/lib/agent/prompts/evaluate.ts
export function buildEvaluatePrompt(source: string): string {
  return `
CRITICAL: You must format your entire response using EXACTLY the three section headers below.

EVALUATE THE FOLLOWING TEXT:
${source}

YOUR OUTPUT MUST USE THESE HEADERS:
### THOUGHTS
Explain your reasoning step by step. Focus on clarity, structure, and coherence.

### SCORE
Provide a single integer between 0 and 100. This is your final score.

### VERDICT
Write only a single word: either "pass" or "fail".

RULES:
1. You must use "### THOUGHTS", "### SCORE", and "### VERDICT" exactly as written.
2. Do not add any other headers, titles, or labels.
3. Do not use markdown formatting like bold or italics in your response.
4. Do not write any text before "### THOUGHTS" or after the verdict.
5. A "pass" means the text is fundamentally clear and complete. A "fail" means it is confusing, critically incomplete, or incoherent.
`.trim();
}