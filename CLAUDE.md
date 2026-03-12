# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start the development server (Vite)
- `npm run build` - Build the production version
- `npm run preview` - Preview the production build

### Agent Development
- `npm run agent:process` - Run a single agent process
- `npm run agent:setup` - Set up agent test environment
- `npm run agent:diagnose` - Diagnose agent system health
- `npm run validate` - Run smoke test validation
- `npm run db:init` - Initialize databases
- `npm run migrate:phase-d` - Run phase D migration
- `npm run db:health` - Check database health
- `npm run health:check` - Check system health
- `npm run config:validate` - Validate configuration

### Testing
- `npm run test:evaluation` - Run evaluation tests
- `npm run test:dotenv` - Test dotenv configuration
- `npm run test:health` - Test health checks
- `npm run smoke` - Run smoke test

## Code Architecture

### High-Level Overview
This is an offline AI writing assistant with a modular agent-based architecture. The system uses a Lexical editor for rich text editing and integrates with local LLMs (Ollama) for AI capabilities.

### Core Components

#### 1. Agent Architecture
The system follows a task-based agent model with the following components:
- **AgentCoordinator**: Main entry point that manages task execution with binary gates (health and concurrency)
- **AgentDispatcher**: Routes tasks to appropriate agents based on type
- **OllamaAgent**: Handles communication with the Ollama LLM service
- **OllamaHealthMonitor**: Monitors Ollama service health with periodic checks

#### 2. Data Storage
The system uses SQLite databases for persistent storage:
- `agent.db`: Stores agent tasks with status tracking, retry logic, and health information
- `project.db`: Stores file versions, content, and artifacts (summaries, analyses, etc.)

#### 3. Task Processing Flow
1. AgentCoordinator claims the next pending task from agent.db
2. For non-generative tasks (like linting), executes immediately
3. For generative tasks, checks Ollama health and network concurrency
4. If both gates pass, delegates to AgentDispatcher
5. AgentDispatcher routes to the appropriate agent (summarize, analyze, etc.)
6. Results are parsed and stored as artifacts in project.db
7. Task status is updated in agent.db

#### 4. Key Design Patterns
- **Binary Gate Logic**: Generative tasks require both health and concurrency checks
- **Exponential Backoff**: Failed tasks are requeued with increasing wait times
- **Idempotent Schema**: Database schema ensures data integrity
- **Artifact Mapping**: Strict mapping between agent types and artifact types
- **Network Concurrency Control**: Semaphore limits concurrent requests to prevent overload

### Configuration
The system uses environment variables for configuration:
- `OLLAMA_HOST`: Ollama service endpoint (default: http://localhost:11434)
- `OLLAMA_TIMEOUT_MS`: Request timeout in milliseconds (default: 60000)
- `OLLAMA_MAX_RETRIES`: Maximum retry attempts (default: 3)
- `OLLAMA_HEALTH_CHECK_INTERVAL_MS`: Health check interval (default: 30000)
- `MAX_CONCURRENT_REQUESTS`: Maximum simultaneous Ollama requests (default: 2)

### Development Guidelines
- Use `npm run dev` to start the development server
- Run `npm run health:check` to verify system health
- Use `npm run agent:diagnose` to check agent system status
- When adding new agent types, ensure they follow the established pattern
- Always test new features with `npm run smoke` before committing
- Use `npm run test:evaluation` to validate evaluation functionality

### Important Notes
- The system is designed for offline use with local LLMs
- The `.env.example` file contains all required environment variables
- The system uses a strict artifact mapping to ensure consistency
- The architecture prioritizes reliability with health checks and retry logic
- The Lexical editor provides rich text editing capabilities with real-time collaboration features

This architecture enables a robust, reliable AI writing assistant with proper error handling, retry logic, and monitoring capabilities.