// src/index.ts
// Main entry point for the application
// Re-export all public surface area here as modules are added.

import { LocalAIProvider } from './services/ai';

// Create a singleton instance of the AI provider
const aiProvider = new LocalAIProvider();

// Export the AI provider and types
export { aiProvider };
export type { AIProvider } from './services/ai';
export type { AIMemoryHook } from './services/ai';
