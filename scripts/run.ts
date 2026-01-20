#!/usr/bin/env tsx
// Unified runner that handles module resolution

import { spawn } from 'child_process';

const script = process.argv[2];
const args = process.argv.slice(3);

if (!script) {
  console.error('Usage: npm run <script> or npx tsx scripts/run.ts <script>');
  process.exit(1);
}

spawn('tsx', [`scripts/${script}.ts`, ...args], {
  stdio: 'inherit',
  shell: true
}).on('exit', (code) => {
  process.exit(code || 0);
});