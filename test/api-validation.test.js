/**
 * API Validation Test Suite
 * 
 * This test suite verifies critical application paths:
 * - Sponsor information display
 * - Client/gift relationships
 * - Invitation flows
 * - API endpoint consistency
 */

import fetch from 'node-fetch';

// Configure the base URL for the API
const API_BASE_URL = 'http://localhost:5000/api';

// ANSI color codes for terminal output
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

// Utility function for logging
function log(message, type = 'info') {
  let prefix = '';
  let color = COLORS.reset;

  switch (type) {
    case 'success':
      prefix = '✅ SUCCESS: ';
      color = COLORS.green;
      break;
    case 'error':
      prefix = '❌ ERROR: ';
      color = COLORS.red;
      break;
    case 'warning':
      prefix = '⚠️ WARNING: ';
      color = COLORS.yellow;
      break;
    case 'info':
      prefix = 'ℹ️ INFO: ';
      color = COLORS.blue;
      break;
    case 'title':
      prefix = '🔍 ';
      color = COLORS.magenta;
      break;
  }

  console.log(`${color}${prefix}${message}${COLORS.reset}`);
}

// Helper function to run a test and handle success/failure
async function runTest(name, testFn) {
  try {
    log(`Running test: ${name}`, 'title');
    await testFn();
    log(`Test '${name}' passed successfully`, 'success');
    return true;
  } catch (error) {
    log(`Test '${name}' failed: ${error.message}`, 'error');
    console.error(error);
    return false;
  }
}

// Test suite for API validation
async function runApiTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test: Validate sponsor info in client endpoint
  const testClientSponsorInfo = async () => {
    log('Fetching all clients from API', 'info');
    
    const response = await fetch(`${API_BASE_URL}/clients`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.status} ${response.statusText}`);
    }
    
    const clients = await response.json();
    log(`Retrieved ${clients.length} clients`, 'info');
    
    // Check each client for sponsor information
    let allValid = true;
    let invalidClients = [];
    
    for (const client of clients) {
      if (!client.sponsor || client.sponsor === 'Unknown') {
        allValid = false;
        invalidClients.push({
          id: client.id,
          name: client.name, 
          phone: client.phone,
          sponsor: client.sponsor
        });
      }
      
      if (!client.sponsorName || client.sponsorName === 'Unknown') {
        allValid = false;
        invalidClients.push({
          id: client.id,
          name: client.name, 
          phone: client.phone,
          sponsorName: client.sponsorName
        });
      }
      
      if (!client.sponsorSalonId) {
        allValid = false;
        invalidClients.push({
          id: client.id,
          name: client.name, 
          phone: client.phone,
          sponsorSalonId: client.sponsorSalonId
        });
      }
    }
    
    if (!allValid) {
      log(`Found ${invalidClients.length} clients with missing sponsor information`, 'warning');
      console.table(invalidClients);
      throw new Error('Some clients have missing or invalid sponsor information');
    }
    
    log('All clients have valid sponsor information', 'success');
  };
  
  // Test: Validate sponsor info in invitations endpoint
  const testInvitationSponsorInfo = async () => {
    log('Fetching all invitations from API', 'info');
    
    const response = await fetch(`${API_BASE_URL}/invitations`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch invitations: ${response.status} ${response.statusText}`);
    }
    
    const invitations = await response.json();
    log(`Retrieved ${invitations.length} invitations`, 'info');
    
    // Check each invitation for sponsor information
    let allValid = true;
    let invalidInvitations = [];
    
    for (const invitation of invitations) {
      if (!invitation.sponsor || invitation.sponsor === 'Unknown') {
        allValid = false;
        invalidInvitations.push({
          id: invitation.id,
          name: invitation.name, 
          phone: invitation.phone,
          sponsor: invitation.sponsor
        });
      }
      
      if (!invitation.sponsorName || invitation.sponsorName === 'Unknown') {
        allValid = false;
        invalidInvitations.push({
          id: invitation.id,
          name: invitation.name, 
          phone: invitation.phone,
          sponsorName: invitation.sponsorName
        });
      }
      
      if (!invitation.salonId) {
        allValid = false;
        invalidInvitations.push({
          id: invitation.id,
          name: invitation.name, 
          phone: invitation.phone,
          salonId: invitation.salonId
        });
      }
    }
    
    if (!allValid) {
      log(`Found ${invalidInvitations.length} invitations with missing sponsor information`, 'warning');
      console.table(invalidInvitations);
      throw new Error('Some invitations have missing or invalid sponsor information');
    }
    
    log('All invitations have valid sponsor information', 'success');
  };

  // Test: Validate individual client retrieval
  const testIndividualClientRetrieval = async () => {
    log('Fetching first client for individual test', 'info');
    
    // Get all clients first
    const clientsResponse = await fetch(`${API_BASE_URL}/clients`);
    
    if (!clientsResponse.ok) {
      throw new Error(`Failed to fetch clients: ${clientsResponse.status} ${clientsResponse.statusText}`);
    }
    
    const clients = await clientsResponse.json();
    
    if (clients.length === 0) {
      log('No clients found to test', 'warning');
      return; // Skip test
    }
    
    // Test individual client retrieval
    const clientId = clients[0].id;
    log(`Testing individual client retrieval for ID: ${clientId}`, 'info');
    
    const response = await fetch(`${API_BASE_URL}/clients/${clientId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch client: ${response.status} ${response.statusText}`);
    }
    
    const client = await response.json();
    
    // Validate sponsor information
    if (!client.sponsor || client.sponsor === 'Unknown') {
      throw new Error(`Client has invalid sponsor: ${client.sponsor}`);
    }
    
    if (!client.sponsorName || client.sponsorName === 'Unknown') {
      throw new Error(`Client has invalid sponsorName: ${client.sponsorName}`);
    }
    
    if (!client.sponsorSalonId) {
      throw new Error(`Client has invalid sponsorSalonId: ${client.sponsorSalonId}`);
    }
    
    log('Individual client retrieval has valid sponsor information', 'success');
  };

  // Run all tests in sequence
  const tests = [
    { name: 'Client Sponsor Information', fn: testClientSponsorInfo },
    { name: 'Invitation Sponsor Information', fn: testInvitationSponsorInfo },
    { name: 'Individual Client Retrieval', fn: testIndividualClientRetrieval },
  ];

  for (const test of tests) {
    const success = await runTest(test.name, test.fn);
    results.tests.push({
      name: test.name,
      passed: success
    });
    
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  return results;
}

// Main function
async function runAllTests() {
  log('Starting API Validation Test Suite', 'title');
  
  try {
    // First check if the API is available
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/health`);
      if (!healthResponse.ok) {
        throw new Error(`API health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
      }
      log('API is available, proceeding with tests', 'success');
    } catch (error) {
      log(`API is not available at ${API_BASE_URL}: ${error.message}`, 'error');
      log('Please ensure the server is running and try again', 'info');
      return;
    }
    
    // Run the API validation tests
    const apiResults = await runApiTests();
    
    // Log summary of results
    log('\n==========================================', 'title');
    log('API Validation Test Results:', 'title');
    log(`Tests Passed: ${apiResults.passed}`, 'success');
    log(`Tests Failed: ${apiResults.failed}`, 'error');
    log('==========================================\n', 'title');
    
    // Print table of test results
    console.table(apiResults.tests.map(test => ({
      'Test Name': test.name,
      'Result': test.passed ? 'PASS' : 'FAIL'
    })));
    
    if (apiResults.failed === 0) {
      log('All tests passed successfully! 🎉', 'success');
    } else {
      log('Some tests failed, please check the logs for details', 'error');
    }
  } catch (error) {
    log(`Unexpected error running tests: ${error.message}`, 'error');
    console.error(error);
  }
}

// Run all tests
runAllTests();