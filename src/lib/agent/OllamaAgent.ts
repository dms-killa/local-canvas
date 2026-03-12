// src/lib/agent/OllamaAgent.ts
import type { NetworkConfig } from '../config/NetworkValidator';

export type OllamaErrorCode =
  | 'TIMEOUT'
  | 'HOST_UNAVAILABLE'
  | 'HTTP_4XX'
  | 'HTTP_5XX'
  | 'HTTP_429'
  | 'BAD_RESPONSE';

/**
 * Specialized error for Ollama interactions.
 * Enables the Coordinator to distinguish between transient and permanent failures.
 */
export class OllamaAgentError extends Error {
  constructor(
    message: string,
    public readonly code: OllamaErrorCode,
    public readonly httpStatus?: number
  ) {
    super(message);
    this.name = 'OllamaAgentError';
  }
}

export interface GenerateOptions {
  system?: string;
  temperature?: number;
  num_ctx?: number;
}

export class OllamaAgent {
  constructor(
    private readonly network: NetworkConfig,
    private readonly model: string
  ) {}

  /**
   * Lean transport primitive for Ollama generation.
   * Enforces client-side sovereignty via AbortController.
   */
  async generate(prompt: string, timeoutMs: number, opts: GenerateOptions = {}): Promise<string> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${this.network.host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          prompt,
          system: opts.system,
          stream: false,
          options: {
            temperature: opts.temperature,
            num_ctx: opts.num_ctx,
          },
        }),
      });

      if (!res.ok) {
        const code =
          res.status === 429 ? 'HTTP_429' :
          res.status >= 500 ? 'HTTP_5XX' : 'HTTP_4XX';

        throw new OllamaAgentError(
          `Ollama HTTP ${res.status} ${res.statusText}`,
          code,
          res.status
        );
      }

      const data = (await res.json()) as { response?: string };
      if (typeof data.response !== 'string') {
        throw new OllamaAgentError('Ollama response missing "response" field', 'BAD_RESPONSE');
      }

      return data.response;
    } catch (err) {
      if (err instanceof OllamaAgentError) throw err;

      // Handle AbortController timeout
      if (err instanceof Error && err.name === 'AbortError') {
        throw new OllamaAgentError('Ollama request timed out', 'TIMEOUT');
      }

      // Handle network-level failures (ECONNREFUSED, ENOTFOUND)
      throw new OllamaAgentError(
        err instanceof Error ? err.message : String(err),
        'HOST_UNAVAILABLE'
      );
    } finally {
      clearTimeout(t);
    }
  }
}