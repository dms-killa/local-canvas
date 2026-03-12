# Markdown-First Protocol for Agent Output

## Purpose
To ensure reliable, local-only operation by using a data exchange format optimized for probabilistic generators (LLMs) and deterministic parsers.

## Specification

### 1. Agent Output Format
All agents requiring structured output MUST prompt the LLM to use the following pattern:

TAG_NAME

[Content]


**Allowed Tags**: A finite set (e.g., `SCORE`, `VERDICT`, `THOUGHTS`, `SUMMARY`).
**Content**: Plain text or numbers. No nested Markdown.

### 2. Parser Implementation
A parser utility (`/src/lib/agent/parser/`) MUST:
- Extract content via regex or simple grammars.
- Be fault-tolerant (return `null` for missing tags).
- Never throw unrecoverable errors.
- Log the raw input and parse result to `agent.db` for audit.

### 3. Data Flow & Storage
- **Raw Output**: Saved as an immutable artifact in `project.db` (`artifact_type: '[agent]_raw'`).
- **Parsed Data**: Extracted structured data may be saved as a separate artifact (`artifact_type: '[agent]_parsed'`) and used to update `agent.db` task status.

## Example: Evaluation Agent
See `/src/lib/agent/prompts/evaluate.ts` and `/src/lib/agent/parser/evaluateParser.ts` for the reference implementation.