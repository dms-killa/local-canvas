// src/lib/config/NetworkValidator.test.ts
import { NetworkValidator } from './NetworkValidator';
import { NetworkConfig } from './NetworkConfig';
import dotenv from 'dotenv';

// Set up test environment
dotenv.config({ path: '.env' });

console.log('🚀 Starting NetworkValidator tests...');

// Test cases for URL validation
function testUrlValidation() {
  console.log('\n### URL Validation Tests ###');

  const validUrls = [
    'http://localhost',
    'https://localhost',
    'http://127.0.0.1',
    'https://127.0.0.1',
    'http://192.168.1.1',
    'https://192.168.1.1',
    'http://10.0.0.1',
    'https://10.0.0.1',
    'http://172.16.0.1',
    'https://172.16.0.1',
    'http://172.31.255.255',
    'https://172.31.255.255',
    'http://scooter.lan',
    'https://scooter.lan',
    'http://scooter.local',
    'https://scooter.local',
    'http://localhost:11434',
    'https://localhost:11434'
  ];

  const invalidUrls = [
    'localhost', // missing protocol
    '127.0.0.1', // missing protocol
    '192.168.1.1', // missing protocol
    '10.0.0.1', // missing protocol
    '172.16.0.1', // missing protocol
    'example.com', // public internet
    'google.com', // public internet
    'http://example.com', // public internet
    'http://google.com', // public internet
    'http://1.1.1.1', // public internet
    'http://8.8.8.8', // public internet
    'http://192.169.1.1', // invalid RFC1918
    'http://10.1.1.1', // valid but should be blocked by policy
    'http://172.15.0.1', // invalid RFC1918
    'http://172.32.0.1', // invalid RFC1918
    'http://192.168.1.1:8080', // valid but should be blocked by policy
    'http://10.0.0.1:8080', // valid but should be blocked by policy
    'http://172.16.0.1:8080', // valid but should be blocked by policy
    'http://172.31.255.255:8080' // valid but should be blocked by policy
  ];

  // Test valid URLs
  console.log('\nTesting valid URLs...');
  validUrls.forEach(url => {
    try {
      const config = NetworkValidator.loadAndValidate();
      console.log(`✅ ${url} - Valid URL passed validation`);
    } catch (error) {
      console.log(`❌ ${url} - Valid URL failed validation: ${error.message}`);
    }
  });

  // Test invalid URLs
  console.log('\nTesting invalid URLs...');
  invalidUrls.forEach(url => {
    try {
      const config = NetworkValidator.loadAndValidate();
      console.log(`❌ ${url} - Invalid URL passed validation (should have failed)`);
    } catch (error) {
      console.log(`✅ ${url} - Invalid URL correctly failed validation: ${error.message}`);
    }
  });
}

// Test cases for LAN-only policy enforcement
function testLanOnlyPolicy() {
  console.log('\n### LAN-Only Policy Tests ###');

  const allowedHosts = [
    'localhost',
    '127.0.0.1',
    '192.168.1.1',
    '10.0.0.1',
    '172.16.0.1',
    '172.31.255.255',
    'scooter.lan',
    'scooter.local',
    'mycomputer'
  ];

  const blockedHosts = [
    'example.com',
    'google.com',
    '1.1.1.1',
    '8.8.8.8',
    '192.169.1.1',
    '10.1.1.1',
    '172.15.0.1',
    '172.32.0.1',
    '192.168.1.1:8080',
    '10.0.0.1:8080',
    '172.16.0.1:8080',
    '172.31.255.255:8080'
  ];

  // Test allowed hosts
  console.log('\nTesting allowed hosts...');
  allowedHosts.forEach(host => {
    try {
      const config = NetworkValidator.loadAndValidate();
      console.log(`✅ ${host} - Allowed host passed validation`);
    } catch (error) {
      console.log(`❌ ${host} - Allowed host failed validation: ${error.message}`);
    }
  });

  // Test blocked hosts
  console.log('\nTesting blocked hosts...');
  blockedHosts.forEach(host => {
    try {
      const config = NetworkValidator.loadAndValidate();
      console.log(`❌ ${host} - Blocked host passed validation (should have failed)`);
    } catch (error) {
      console.log(`✅ ${host} - Blocked host correctly failed validation: ${error.message}`);
    }
  });
}

// Test cases for numeric validation
function testNumericValidation() {
  console.log('\n### Numeric Validation Tests ###');

  // Test valid timeout values
  console.log('\nTesting valid timeout values (1000-300000ms)...');
  for (let i = 1000; i <= 300000; i += 10000) {
    process.env.OLLAMA_TIMEOUT_MS = i.toString();
    try {
      const config = NetworkValidator.loadAndValidate();
      console.log(`✅ ${i}ms - Valid timeout passed validation`);
    } catch (error) {
      console.log(`❌ ${i}ms - Valid timeout failed validation: ${error.message}`);
    }
  }

  // Test invalid timeout values
  console.log('\nTesting invalid timeout values...');
  const invalidTimeouts = [500, 300001, 0, -1000];
  invalidTimeouts.forEach(timeout => {
    process.env.OLLAMA_TIMEOUT_MS = timeout.toString();
    try {
      const config = NetworkValidator.loadAndValidate();
      console.log(`❌ ${timeout}ms - Invalid timeout passed validation (should have failed)`);
    } catch (error) {
      console.log(`✅ ${timeout}ms - Invalid timeout correctly failed validation: ${error.message}`);
    }
  });

  // Test valid maxRetries values
  console.log('\nTesting valid maxRetries values (0-10)...');
  for (let i = 0; i <= 10; i++) {
    process.env.OLLAMA_MAX_RETRIES = i.toString();
    try {
      const config = NetworkValidator.loadAndValidate();
      console.log(`✅ ${i} - Valid maxRetries passed validation`);
    } catch (error) {
      console.log(`❌ ${i} - Valid maxRetries failed validation: ${error.message}`);
    }
  }

  // Test invalid maxRetries values
  console.log('\nTesting invalid maxRetries values...');
  const invalidMaxRetries = [-1, 11, 100];
  invalidMaxRetries.forEach(retries => {
    process.env.OLLAMA_MAX_RETRIES = retries.toString();
    try {
      const config = NetworkValidator.loadAndValidate();
      console.log(`❌ ${retries} - Invalid maxRetries passed validation (should have failed)`);
    } catch (error) {
      console.log(`✅ ${retries} - Invalid maxRetries correctly failed validation: ${error.message}`);
    }
  });

  // Test valid healthCheckIntervalMs values
  console.log('\nTesting valid healthCheckIntervalMs values (1000-60000ms)...');
  for (let i = 1000; i <= 60000; i += 10000) {
    process.env.OLLAMA_HEALTH_CHECK_INTERVAL_MS = i.toString();
    try {
      const config = NetworkValidator.loadAndValidate();
      console.log(`✅ ${i}ms - Valid healthCheckIntervalMs passed validation`);
    } catch (error) {
      console.log(`❌ ${i}ms - Valid healthCheckIntervalMs failed validation: ${error.message}`);
    }
  }

  // Test invalid healthCheckIntervalMs values
  console.log('\nTesting invalid healthCheckIntervalMs values...');
  const invalidHealthCheckIntervals = [500, 60001, 0, -1000];
  invalidHealthCheckIntervals.forEach(interval => {
    process.env.OLLAMA_HEALTH_CHECK_INTERVAL_MS = interval.toString();
    try {
      const config = NetworkValidator.loadAndValidate();
      console.log(`❌ ${interval}ms - Invalid healthCheckIntervalMs passed validation (should have failed)`);
    } catch (error) {
      console.log(`✅ ${interval}ms - Invalid healthCheckIntervalMs correctly failed validation: ${error.message}`);
    }
  });

  // Test valid maxConcurrentRequests values
  console.log('\nTesting valid maxConcurrentRequests values (1-5)...');
  for (let i = 1; i <= 5; i++) {
    process.env.MAX_CONCURRENT_REQUESTS = i.toString();
    try {
      const config = NetworkValidator.loadAndValidate();
      console.log(`✅ ${i} - Valid maxConcurrentRequests passed validation`);
    } catch (error) {
      console.log(`❌ ${i} - Valid maxConcurrentRequests failed validation: ${error.message}`);
    }
  }

  // Test invalid maxConcurrentRequests values
  console.log('\nTesting invalid maxConcurrentRequests values...');
  const invalidMaxConcurrentRequests = [0, 6, 10];
  invalidMaxConcurrentRequests.forEach(concurrent => {
    process.env.MAX_CONCURRENT_REQUESTS = concurrent.toString();
    try {
      const config = NetworkValidator.loadAndValidate();
      console.log(`❌ ${concurrent} - Invalid maxConcurrentRequests passed validation (should have failed)`);
    } catch (error) {
      console.log(`✅ ${concurrent} - Invalid maxConcurrentRequests correctly failed validation: ${error.message}`);
    }
  });
}

// Test cases for error message verification
function testErrorMessageVerification() {
  console.log('\n### Error Message Verification ###');

  // Test invalid URL format error
  process.env.OLLAMA_HOST = 'localhost'; // This will trigger the URL format error
  try {
    const config = NetworkValidator.loadAndValidate();
  } catch (error) {
    console.log(`✅ URL format error message verified: ${error.message}`);
    if (error.message.includes('Invalid URL format')) {
      console.log('✅ URL format error message contains correct text');
    } else {
      console.log('❌ URL format error message does not contain correct text');
    }
  }

  // Test LAN-only policy violation error
  process.env.OLLAMA_HOST = 'http://example.com'; // This will trigger the LAN-only policy error
  try {
    const config = NetworkValidator.loadAndValidate();
  } catch (error) {
    console.log(`✅ LAN-only policy error message verified: ${error.message}`);
    if (error.message.includes('ARCHITECTURE VIOLATION')) {
      console.log('✅ LAN-only policy error message contains correct text');
    } else {
      console.log('❌ LAN-only policy error message does not contain correct text');
    }
    if (error.message.includes('public internet')) {
      console.log('✅ LAN-only policy error message mentions public internet');
    } else {
      console.log('❌ LAN-only policy error message does not mention public internet');
    }
  }

  // Test timeout range error
  process.env.OLLAMA_TIMEOUT_MS = '500'; // Below minimum
  try {
    const config = NetworkValidator.loadAndValidate();
  } catch (error) {
    console.log(`✅ Timeout range error message verified: ${error.message}`);
    if (error.message.includes('Invalid timeout')) {
      console.log('✅ Timeout range error message contains correct text');
    } else {
      console.log('❌ Timeout range error message does not contain correct text');
    }
  }

  // Test maxRetries range error
  process.env.OLLAMA_MAX_RETRIES = '11'; // Above maximum
  try {
    const config = NetworkValidator.loadAndValidate();
  } catch (error) {
    console.log(`✅ maxRetries range error message verified: ${error.message}`);
    if (error.message.includes('Invalid maxRetries')) {
      console.log('✅ maxRetries range error message contains correct text');
    } else {
      console.log('❌ maxRetries range error message does not contain correct text');
    }
  }
}

// Run all tests
console.log('\nStarting comprehensive NetworkValidator tests...');

try {
  testUrlValidation();
  testLanOnlyPolicy();
  testNumericValidation();
  testErrorMessageVerification();

  console.log('\n✅ All NetworkValidator tests completed successfully!');
} catch (error) {
  console.log('\n❌ NetworkValidator tests failed: ' + error.message);
}

// Export for testing
export default { testUrlValidation, testLanOnlyPolicy, testNumericValidation, testErrorMessageVerification };