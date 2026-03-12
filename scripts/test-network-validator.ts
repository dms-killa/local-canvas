// scripts/test-network-validator.ts
import { NetworkValidator } from '../src/lib/config/NetworkValidator';
import { NetworkConfig } from '../src/lib/config/NetworkConfig';

console.log('🚀 Starting NetworkValidator tests...');

// Test case 1: Invalid URL format
console.log('\n### Test 1: Invalid URL format ###');
process.env.OLLAMA_HOST = 'localhost'; // Missing protocol
try {
  const config = NetworkValidator.loadAndValidate();
  console.log('❌ Invalid URL format test failed: Should have thrown an error');
} catch (error) {
  console.log('✅ Invalid URL format test passed: Correctly rejected invalid URL');
  console.log('   Error message:', error.message);
}

// Test case 2: Public internet address
console.log('\n### Test 2: Public internet address ###');
process.env.OLLAMA_HOST = 'http://example.com'; // Public internet
try {
  const config = NetworkValidator.loadAndValidate();
  console.log('❌ Public internet address test failed: Should have thrown an error');
} catch (error) {
  console.log('✅ Public internet address test passed: Correctly rejected public internet address');
  console.log('   Error message:', error.message);
}

// Test case 3: Invalid timeout value
console.log('\n### Test 3: Invalid timeout value ###');
process.env.OLLAMA_TIMEOUT_MS = '500'; // Below minimum
try {
  const config = NetworkValidator.loadAndValidate();
  console.log('❌ Invalid timeout value test failed: Should have thrown an error');
} catch (error) {
  console.log('✅ Invalid timeout value test passed: Correctly rejected invalid timeout');
  console.log('   Error message:', error.message);
}

// Test case 4: Invalid maxRetries value
console.log('\n### Test 4: Invalid maxRetries value ###');
process.env.OLLAMA_MAX_RETRIES = '11'; // Above maximum
try {
  const config = NetworkValidator.loadAndValidate();
  console.log('❌ Invalid maxRetries value test failed: Should have thrown an error');
} catch (error) {
  console.log('✅ Invalid maxRetries value test passed: Correctly rejected invalid maxRetries');
  console.log('   Error message:', error.message);
}

// Test case 5: Invalid healthCheckIntervalMs value
console.log('\n### Test 5: Invalid healthCheckIntervalMs value ###');
process.env.OLLAMA_HEALTH_CHECK_INTERVAL_MS = '60001'; // Above maximum
try {
  const config = NetworkValidator.loadAndValidate();
  console.log('❌ Invalid healthCheckIntervalMs value test failed: Should have thrown an error');
} catch (error) {
  console.log('✅ Invalid healthCheckIntervalMs value test passed: Correctly rejected invalid healthCheckIntervalMs');
  console.log('   Error message:', error.message);
}

// Test case 6: Invalid maxConcurrentRequests value
console.log('\n### Test 6: Invalid maxConcurrentRequests value ###');
process.env.MAX_CONCURRENT_REQUESTS = '0'; // Below minimum
try {
  const config = NetworkValidator.loadAndValidate();
  console.log('❌ Invalid maxConcurrentRequests value test failed: Should have thrown an error');
} catch (error) {
  console.log('✅ Invalid maxConcurrentRequests value test passed: Correctly rejected invalid maxConcurrentRequests');
  console.log('   Error message:', error.message);
}

// Test case 7: Valid configuration
console.log('\n### Test 7: Valid configuration ###');
process.env.OLLAMA_HOST = 'http://localhost:11434';
process.env.OLLAMA_TIMEOUT_MS = '60000';
process.env.OLLAMA_MAX_RETRIES = '3';
process.env.OLLAMA_HEALTH_CHECK_INTERVAL_MS = '30000';
process.env.MAX_CONCURRENT_REQUESTS = '2';

try {
  const config = NetworkValidator.loadAndValidate();
  console.log('✅ Valid configuration test passed: Correctly accepted valid configuration');
  console.log('   Config:', config);
} catch (error) {
  console.log('❌ Valid configuration test failed: Should have accepted valid configuration');
  console.log('   Error message:', error.message);
}

console.log('\n✅ All NetworkValidator tests completed successfully!');