/**
 * API Validation Test Suite
 * 
 * This test suite verifies critical application paths:
 * - Sponsor information display
 * - Client/gift relationships
 * - Invitation flows
 * - API endpoint consistency
 */

import { exec } from 'child_process';
import fetch from 'node-fetch';

// Test configuration
const API_URL = 'http://localhost:5000/api';
const TESTS = {
  passed: 0,
  failed: 0,
  total: 0
};

// Utility functions
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m%s\x1b[0m',    // Cyan
    success: '\x1b[32m%s\x1b[0m',  // Green
    error: '\x1b[31m%s\x1b[0m',    // Red
    warning: '\x1b[33m%s\x1b[0m'   // Yellow
  };
  console.log(colors[type], message);
}

async function runTest(name, testFn) {
  try {
    log(`Running test: ${name}...`);
    TESTS.total++;
    const result = await testFn();
    if (result) {
      TESTS.passed++;
      log(`✅ PASS: ${name}`, 'success');
      return true;
    } else {
      TESTS.failed++;
      log(`❌ FAIL: ${name}`, 'error');
      return false;
    }
  } catch (error) {
    TESTS.failed++;
    log(`❌ ERROR: ${name} - ${error.message}`, 'error');
    return false;
  }
}

// Test suite runners
async function runApiTests() {
  log('=== API ENDPOINT VALIDATION TESTS ===', 'info');
  
  // Test: Health check
  await runTest('API Health Check', async () => {
    const response = await fetch(`${API_URL}/health`);
    return response.status === 200;
  });
  
  // Test: Client API returns clients with sponsor information
  await runTest('Client API - Sponsor Information Present', async () => {
    const response = await fetch(`${API_URL}/clients`);
    const clients = await response.json();
    
    if (!Array.isArray(clients) || clients.length === 0) {
      log('  No clients found to test', 'warning');
      return false;
    }
    
    // Check that all clients have sponsorSalonId and salonName or sponsorName
    return clients.every(client => {
      const hasSponsorInfo = (
        client.sponsorSalonId !== undefined &&
        (client.salonName !== undefined || client.sponsorName !== undefined)
      );
      
      if (!hasSponsorInfo) {
        log(`  Client missing sponsor info: ${JSON.stringify(client)}`, 'error');
      }
      
      return hasSponsorInfo;
    });
  });
  
  // Test: Individual client API returns sponsor information
  await runTest('Individual Client API - Sponsor Information', async () => {
    // First get all clients to find a valid ID
    const allResponse = await fetch(`${API_URL}/clients`);
    const clients = await allResponse.json();
    
    if (!Array.isArray(clients) || clients.length === 0) {
      log('  No clients found to test', 'warning');
      return false;
    }
    
    // Get first client's ID
    const clientId = clients[0].id;
    
    // Test individual client endpoint
    const response = await fetch(`${API_URL}/clients/${clientId}`);
    const client = await response.json();
    
    const hasSponsorInfo = (
      client.sponsorSalonId !== undefined &&
      (client.salonName !== undefined || client.sponsorName !== undefined)
    );
    
    if (!hasSponsorInfo) {
      log(`  Client ${clientId} missing sponsor info: ${JSON.stringify(client)}`, 'error');
    }
    
    return hasSponsorInfo;
  });
  
  // Test: Invitation API includes sender information
  await runTest('Invitation API - Sender Information', async () => {
    const response = await fetch(`${API_URL}/invitations`);
    const invitations = await response.json();
    
    if (!Array.isArray(invitations) || invitations.length === 0) {
      log('  No invitations found to test - skipping', 'warning');
      return true; // Skip rather than fail if no invitations
    }
    
    return invitations.every(invitation => {
      const hasSenderInfo = (
        invitation.senderId !== undefined &&
        invitation.senderName !== undefined
      );
      
      if (!hasSenderInfo) {
        log(`  Invitation missing sender info: ${JSON.stringify(invitation)}`, 'error');
      }
      
      return hasSenderInfo;
    });
  });
  
  // Test: Gift API includes sender and recipient information
  await runTest('Gift API - Sender/Recipient Information', async () => {
    // Try to find a client with gifts
    const clientsResponse = await fetch(`${API_URL}/clients`);
    const clients = await clientsResponse.json();
    
    if (!Array.isArray(clients) || clients.length === 0) {
      log('  No clients found to test gifts', 'warning');
      return true; // Skip rather than fail
    }
    
    // Check gifts for the first client
    const clientId = clients[0].id;
    const response = await fetch(`${API_URL}/gifts/sent/${clientId}`);
    const gifts = await response.json();
    
    if (!Array.isArray(gifts) || gifts.length === 0) {
      log(`  No gifts found for client ${clientId} - skipping`, 'warning');
      return true; // Skip rather than fail if no gifts
    }
    
    return gifts.every(gift => {
      const hasRequiredInfo = (
        gift.senderId !== undefined &&
        (gift.recipientId !== undefined || gift.recipientPhone !== undefined)
      );
      
      if (!hasRequiredInfo) {
        log(`  Gift missing required info: ${JSON.stringify(gift)}`, 'error');
      }
      
      return hasRequiredInfo;
    });
  });
}

// Run all tests
async function runAllTests() {
  try {
    await runApiTests();
    
    // Print summary
    log('\n=== TEST SUMMARY ===', 'info');
    log(`Total tests: ${TESTS.total}`, 'info');
    log(`Passed: ${TESTS.passed}`, 'success');
    log(`Failed: ${TESTS.failed}`, 'error');
    
    // Exit with appropriate code
    if (TESTS.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    log(`Test suite error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Start tests
runAllTests();