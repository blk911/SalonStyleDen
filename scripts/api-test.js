/**
 * VMB API Testing Script
 * 
 * This script tests critical gift and invitation endpoints to ensure they're working correctly.
 * Run with: node scripts/api-test.js
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_CLIENT_ID = 73; // Cyndi's ID

// Utility functions
const logSuccess = (msg) => console.log(`✓ ${msg}`);
const logError = (msg, error) => console.error(`✗ ${msg}:`, error);

// Test runner
async function runTests() {
  console.log('🔍 Starting API tests for VMB...\n');
  
  try {
    // Health check
    await testEndpoint('GET', '/health', null, 
      (data) => data.status === 'ok', 
      'Health check endpoint is working');
    
    // Test client endpoints
    const client = await testEndpoint('GET', `/clients/${TEST_CLIENT_ID}`, null,
      (data) => data.id === TEST_CLIENT_ID,
      `Client details for ID ${TEST_CLIENT_ID} can be retrieved`);
    
    if (client) {
      console.log(`\n🧑 Testing with client: ${client.name} (ID: ${client.id})\n`);
    }
    
    // Test gift retrieval endpoints
    await testEndpoint('GET', `/gifts/sent/${TEST_CLIENT_ID}`, null,
      (data) => Array.isArray(data),
      'Sent gifts endpoint returns an array');
    
    await testEndpoint('GET', `/gifts/received/${TEST_CLIENT_ID}`, null,
      (data) => Array.isArray(data),
      'Received gifts endpoint returns an array');
    
    // Test gift creation (don't actually send it)
    const giftData = {
      senderId: TEST_CLIENT_ID,
      recipientPhone: '(555) 123-4567',
      giftType: 'style_card',
      message: 'Test gift - API validation only',
      amount: 5000,
      status: 'draft'  // Using draft to not actually send it
    };
    
    // Let's just validate the gift creation endpoint structure is correct
    const giftEndpoint = await testEndpointStructure('POST', '/gifts', giftData,
      'Gift creation endpoint exists');
    
    // Test gift claim endpoint structure
    const testHash = 'test-hash-12345';
    const claimEndpoint = await testEndpointStructure('POST', `/gifts/${testHash}/claim`, 
      { status: 'claimed', clientId: TEST_CLIENT_ID },
      'Gift claim endpoint exists');
    
    console.log('\n✅ API Structure Tests Completed');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Test an endpoint and verify the response meets the validation function
async function testEndpoint(method, path, body, validationFn, successMessage) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();
    
    if (response.ok && validationFn(data)) {
      logSuccess(successMessage);
      return data;
    } else {
      throw new Error(`Response validation failed: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    logError(successMessage, error.message);
    return null;
  }
}

// Just test if the endpoint exists and accepts the request, don't care about response
async function testEndpointStructure(method, path, body, successMessage) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    
    // We only care that the endpoint exists, not if it succeeds
    // Since we're sending test data that won't pass validation
    if (response.status !== 404) {
      logSuccess(successMessage + ` (Status: ${response.status})`);
      return true;
    } else {
      throw new Error(`Endpoint not found: ${path}`);
    }
  } catch (error) {
    logError(successMessage, error.message);
    return false;
  }
}

// Run the tests
runTests();