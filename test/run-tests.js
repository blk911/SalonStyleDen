/**
 * VMB LTD Test Runner
 * 
 * This script executes all component and API tests and reports the results.
 */

import { runTests } from './component-tests.js';
import fetch from 'node-fetch';
import { execSync } from 'child_process';

// API endpoint tests
async function testApiEndpoints() {
  console.log("\nTesting API Endpoints");
  console.log("====================");
  
  const endpoints = [
    { method: 'GET', url: '/api/health', expectedStatus: 200 },
    { method: 'GET', url: '/api/status', expectedStatus: 200 },
    { method: 'GET', url: '/api/clients', expectedStatus: 200 },
    { method: 'GET', url: '/api/salons', expectedStatus: 200 },
    { method: 'GET', url: '/api/invitations', expectedStatus: 200 }
  ];
  
  let passCount = 0;
  let failCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:5000${endpoint.url}`, {
        method: endpoint.method
      });
      
      if (response.status === endpoint.expectedStatus) {
        console.log(`✅ PASS: ${endpoint.method} ${endpoint.url} (${response.status})`);
        passCount++;
      } else {
        console.log(`❌ FAIL: ${endpoint.method} ${endpoint.url} - Expected ${endpoint.expectedStatus}, got ${response.status}`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${endpoint.method} ${endpoint.url} - ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\nAPI Tests Summary: ${passCount} passed, ${failCount} failed`);
  return { passCount, failCount };
}

// Database tests
async function testDatabase() {
  console.log("\nTesting Database Connectivity");
  console.log("============================");
  
  try {
    // Test database connection using a simple query
    const result = execSync('node -e "const { pool } = require(\'./server/db\'); pool.query(\'SELECT NOW()\').then(() => console.log(\'✅ Database connection successful\')).catch(err => { console.error(\'❌ Database connection failed:\', err); process.exit(1); })"');
    
    console.log(result.toString());
    return { pass: true, message: "Database connection successful" };
  } catch (error) {
    console.log(`❌ ERROR: Database connection failed - ${error.message}`);
    return { pass: false, error: error.message };
  }
}

// Test salon ID references
async function testSalonIdReferences() {
  console.log("\nTesting Salon ID References");
  console.log("==========================");
  
  try {
    // Check that VMB LTD has ID 1 in the database
    const result = await fetch('http://localhost:5000/api/salons');
    const salons = await result.json();
    
    const vmbLtd = salons.find(salon => salon.name === "VMB LTD" || salon.name === "Ven Me, Baby! LTD");
    
    if (vmbLtd && vmbLtd.id === 1) {
      console.log(`✅ PASS: VMB LTD has correct ID (${vmbLtd.id})`);
      return { pass: true, message: "VMB LTD has correct ID" };
    } else if (vmbLtd) {
      console.log(`❌ FAIL: VMB LTD has incorrect ID (${vmbLtd.id}, should be 1)`);
      return { pass: false, error: `VMB LTD has incorrect ID (${vmbLtd.id}, should be 1)` };
    } else {
      console.log(`❌ FAIL: VMB LTD salon not found in database`);
      return { pass: false, error: "VMB LTD salon not found in database" };
    }
  } catch (error) {
    console.log(`❌ ERROR: Failed to test salon ID references - ${error.message}`);
    return { pass: false, error: error.message };
  }
}

// Test dependency visualizer
async function testDependencyVisualizerFiles() {
  console.log("\nTesting Dependency Visualizer Files");
  console.log("=================================");
  
  const files = [
    "/visualizations/server-dependencies.txt",
    "/visualizations/client-dependencies.txt", 
    "/visualizations/shared-dependencies.txt",
    "/visualizations/salon-id-dependencies.txt",
    "/server-dependencies.svg",
    "/client-dependencies.svg",
    "/shared-dependencies.svg",
    "/salon-id-dependencies.svg"
  ];
  
  let passCount = 0;
  let failCount = 0;
  
  for (const file of files) {
    try {
      const response = await fetch(`http://localhost:5000${file}`);
      
      if (response.ok) {
        console.log(`✅ PASS: ${file} exists`);
        passCount++;
      } else {
        console.log(`❌ FAIL: ${file} not found (${response.status})`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ ERROR: Failed to check ${file} - ${error.message}`);
      failCount++;
    }
  }
  
  console.log(`\nFile Tests Summary: ${passCount} passed, ${failCount} failed`);
  return { passCount, failCount };
}

// Main test function
async function main() {
  console.log("VMB LTD PLATFORM TEST SUITE");
  console.log("==========================");
  console.log(`Date: ${new Date().toISOString()}\n`);
  
  // Run component tests
  console.log("COMPONENT TESTS");
  const componentResults = await runTests();
  
  // Run API tests
  const apiResults = await testApiEndpoints();
  
  // Run database tests
  const dbResults = await testDatabase();
  
  // Run salon ID reference tests
  const salonIdResults = await testSalonIdReferences();
  
  // Run dependency visualizer file tests
  const fileResults = await testDependencyVisualizerFiles();
  
  // Print overall summary
  console.log("\n\nOVERALL TEST SUMMARY");
  console.log("===================");
  console.log(`Component Tests: ${componentResults.filter(r => r.result.pass).length} passed, ${componentResults.filter(r => !r.result.pass).length} failed`);
  console.log(`API Endpoint Tests: ${apiResults.passCount} passed, ${apiResults.failCount} failed`);
  console.log(`Database Tests: ${dbResults.pass ? "PASSED" : "FAILED"}`);
  console.log(`Salon ID Reference Tests: ${salonIdResults.pass ? "PASSED" : "FAILED"}`);
  console.log(`File Tests: ${fileResults.passCount} passed, ${fileResults.failCount} failed`);
}

// Run the tests
main().catch(error => {
  console.error("Test suite failed with error:", error);
  process.exit(1);
});