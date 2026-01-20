// src/services/ai.ts
// AI Service Layer implementation for local AI integration

import { AICompletionRequest } from '../types';

// Define the interface for AI providers
export interface AIProvider {
  generate(content: string): Promise<string>;
  streamCompletion(
    req: AICompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<void>;
}

// Implementation of the AI provider using Ollama
export class LocalAIProvider implements AIProvider {
  private baseURL: string;
  private model: string;
  private memory?: AIMemoryHook;

  constructor(
    baseURL: string = 'http://localhost:11434',
    model: string = 'mistral'
  ) {
    this.baseURL = baseURL;
    this.model = model;
  }

  registerMemory(memory: AIMemoryHook) {
    this.memory = memory;
  }

  async generate(content: string): Promise<string> {
    try {
      // Use the streamCompletion method but collect all chunks
      let fullResponse = '';
      await this.streamCompletion(
        { prompt: content },
        (chunk) => {
          fullResponse += chunk;
        }
      );
      return fullResponse;
    } catch (error) {
      console.error('Error generating AI content:', error);
      throw new Error('Failed to connect to local AI service. Make sure Ollama is running with "ollama serve"');
    }
  }

  async streamCompletion(
    req: AICompletionRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    let finalPrompt = req.prompt;

    // Retrieve context from memory if available
    if (this.memory) {
      const relevantPast = await this.memory.retrieveContext(req.prompt);
      if (relevantPast.length > 0) {
        finalPrompt = `Context from previous writings:\n${relevantPast.join('\n')}\n\nCurrent Task:\n${req.prompt}`;
      }
    }

    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: finalPrompt,
        system: req.systemPrompt || "You are a helpful writing assistant.",
        stream: true,
        options: { temperature: 0.7 }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          if (data.response) {
            fullResponse += data.response;
            onChunk(data.response);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    // Save interaction to memory
    if (this.memory && fullResponse) {
      await this.memory.saveInteraction(req.prompt, fullResponse);
    }
  }
}

// Interface for memory hook
export interface AIMemoryHook {
  retrieveContext(query: string): Promise<string[]>;
  saveInteraction(prompt: string, response: string): Promise<void>;
}

// ---- Simple action-based helper for editor toolbar ----

export type EditorAIAction = 'continue' | 'expand' | 'refactor';

export async function runEditorAI(
  provider: AIProvider,
  action: EditorAIAction,
  input: string
): Promise<string> {
  let prompt: string;

  switch (action) {
    case 'continue':
      prompt = `Continue the following text naturally:\n\n${input}`;
      break;

    case 'expand':
      prompt = `Expand the following text with more detail and depth:\n\n${input}`;
      break;

    case 'refactor':
      prompt = `Refactor the following text for clarity and flow:\n\n${input}`;
      break;

    default:
      prompt = input;
  }

  return provider.generate(prompt);
}

