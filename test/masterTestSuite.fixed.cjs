/**
 * VMB MASTER TEST SUITE
 * 
 * This script executes all test scripts in sequence and provides a summary report.
 * It tests every aspect of the "Ven Me, Baby!" hair salon promotional web application:
 * - Shell scripts functionality
 * - Component functionality
 * - Database operations
 * - API endpoints
 * - User flows (invitation, gift, button behavior)
 */

const { spawn } = require('child_process');
const path = require('path');

// Test cases to run
const tests = [
  { name: 'Shell Scripts Test', script: 'shellScriptTests.sh', isShell: true },
  { name: 'Component Functionality Test', script: 'componentFunctionalityTests.js' },
  { name: 'Database Operations Test', script: 'databaseOperationsTest.js' },
  { name: 'API Endpoint Test', script: 'apiEndpointTest.js' },
  { name: 'Invitation Flow Test', script: 'flowTest.js' },
  { name: 'Gift Flow Test', script: 'giftFlowTest.js' },
  { name: 'Button Behavior Test', script: 'buttonFlowTest.js' }
];

// Main test execution
const runTests = async () => {
  console.log('\x1b[35m================================================\x1b[0m');
  console.log('\x1b[35m🔍 VMB MASTER TEST SUITE\x1b[0m');
  console.log('\x1b[35m================================================\x1b[0m');
  console.log(`📆 Test suite started at: ${new Date().toISOString()}`);
  console.log(`🧪 Total tests to run: ${tests.length}`);
  console.log('\x1b[35m------------------------------------------------\x1b[0m');

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const test of tests) {
    console.log(`\n🧪 RUNNING TEST: ${test.name}`);
    console.log(`📋 Executing: ${test.script}`);
    
    try {
      const result = await runTest(test);
      if (result === true) {
        console.log(`\x1b[32m✅ ${test.name} completed successfully\x1b[0m`);
        passed++;
      } else if (result === false) {
        console.log(`\x1b[31m❌ ${test.name} failed\x1b[0m`);
        failed++;
      } else {
        console.log(`\x1b[33m⚠️ ${test.name} skipped\x1b[0m`);
        skipped++;
      }
    } catch (error) {
      console.error(`\x1b[31m❌ Error running ${test.name}: ${error.message}\x1b[0m`);
      failed++;
    }
  }

  console.log('\n\x1b[35m================================================\x1b[0m');
  console.log('\x1b[35m🔍 TEST RESULTS\x1b[0m');
  console.log('\x1b[35m================================================\x1b[0m');
  console.log(`🧪 Total tests: ${tests.length}`);
  console.log(`\x1b[32m✅ Passed: ${passed}\x1b[0m`);
  console.log(`\x1b[31m❌ Failed: ${failed}\x1b[0m`);
  console.log(`\x1b[33m⚠️ Skipped: ${skipped}\x1b[0m`);
  
  const exitCode = failed > 0 ? 1 : 0;
  process.exit(exitCode);
};

// Execute a single test
const runTest = (test) => {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, test.script);
    let command, args;
    
    if (test.isShell) {
      command = 'bash';
      args = [scriptPath];
    } else {
      command = 'node';
      args = [scriptPath];
    }
    
    const proc = spawn(command, args, {
      stdio: 'inherit'
    });
    
    proc.on('close', (code) => {
      resolve(code === 0);
    });
    
    proc.on('error', () => {
      resolve(null); // Skip tests that can't be run
    });
  });
};

// Start the tests
runTests().catch(err => {
  console.error(`\x1b[31m❌ Fatal error: ${err.message}\x1b[0m`);
  process.exit(1);
});

/**
 * How to run this test:
 * 
 * Simply run with Node.js:
 *    node test/masterTestSuite.fixed.cjs
 * 
 * Expected output:
 * - Results from all individual test scripts
 * - Summary of passed, failed, and skipped tests
 */