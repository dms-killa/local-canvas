// src/index.ts
// Main entry point for the application
// Export the AI provider for use throughout the app

import { LocalAIProvider } from './services/ai';

// Create a singleton instance of the AI provider
const aiProvider = new LocalAIProvider();

// Export the AI provider
export { aiProvider };

// Also export the AI provider interface for type safety
export type { AIProvider } from './services/ai';
export type { AIMemoryHook } from './services/ai';
