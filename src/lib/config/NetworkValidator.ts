// src/lib/config/NetworkValidator.ts
export interface NetworkConfig {
  host: string;
  timeoutMs: number;
  maxRetries: number;
  healthCheckIntervalMs: number;
  maxConcurrentRequests: number;
}

export class NetworkValidator {
  static loadAndValidate(): NetworkConfig {
    const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
    
    // Extract hostname from URL for validation (remove protocol and port)
    let hostname: string;
    try {
      const url = new URL(host);
      hostname = url.hostname;
    } catch (error) {
      throw new Error(`Invalid URL format for OLLAMA_HOST: "${host}". Must include protocol (http:// or https://)`);
    }
    
    // Validate hostname against LAN-only policy
    const allowedPatterns = [
      /^localhost$/,
      /^127\.0\.0\.1$/,
      /^192\.168\.\d+\.\d+$/,
      /^10\.\d+\.\d+\.\d+$/,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/
    ];

    // Check if hostname is a valid hostname (allows domain names like scooter.lan)
    const isValidHostname = /^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*$/.test(hostname) && 
                          !hostname.includes('..') && 
                          hostname.length <= 253;

    // Check if it's a local domain (ends with .local or .lan)
    const isLocalDomain = hostname.toLowerCase().endsWith('.local') || 
                         hostname.toLowerCase().endsWith('.lan');

    // Also allow hostnames that look like they could be local (single name without dots)
    const isSimpleHostname = /^[a-zA-Z0-9\-]+$/.test(hostname) && 
                            !hostname.includes('.') && 
                            hostname !== 'localhost';

    const isValid = allowedPatterns.some(pattern => pattern.test(hostname)) || 
                   isValidHostname && (isLocalDomain || isSimpleHostname);
    
    if (!isValid) {
      throw new Error(
        `ARCHITECTURE VIOLATION: Host "${host}" (hostname: "${hostname}") violates LAN-only policy. ` +
        `Must be localhost, RFC1918 private address, or local domain (.local/.lan).`
      );
    }

    // Validate numeric configs
    const timeoutMs = parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000');
    if (timeoutMs < 1000 || timeoutMs > 300000) {
      throw new Error(`Invalid timeout: ${timeoutMs}ms. Must be between 1s and 5m.`);
    }

    const maxRetries = parseInt(process.env.OLLAMA_MAX_RETRIES || '3');
    if (maxRetries < 0 || maxRetries > 10) {
      throw new Error(`Invalid maxRetries: ${maxRetries}. Must be between 0 and 10.`);
    }

    const healthCheckIntervalMs = parseInt(process.env.OLLAMA_HEALTH_CHECK_INTERVAL_MS || '30000');
    if (healthCheckIntervalMs < 1000 || healthCheckIntervalMs > 60000) {
      throw new Error(`Invalid health check interval: ${healthCheckIntervalMs}ms. Must be between 1s and 1m.`);
    }

    const maxConcurrentRequests = parseInt(process.env.MAX_CONCURRENT_REQUESTS || '2');
    if (maxConcurrentRequests < 1 || maxConcurrentRequests > 5) {
      throw new Error(`Invalid maxConcurrentRequests: ${maxConcurrentRequests}. Must be between 1 and 5.`);
    }

    return {
      host,
      timeoutMs,
      maxRetries,
      healthCheckIntervalMs,
      maxConcurrentRequests
    };
  }
}