/src/lib/agent/parser/README.md
# Parser Module

**Purpose**: Deterministic extraction of structured data from tagged Markdown.

**Rule**: These parsers must have ZERO dependencies on network services or non-deterministic libraries.

**Interface**:
```typescript
function parseTaggedMarkdown(rawText: string): ParsedResult;
// Returns a structure where any field may be `null` on parse failure.


### ✅ The Result: Self-Enforcing Architecture
By documenting this, you achieve several things:
- **Clarity**: Every contributor understands the "why."
- **Governance**: Code reviews can reject PRs that bypass the parser.
- **Validation**: Your `scripts/validate-architecture.js` can scan for direct JSON generation in agent prompts.
- **Onboarding**: New team members learn the core philosophy immediately.