// test-dotenv.ts
import dotenv from 'dotenv';

console.log('Before dotenv config:');
console.log('OLLAMA_HOST:', process.env.OLLAMA_HOST);

dotenv.config();

console.log('\nAfter dotenv config:');
console.log('OLLAMA_HOST:', process.env.OLLAMA_HOST);