// src/stores/memory/index.ts
// Memory & RAG System implementation for local AI writing tool
import { AIMemoryHook, StorageInterface } from '../../services/ai';

// Interface for memory storage
export interface MemoryStorage {
  retrieveContext(query: string): Promise<string[]>;
  saveInteraction(prompt: string, response: string): Promise<void>;
  getStats(): { total: number; oldest?: number; newest?: number };
}

// In-memory implementation of the memory system
export class InMemoryStorage implements MemoryStorage {
  private persistentStorage?: StorageInterface;
  private interactions: Array<{ prompt: string; response: string; timestamp: number }> = [];
  private maxEntries = 100;

  async migrateToPersistentStorage(persistentStorage: StorageInterface): Promise<void> {
    // Set the persistent storage reference
    this.persistentStorage = persistentStorage;
    
    // Retrieve all stored data
    const allInteractions = this.interactions;
    
    // Migrate all data to persistent storage
    for (const entry of allInteractions) {
      await persistentStorage.saveInteraction(entry.prompt, entry.response);
    }
    
    // Update statistics
    const stats = this.getStats();
    await persistentStorage.updateStatistics(stats);
    
    // Clear in-memory storage
    this.interactions = [];
  }

  async retrieveContext(query: string): Promise<string[]> {
    // Simple keyword matching (in production, use embeddings)
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    const matches = this.interactions
      .filter(entry => {
        const text = (entry.prompt + ' ' + entry.response).toLowerCase();
        return keywords.some(keyword => text.includes(keyword));
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3)
      .map(entry => `Previous: ${entry.prompt}\nResponse: ${entry.response}`);
    
    return matches;
  }

  async saveInteraction(prompt: string, response: string): Promise<void> {
    this.interactions.push({
      prompt,
      response,
      timestamp: Date.now()
    });
    
    // Keep only recent entries
    if (this.interactions.length > this.maxEntries) {
      this.interactions = this.interactions.slice(-this.maxEntries);
    }
  }

  getStats() {
    return {
      total: this.interactions.length,
      oldest: this.interactions[0]?.timestamp,
      newest: this.interactions[this.interactions.length - 1]?.timestamp
    };
  }
}

// Export the memory storage implementation
export const memoryStorage = new InMemoryStorage();

// Export the interface for type safety
export type { AIMemoryHook } from '../../services/ai';
