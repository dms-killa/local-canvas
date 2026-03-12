// scripts/validate-config.ts (Corrected Type Safety)
import { NetworkValidator } from '../src/lib/config/NetworkValidator';

console.log('🔍 Network Configuration Validation Tests\n');

// 1. Add "as const" to ensure the array is treated as a list of Tuples, not (string|boolean)[]
const testCases = [
  ['http://localhost:11434', true, 'localhost'],
  ['http://127.0.0.1:11434', true, '127.0.0.1'],
  ['http://192.168.1.100:11434', true, '192.168.x.x'],
  ['http://10.0.0.5:11434', true, '10.x.x.x'],
  ['http://172.16.0.10:11434', true, '172.16.x.x'],
  ['http://scooter.lan:11434', true, 'scooter.lan'],
  ['http://server.local:11434', true, 'server.local'],
  ['http://mediaroom.lan:11434', true, 'mediaroom.lan'],
  ['http://8.8.8.8:11434', false, 'public IP'],
  ['https://api.openai.com', false, 'cloud API'],
  ['http://example.com:11434', false, 'public domain'],
] as const; 

let passed = 0;
let failed = 0;

// 2. The destructuring now correctly identifies types: string, boolean, string
testCases.forEach(([host, shouldPass, description]) => {
  // host is now strictly a string
  process.env.OLLAMA_HOST = host;
  
  try {
    NetworkValidator.loadAndValidate();
    
    if (shouldPass) {
      // description is now strictly a string, so .padEnd() works
      console.log(`✅ ${description.padEnd(15)} ${host}`);
      passed++;
    } else {
      console.log(`❌ ${description.padEnd(15)} ${host} (should have been rejected)`);
      failed++;
    }
  } catch (error) {
    if (!shouldPass) {
      console.log(`✅ ${description.padEnd(15)} ${host} (correctly rejected)`);
      passed++;
    } else {
      console.log(`❌ ${description.padEnd(15)} ${host} (should have passed)`);
      failed++;
    }
  }
});

console.log('\n' + '='.repeat(50));
console.log(`RESULTS: ${passed} / ${testCases.length} tests passed`);

if (failed > 0) {
  process.exit(1);
}