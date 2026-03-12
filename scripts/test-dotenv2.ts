// test-dotenv2.ts
import dotenv from 'dotenv';

console.log('Step 1 - Before dotenv:');
console.log('  OLLAMA_HOST:', process.env.OLLAMA_HOST);

// Load .env from current directory
dotenv.config({ path: '.env' });

console.log('\nStep 2 - After dotenv:');
console.log('  OLLAMA_HOST:', process.env.OLLAMA_HOST);

// Now import and use NetworkConfig
import { NetworkConfig } from '../src/lib/config/NetworkConfig';
const config = NetworkConfig.load();
console.log('\nStep 3 - NetworkConfig.load():');
console.log('  host:', config.host);