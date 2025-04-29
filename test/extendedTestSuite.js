/**
 * VMB Extended Test Suite
 * 
 * This script executes the three additional comprehensive test suites:
 * 1. Network Visualization Component Tests
 * 2. Security and Authentication Tests
 * 3. Performance and Load Tests
 * 
 * It provides a detailed summary report with color-coded success/failure indicators.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test cases to run
const tests = [
  { 
    name: 'Network Visualization Component Tests',
    script: 'networkVisualizationTest.js',
    description: 'Tests the visualization components that display salon-client network relationships',
    color: '\x1b[35m' // Magenta
  },
  { 
    name: 'Security and Authentication Tests',
    script: 'securityAuthTest.js',
    description: 'Tests authentication flows and role-based access controls',
    color: '\x1b[33m' // Yellow
  },
  { 
    name: 'Performance and Load Tests',
    script: 'performanceLoadTest.js',
    description: 'Tests system performance under various load conditions',
    color: '\x1b[36m' // Cyan
  }
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

// Extract test results from output
const extractTestResults = (output) => {
  const passedMatches = output.match(/PASSED ✓/g);
  const failedMatches = output.match(/FAILED ✗/g);
  
  return {
    passed: passedMatches ? passedMatches.length : 0,
    failed: failedMatches ? failedMatches.length : 0,
    output
  };
};

// Run individual test
const runTest = (test) => {
  return new Promise((resolve) => {
    console.log(`\n${test.color}🧪 RUNNING TEST SUITE: ${test.name}${'\x1b[0m'}`);
    console.log(`${test.color}📋 ${test.description}${'\x1b[0m'}`);
    console.log(`${test.color}📋 Executing: ${test.script}${'\x1b[0m'}`);
    
    const startTime = Date.now();
    const scriptPath = path.join(__dirname, test.script);
    
    const testProcess = spawn('node', [scriptPath], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    
    testProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log(chunk);
    });
    
    testProcess.stderr.on('data', (data) => {
      const error = data.toString();
      output += error;
      console.error(error);
    });
    
    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;
      
      // Extract detailed test results
      const testResults = extractTestResults(output);
      
      if (success) {
        console.log(`\n\x1b[32m✅ ${test.name} completed successfully in ${formatTime(duration)}\x1b[0m`);
        results.passed++;
      } else {
        console.log(`\n\x1b[31m❌ ${test.name} failed with exit code ${code} after ${formatTime(duration)}\x1b[0m`);
        results.failed++;
      }
      
      results.details.push({
        name: test.name,
        script: test.script,
        description: test.description,
        success,
        duration,
        exitCode: code,
        passedTests: testResults.passed,
        failedTests: testResults.failed
      });
      
      resolve();
    });
  });
};

// Generate ASCII report table
const generateReportTable = () => {
  // Table header
  let table = "\n┌──────────────────────────────────────┬────────────┬──────────┬──────────┬──────────┐\n";
  table += "│ Test Suite                           │   Result   │ Duration │  Passed  │  Failed  │\n";
  table += "├──────────────────────────────────────┼────────────┼──────────┼──────────┼──────────┤\n";
  
  // Table rows
  for (const result of results.details) {
    const status = result.success ? '\x1b[32mPASSED ✓\x1b[0m ' : '\x1b[31mFAILED ✗\x1b[0m ';
    const duration = formatTime(result.duration).padStart(8);
    const passed = String(result.passedTests).padStart(8);
    const failed = String(result.failedTests).padStart(8);
    
    table += `│ ${result.name.padEnd(36)} │ ${status} │ ${duration} │ ${passed} │ ${failed} │\n`;
  }
  
  // Table footer
  table += "└──────────────────────────────────────┴────────────┴──────────┴──────────┴──────────┘\n";
  
  return table;
};

// Run all tests sequentially
const runAllTests = async () => {
  console.log('\x1b[34m===================================================\x1b[0m');
  console.log('\x1b[34m          VMB EXTENDED TEST SUITE                 \x1b[0m');
  console.log('\x1b[34m===================================================\x1b[0m');
  console.log(`📆 Test suite started at: ${new Date().toISOString()}`);
  console.log(`🧪 Total test suites to run: ${tests.length}`);
  console.log('\x1b[34m---------------------------------------------------\x1b[0m');
  
  const suiteStartTime = Date.now();
  
  for (const test of tests) {
    await runTest(test);
  }
  
  const totalDuration = Date.now() - suiteStartTime;
  
  // Calculate total tests
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const result of results.details) {
    totalPassed += result.passedTests;
    totalFailed += result.failedTests;
  }
  
  // Generate test report
  console.log('\n\x1b[34m===================================================\x1b[0m');
  console.log('\x1b[34m          VMB EXTENDED TEST SUITE RESULTS         \x1b[0m');
  console.log('\x1b[34m===================================================\x1b[0m');
  
  // Display report table
  console.log(generateReportTable());
  
  console.log(`\x1b[34m🧪 Test Suites: ${results.passed} passed, ${results.failed} failed, ${results.total} total\x1b[0m`);
  console.log(`\x1b[34m🧪 Tests: ${totalPassed} passed, ${totalFailed} failed, ${totalPassed + totalFailed} total\x1b[0m`);
  console.log(`\x1b[34m⏱️ Total Duration: ${formatTime(totalDuration)}\x1b[0m`);
  
  console.log('\n\x1b[34m📝 TEST COVERAGE:\x1b[0m');
  console.log('\x1b[34m✓ Network Visualization Components\x1b[0m');
  console.log('\x1b[34m✓ Authentication and Authorization\x1b[0m');
  console.log('\x1b[34m✓ Performance and Load Handling\x1b[0m');
  
  const allPassed = results.failed === 0;
  console.log(`\n\x1b[${allPassed ? '32' : '31'}m🏆 OVERALL STATUS: ${allPassed ? 'PASSED' : 'FAILED'}\x1b[0m`);
  console.log(`\x1b[34m📆 Test suite completed at: ${new Date().toISOString()}\x1b[0m`);
  console.log('\x1b[34m===================================================\x1b[0m');
  
  // Return exit code based on test results
  process.exit(results.failed === 0 ? 0 : 1);
};

// Execute the test suite
runAllTests().catch(error => {
  console.error('\x1b[31m❌ Test suite execution failed:', error);
  process.exit(1);
});

/**
 * How to run this extended test suite:
 * 
 * Simply run with Node.js:
 *    node test/extendedTestSuite.js
 * 
 * Expected output:
 * - Colored summaries of all test executions
 * - Pass/fail status for each test suite
 * - Detailed report table showing test counts and durations
 */