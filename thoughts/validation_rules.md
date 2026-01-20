# Validation Rulebook

## Core Principles
- All logic, data, and models must run locally.
- No external APIs, web calls, or cloud dependencies.
- Each phase must be validated via a formal check before proceeding.
- All features are subject to a strict "feature freeze" after Phase 1.
- No hallucinated or unverified outcomes are allowed.

## Technical Constraints
- No internet access
- All models must run locally
- No external APIs (including Hugging Face, OpenAI, etc.)
- Data must not leave the device

## Validation Rules
1. No external HTTP calls
2. No model loading from remote
3. No data sent outside device
4. No hallucinated content (e.g., fake file paths, fake model names)

## Enforcement Methods
- `computercontroller__shell` to verify no external access is possible in the environment
- `developer__shell` to check for HTTP calls in code
- `computercontroller__cache` to list loaded models and confirm only local ones
- Code reviews to catch any hallucinated content

## Consequences of Violation
- Immediate pause of development
- Implementation of necessary fixes
- Re-verification of all affected components
- Documentation of the violation and corrective actions
