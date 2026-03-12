// scripts/check-health.ts
import { NetworkValidator } from '../src/lib/config/NetworkValidator';
import { OllamaHealthMonitor } from '../src/lib/agent/OllamaHealthMonitor';
import dotenv from 'dotenv';

dotenv.config();

async function runHealthCheck() {
  console.log('🔍 Starting Ollama Health Check...');

  try {
    // 1. Validate the environment configuration
    const config = NetworkValidator.loadAndValidate();
    console.log(`🌐 Target Host: ${config.host}`);

    // 2. Initialize the Monitor
    const monitor = new OllamaHealthMonitor(config);

    // 3. Perform the check
    const status = await monitor.checkHealth();

    console.log('\n--- Health Report ---');
    if (status.available) {
      console.log('✅ Status: ONLINE');
      console.log(`⏱️  Latency: ${status.latencyMs}ms`);
    } else {
      console.log('❌ Status: OFFLINE');
      console.log(`⚠️  Error: ${status.error || 'Unknown network error'}`);
    }
    console.log(`🕒 Last Check: ${status.lastCheck}`);
    console.log('---------------------\n');

    // Exit with code 1 if unavailable to help with CI/CD or automation
    if (!status.available) {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Configuration Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

// Invoke the wrapper
runHealthCheck();