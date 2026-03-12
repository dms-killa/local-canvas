// src/lib/config/NetworkConfig.ts
export interface NetworkConfig {
  host: string;
  timeoutMs: number;
  maxRetries: number;
  healthCheckIntervalMs: number;
  maxConcurrentRequests: number;
}

export class NetworkConfig {
  static load(): NetworkConfig {
    const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const timeoutMs = parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000');
    const maxRetries = parseInt(process.env.OLLAMA_MAX_RETRIES || '3');
    const healthCheckIntervalMs = parseInt(process.env.OLLAMA_HEALTH_CHECK_INTERVAL_MS || '30000');
    const maxConcurrentRequests = parseInt(process.env.MAX_CONCURRENT_REQUESTS || '2');

    return {
      host,
      timeoutMs,
      maxRetries,
      healthCheckIntervalMs,
      maxConcurrentRequests
    };
  }
}