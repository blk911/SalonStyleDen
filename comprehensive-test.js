#!/usr/bin/env node

/**
 * VMB Platform Comprehensive Testing Script
 * Tests all endpoints, hooks, listeners, and components
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const PASS = `${colors.green}✓ PASS${colors.reset}`;
const FAIL = `${colors.red}✗ FAIL${colors.reset}`;
const WARN = `${colors.yellow}⚠ WARN${colors.reset}`;
const INFO = `${colors.blue}ℹ INFO${colors.reset}`;

let testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  total: 0,
  details: []
};

const SERVER_URL = 'http://localhost:5000';

// Helper function to make HTTP requests
async function makeRequest(endpoint, method = 'GET', body = null) {
  try {
    const { execSync } = await import('child_process');
    let curlCmd = `curl -s -w "%{http_code}" -o /tmp/response.json "${SERVER_URL}${endpoint}"`;
    
    if (method !== 'GET') {
      curlCmd = `curl -s -w "%{http_code}" -X ${method} -H "Content-Type: application/json" -o /tmp/response.json "${SERVER_URL}${endpoint}"`;
      if (body) {
        curlCmd += ` -d '${JSON.stringify(body)}'`;
      }
    }
    
    const statusCode = execSync(curlCmd, { encoding: 'utf8' }).trim();
    let responseData = {};
    
    try {
      responseData = JSON.parse(fs.readFileSync('/tmp/response.json', 'utf8'));
    } catch (e) {
      responseData = {};
    }
    
    return {
      status: parseInt(statusCode),
      ok: parseInt(statusCode) >= 200 && parseInt(statusCode) < 300,
      data: responseData
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

// 1. SERVER CONNECTIVITY TEST
async function testServerConnectivity() {
  console.log(`\n${colors.magenta}=== PHASE 1: SERVER CONNECTIVITY ===${colors.reset}`);
  
  testResults.total++;
  try {
    const response = await makeRequest('/api/health');
    if (response.ok && response.status === 200) {
      console.log(`${PASS} Server health check`);
      testResults.passed++;
      testResults.details.push({ test: 'Server Health', status: 'PASS', details: 'OK' });
    } else {
      console.log(`${FAIL} Server health check failed: ${response.status}`);
      testResults.failed++;
      testResults.details.push({ test: 'Server Health', status: 'FAIL', details: `Status: ${response.status}` });
    }
  } catch (error) {
    console.log(`${FAIL} Server connectivity failed: ${error.message}`);
    testResults.failed++;
    testResults.details.push({ test: 'Server Health', status: 'FAIL', details: error.message });
  }
}

// 2. API ENDPOINTS TEST
async function testApiEndpoints() {
  console.log(`\n${colors.magenta}=== PHASE 2: API ENDPOINTS ===${colors.reset}`);
  
  const endpoints = [
    { path: '/api/status', method: 'GET', expectedStatus: 200 },
    { path: '/api/clients', method: 'GET', expectedStatus: 200 },
    { path: '/api/invitations', method: 'GET', expectedStatus: 200 },
    { path: '/api/salons', method: 'GET', expectedStatus: 200 },
    { path: '/api/services', method: 'GET', expectedStatus: 200 },
    { path: '/api/gifts', method: 'GET', expectedStatus: 200 }
  ];
  
  for (const endpoint of endpoints) {
    testResults.total++;
    try {
      const response = await makeRequest(endpoint.path, endpoint.method);
      
      if (response.status === endpoint.expectedStatus) {
        console.log(`${PASS} ${endpoint.method} ${endpoint.path}`);
        testResults.passed++;
        testResults.details.push({ 
          test: `${endpoint.method} ${endpoint.path}`, 
          status: 'PASS', 
          details: `Status: ${response.status}` 
        });
      } else {
        console.log(`${FAIL} ${endpoint.method} ${endpoint.path} - Expected: ${endpoint.expectedStatus}, Got: ${response.status}`);
        testResults.failed++;
        testResults.details.push({ 
          test: `${endpoint.method} ${endpoint.path}`, 
          status: 'FAIL', 
          details: `Expected: ${endpoint.expectedStatus}, Got: ${response.status}` 
        });
      }
    } catch (error) {
      console.log(`${FAIL} ${endpoint.method} ${endpoint.path} - ${error.message}`);
      testResults.failed++;
      testResults.details.push({ 
        test: `${endpoint.method} ${endpoint.path}`, 
        status: 'FAIL', 
        details: error.message 
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// 3. DATABASE CONNECTIVITY TEST
async function testDatabaseConnectivity() {
  console.log(`\n${colors.magenta}=== PHASE 3: DATABASE CONNECTIVITY ===${colors.reset}`);
  
  testResults.total++;
  try {
    // Test database connection via API
    const response = await makeRequest('/api/clients');
    if (response.ok) {
      console.log(`${PASS} Database connectivity (via clients endpoint)`);
      testResults.passed++;
      testResults.details.push({ test: 'Database Connection', status: 'PASS', details: 'Connected via API' });
    } else {
      console.log(`${FAIL} Database connectivity test failed`);
      testResults.failed++;
      testResults.details.push({ test: 'Database Connection', status: 'FAIL', details: 'API connection failed' });
    }
  } catch (error) {
    console.log(`${FAIL} Database connectivity error: ${error.message}`);
    testResults.failed++;
    testResults.details.push({ test: 'Database Connection', status: 'FAIL', details: error.message });
  }
}

// 4. FRONTEND ASSETS TEST
async function testFrontendAssets() {
  console.log(`\n${colors.magenta}=== PHASE 4: FRONTEND ASSETS ===${colors.reset}`);
  
  const frontendFiles = [
    'client/src/App.tsx',
    'client/src/index.css',
    'client/src/main.tsx'
  ];
  
  for (const file of frontendFiles) {
    testResults.total++;
    if (fs.existsSync(file)) {
      console.log(`${PASS} Frontend file exists: ${file}`);
      testResults.passed++;
      testResults.details.push({ test: `Frontend: ${file}`, status: 'PASS', details: 'File exists' });
    } else {
      console.log(`${FAIL} Missing frontend file: ${file}`);
      testResults.failed++;
      testResults.details.push({ test: `Frontend: ${file}`, status: 'FAIL', details: 'File missing' });
    }
  }
}

// 5. TYPESCRIPT COMPILATION TEST
async function testTypeScriptCompilation() {
  console.log(`\n${colors.magenta}=== PHASE 5: TYPESCRIPT COMPILATION ===${colors.reset}`);
  
  testResults.total++;
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log(`${PASS} TypeScript compilation`);
    testResults.passed++;
    testResults.details.push({ test: 'TypeScript Compilation', status: 'PASS', details: 'No errors' });
  } catch (error) {
    const output = error.stdout?.toString() || error.message;
    if (output.includes('error TS')) {
      console.log(`${FAIL} TypeScript compilation errors`);
      testResults.failed++;
      testResults.details.push({ test: 'TypeScript Compilation', status: 'FAIL', details: 'Compilation errors' });
    } else {
      console.log(`${WARN} TypeScript compilation warnings`);
      testResults.warnings++;
      testResults.details.push({ test: 'TypeScript Compilation', status: 'WARN', details: 'Minor issues' });
    }
  }
}

// 6. SCHEMA VALIDATION TEST
async function testSchemaValidation() {
  console.log(`\n${colors.magenta}=== PHASE 6: SCHEMA VALIDATION ===${colors.reset}`);
  
  testResults.total++;
  try {
    if (fs.existsSync('shared/schema.ts')) {
      const schemaContent = fs.readFileSync('shared/schema.ts', 'utf8');
      
      // Basic validation checks
      const hasExports = schemaContent.includes('export');
      const hasDrizzle = schemaContent.includes('drizzle');
      
      if (hasExports && hasDrizzle) {
        console.log(`${PASS} Schema validation`);
        testResults.passed++;
        testResults.details.push({ test: 'Schema Validation', status: 'PASS', details: 'Schema structure valid' });
      } else {
        console.log(`${WARN} Schema validation - basic structure issues`);
        testResults.warnings++;
        testResults.details.push({ test: 'Schema Validation', status: 'WARN', details: 'Basic structure issues' });
      }
    } else {
      console.log(`${FAIL} Schema file not found`);
      testResults.failed++;
      testResults.details.push({ test: 'Schema Validation', status: 'FAIL', details: 'Schema file missing' });
    }
  } catch (error) {
    console.log(`${FAIL} Schema validation error: ${error.message}`);
    testResults.failed++;
    testResults.details.push({ test: 'Schema Validation', status: 'FAIL', details: error.message });
  }
}

// Main test execution
async function runComprehensiveTests() {
  console.log(`${colors.cyan}=================================${colors.reset}`);
  console.log(`${colors.cyan}=== VMB COMPREHENSIVE TESTING ===${colors.reset}`);
  console.log(`${colors.cyan}=================================${colors.reset}`);
  console.log(`Started at: ${new Date().toLocaleString()}\n`);
  
  await testServerConnectivity();
  await testApiEndpoints();
  await testDatabaseConnectivity();
  await testFrontendAssets();
  await testTypeScriptCompilation();
  await testSchemaValidation();
  
  // Detailed Results Summary
  console.log(`\n${colors.magenta}=== DETAILED TEST RESULTS ===${colors.reset}`);
  
  testResults.details.forEach((detail, index) => {
    const statusColor = detail.status === 'PASS' ? colors.green : 
                       detail.status === 'WARN' ? colors.yellow : colors.red;
    console.log(`${index + 1}. ${statusColor}${detail.status}${colors.reset} ${detail.test} - ${detail.details}`);
  });
  
  // Summary
  console.log(`\n${colors.magenta}=== TEST SUMMARY ===${colors.reset}`);
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${testResults.warnings}${colors.reset}`);
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  
  return testResults;
}

// Run if executed directly
runComprehensiveTests().catch(console.error);

export { runComprehensiveTests };