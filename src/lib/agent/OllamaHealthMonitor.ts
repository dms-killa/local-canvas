// src/lib/agent/OllamaHealthMonitor.ts

import type { NetworkConfig } from '../config/NetworkValidator';

export interface HealthCheckResult {
  available: boolean;
  latencyMs: number | null;
  lastCheck: string;
  lastSuccess: string | null;
  error: string | null;
}

export class OllamaHealthMonitor {
  private lastResult: HealthCheckResult | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private inFlight = false;

  /**
   * Auto‑starts periodic health checks when the monitor is instantiated.
   *
   * In production this guarantee ensures that a health status is always
   * available for the AgentCoordinator’s binary gate without needing an
   * external bootstrap process.
   *
   * The loop can be disabled by setting `OLLAMA_HEALTH_LOOP=false` in the
   * environment – useful for local debugging.
   */
  constructor(
    private readonly config: NetworkConfig,
    /** optional flag to disable auto‑start (set via env var) */
    private readonly autoStart = !!process.env.OLLAMA_HEALTH_LOOP
      && process.env.OLLAMA_HEALTH_LOOP?.toLowerCase() !== 'false'
  ) {
    // Kick off the periodic health probe immediately.
    this.startPeriodicChecks();
  }

  async checkHealth(): Promise<HealthCheckResult> {
    if (this.inFlight) {
      return this.lastResult ?? {
        available: false,
        latencyMs: null,
        lastCheck: new Date().toISOString(),
        lastSuccess: null,
        error: 'health check already in progress',
      };
    }

    this.inFlight = true;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.config.timeoutMs
      );

      const response = await fetch(
        `${this.config.host}/api/version`,
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const latencyMs = Date.now() - startTime;
      const now = new Date().toISOString();

      const result: HealthCheckResult = {
        available: true,
        latencyMs,
        lastCheck: now,
        lastSuccess: now,
        error: null,
      };

      this.lastResult = result;
      return result;

    } catch (err) {
      const now = new Date().toISOString();

      const result: HealthCheckResult = {
        available: false,
        latencyMs: Date.now() - startTime,
        lastCheck: now,
        lastSuccess: this.lastResult?.lastSuccess ?? null,
        error: err instanceof Error ? err.message : String(err),
      };

      this.lastResult = result;
      return result;

    } finally {
      this.inFlight = false;
    }
  }

  startPeriodicChecks(
    intervalMs: number = this.config.healthCheckIntervalMs
  ): void {
    this.stopPeriodicChecks();

    this.checkInterval = setInterval(() => {
      void this.checkHealth();
    }, intervalMs);

    void this.checkHealth();
  }

  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getLastResult(): HealthCheckResult | null {
    return this.lastResult;
  }

  isHealthy(): boolean {
    return this.lastResult?.available === true;
  }
}
