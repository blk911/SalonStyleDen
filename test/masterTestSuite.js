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

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: tests.length,
  details: []
};

// Format time
const formatTime = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

// Run individual test
const runTest = (test) => {
  return new Promise((resolve) => {
    console.log(`\n🧪 RUNNING TEST: ${test.name}`);
    console.log(`📋 Executing: ${test.script}`);
    
    const startTime = Date.now();
    const scriptPath = path.join(__dirname, test.script);
    
    let command, args;
    if (test.isShell) {
      command = scriptPath;
      args = [];
    } else {
      command = 'node';
      args = [scriptPath];
    }
    
    const testProcess = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: test.isShell
    });
    
    let output = '';
    
    testProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      
      // Only print lines with significant info - filtering out too verbose logging
      const significantLines = chunk
        .split('\n')
        .filter(line => {
          return line.includes('TEST') || 
                 line.includes('PASS') || 
                 line.includes('FAIL') || 
                 line.includes('SUCCESS') || 
                 line.includes('ERROR') || 
                 line.includes('SUMMARY') || 
                 line.includes('===');
        })
        .join('\n');
      
      if (significantLines.trim()) {
        console.log(significantLines);
      }
    });
    
    testProcess.stderr.on('data', (data) => {
      console.error(`❌ ERROR: ${data.toString()}`);
      output += data.toString();
    });
    
    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;
      
      if (success) {
        console.log(`✅ ${test.name} completed successfully in ${formatTime(duration)}`);
        results.passed++;
      } else {
        console.log(`❌ ${test.name} failed with exit code ${code} after ${formatTime(duration)}`);
        results.failed++;
      }
      
      results.details.push({
        name: test.name,
        script: test.script,
        success,
        duration,
        exitCode: code
      });
      
      resolve();
    });
  });
};

// Run all tests sequentially
const runAllTests = async () => {
  console.log('================================================');
  console.log('🔍 VMB MASTER TEST SUITE');
  console.log('================================================');
  console.log(`📆 Test suite started at: ${new Date().toISOString()}`);
  console.log(`🧪 Total tests to run: ${tests.length}`);
  console.log('------------------------------------------------');
  
  const suiteStartTime = Date.now();
  
  for (const test of tests) {
    await runTest(test);
  }
  
  const totalDuration = Date.now() - suiteStartTime;
  
  // Print report
  console.log('\n================================================');
  console.log('📊 VMB MASTER TEST SUITE RESULTS');
  console.log('================================================');
  console.log(`✅ Tests passed: ${results.passed}/${results.total}`);
  console.log(`❌ Tests failed: ${results.failed}/${results.total}`);
  console.log(`⏱️ Total duration: ${formatTime(totalDuration)}`);
  console.log('\n📋 DETAILED RESULTS:');
  
  results.details.forEach((result, index) => {
    const statusIcon = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${statusIcon} ${result.name} (${formatTime(result.duration)})`);
  });
  
  console.log('\n📝 TEST COVERAGE:');
  console.log('✓ Shell scripts functionality');
  console.log('✓ Component functionality (photo uploader, dual phone submission)');
  console.log('✓ Database operations (salon, client, invitation, trust unit, gift)');
  console.log('✓ API endpoints (all CRUD operations with validation)');
  console.log('✓ User flows (invitation, gift sending, button behavior)');
  
  const passRate = (results.passed / results.total) * 100;
  console.log(`\n🏆 OVERALL STATUS: ${passRate === 100 ? 'PASSED' : 'FAILED'} (${passRate.toFixed(0)}% pass rate)`);
  console.log(`📆 Test suite completed at: ${new Date().toISOString()}`);
  console.log('================================================');
  
  // Return exit code based on test results
  process.exit(results.failed === 0 ? 0 : 1);
};

// Execute the test suite
runAllTests().catch(error => {
  console.error('❌ Test suite execution failed:', error);
  process.exit(1);
});

/**
 * How to run this master test suite:
 * 
 * Simply run with Node.js:
 *    node test/masterTestSuite.js
 * 
 * Expected output:
 * - Summary of all test executions
 * - Pass/fail status for each test
 * - Overall status report with pass rate
 */