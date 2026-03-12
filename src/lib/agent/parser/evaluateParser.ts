// src/lib/agent/parser/evaluateParser.ts
export interface ParsedEvaluation {
  thoughts: string | null;
  score: number | null; // Allows null for parse failure
  verdict: string | null; // 'pass', 'fail', or null
  rawOutput: string; // For debugging and artifact storage
}

export function parseEvaluationOutput(rawOutput: string): ParsedEvaluation {
  const result: ParsedEvaluation = {
    thoughts: null,
    score: null,
    verdict: null,
    rawOutput: rawOutput
  };

  // 1. Extract THOUGHTS - capture everything until next ### or end
  const thoughtsMatch = rawOutput.match(/### THOUGHTS\s*\n([\s\S]*?)(?=\s*### SCORE|$)/i);
  if (thoughtsMatch) {
    result.thoughts = thoughtsMatch[1].trim();
  }

  // 2. Extract SCORE - very strict: digits after header
  const scoreMatch = rawOutput.match(/### SCORE\s*\n(\d{1,3})/i);
  if (scoreMatch) {
    const score = parseInt(scoreMatch[1], 10);
    result.score = score >= 0 && score <= 100 ? score : null; // Validate range
  }

  // 3. Extract VERDICT - only 'pass' or 'fail', case-insensitive
  const verdictMatch = rawOutput.match(/### VERDICT\s*\n(pass|fail)/i);
  if (verdictMatch) {
    result.verdict = verdictMatch[1].toLowerCase();
  }

  return result;
}

// Optional: A strict validator for the coordinator to use
export function isValidEvaluation(parsed: ParsedEvaluation): boolean {
  return (
    parsed.thoughts !== null &&
    parsed.score !== null &&
    (parsed.verdict === 'pass' || parsed.verdict === 'fail')
  );
}