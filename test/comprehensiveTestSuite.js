/**
 * VMB Comprehensive Test Suite
 * 
 * This script executes all test suites developed for the VMB platform
 * and provides a detailed report of the results.
 */

const { spawn } = require('child_process');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

console.log('\x1b[34m===================================================\x1b[0m');
console.log('\x1b[34m          VMB COMPREHENSIVE TEST SUITE             \x1b[0m');
console.log('\x1b[34m===================================================\x1b[0m');
console.log(`Test suite started at: ${new Date().toISOString()}`);

// All test suites to run
const testSuites = [
  {
    name: 'Master Test Suite',
    script: 'masterTestSuite.js',
    description: 'Core system functionality tests',
    color: '\x1b[0m', // Default color
    timeout: 60000 // 60 seconds
  },
  {
    name: 'Network Visualization Tests',
    script: 'networkVisualizationTest.js',
    description: 'Tests for the visualization components',
    color: '\x1b[35m', // Magenta
    timeout: 30000 // 30 seconds
  },
  {
    name: 'Security and Authentication Tests',
    script: 'securityAuthTest.js',
    description: 'Tests for authentication flows and RBAC',
    color: '\x1b[33m', // Yellow
    timeout: 30000 // 30 seconds
  },
  {
    name: 'Performance and Load Tests',
    script: 'performanceLoadTest.js',
    description: 'Tests for system performance under load',
    color: '\x1b[36m', // Cyan
    timeout: 60000 // 60 seconds
  },
  {
    name: 'Mobile Responsiveness Tests',
    script: 'mobileResponsivenessTest.js',
    description: 'Tests for mobile responsive design',
    color: '\x1b[32m', // Green
    timeout: 30000 // 30 seconds
  },
  {
    name: 'Payment Processing Tests',
    script: 'paymentProcessingTest.js',
    description: 'Tests for payment and subscription flows',
    color: '\x1b[35m', // Magenta
    timeout: 30000 // 30 seconds
  },
  {
    name: 'Database Race Condition Tests',
    script: 'databaseRaceConditionTest.js',
    description: 'Tests for concurrent database operations',
    color: '\x1b[36m', // Cyan
    timeout: 30000 // 30 seconds
  },
  {
    name: 'Backup and Restore Tests',
    script: 'backupRestoreTest.js',
    description: 'Tests for backup and restore functionality',
    color: '\x1b[33m', // Yellow
    timeout: 60000 // 60 seconds
  },
  {
    name: 'Data Migration Tests',
    script: 'dataMigrationTest.js',
    description: 'Tests for schema migration and data portability',
    color: '\x1b[32m', // Green
    timeout: 30000 // 30 seconds
  },
  {
    name: 'Real Photo Upload Tests',
    script: 'realPhotoUploadTest.js',
    description: 'Tests for photo upload from various devices',
    color: '\x1b[35m', // Magenta
    timeout: 60000 // 60 seconds
  }
];

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: testSuites.length,
  suites: []
};

// Format duration
const formatDuration = (milliseconds) => {
  if (milliseconds < 1000) return `${milliseconds}ms`;
  const seconds = Math.floor(milliseconds / 1000);
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

// Run a single test suite
const runTestSuite = (suite) => {
  return new Promise((resolve) => {
    console.log(`\n${suite.color}🧪 RUNNING TEST SUITE: ${suite.name}${'\x1b[0m'}`);
    console.log(`${suite.color}📋 ${suite.description}${'\x1b[0m'}`);
    console.log(`${suite.color}📋 Executing: ${suite.script}${'\x1b[0m'}`);
    
    const startTime = Date.now();
    const scriptPath = path.join(__dirname, suite.script);
    
    // Check if the script exists
    try {
      require.resolve(scriptPath);
    } catch (e) {
      console.log(`\x1b[33m⚠️ Script ${suite.script} not found or cannot be loaded${'\x1b[0m'}`);
      results.suites.push({
        name: suite.name,
        script: suite.script,
        status: 'skipped',
        duration: 0,
        error: 'Script not found'
      });
      results.skipped++;
      resolve();
      return;
    }
    
    // Start the test process
    const testProcess = spawn('node', [scriptPath], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Set timeout
    const timeout = setTimeout(() => {
      console.log(`\x1b[33m⚠️ Test ${suite.name} timed out after ${suite.timeout}ms${'\x1b[0m'}`);
      testProcess.kill();
      
      results.suites.push({
        name: suite.name,
        script: suite.script,
        status: 'failed',
        duration: suite.timeout,
        error: 'Test timed out'
      });
      results.failed++;
      resolve();
    }, suite.timeout);
    
    let output = '';
    
    testProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stdout.write(chunk);
    });
    
    testProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      process.stderr.write(chunk);
    });
    
    testProcess.on('close', (code) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      
      const testResults = extractTestResults(output);
      
      if (code === 0) {
        console.log(`\n\x1b[32m✅ ${suite.name} completed successfully in ${formatDuration(duration)}\x1b[0m`);
        results.suites.push({
          name: suite.name,
          script: suite.script,
          status: 'passed',
          duration,
          passedTests: testResults.passed,
          failedTests: testResults.failed
        });
        results.passed++;
      } else {
        console.log(`\n\x1b[31m❌ ${suite.name} failed with exit code ${code} after ${formatDuration(duration)}\x1b[0m`);
        results.suites.push({
          name: suite.name,
          script: suite.script,
          status: 'failed',
          duration,
          exitCode: code,
          passedTests: testResults.passed,
          failedTests: testResults.failed
        });
        results.failed++;
      }
      
      resolve();
    });
  });
};

// Generate CLI table for results
const generateResultsTable = () => {
  // Table header
  let table = "\n┌───────────────────────────────────────┬────────────┬──────────┬──────────┬──────────┐\n";
  table += "│ Test Suite                            │   Status   │ Duration │  Passed  │  Failed  │\n";
  table += "├───────────────────────────────────────┼────────────┼──────────┼──────────┼──────────┤\n";
  
  // Table rows
  for (const suite of results.suites) {
    const status = suite.status === 'passed' 
      ? '\x1b[32mPASSED ✓\x1b[0m ' 
      : suite.status === 'failed' 
        ? '\x1b[31mFAILED ✗\x1b[0m ' 
        : '\x1b[33mSKIPPED ⚠\x1b[0m';
    
    const duration = suite.duration === 0 ? '    -    ' : formatDuration(suite.duration).padStart(8);
    const passed = suite.passedTests !== undefined ? String(suite.passedTests).padStart(8) : '    -    ';
    const failed = suite.failedTests !== undefined ? String(suite.failedTests).padStart(8) : '    -    ';
    
    table += `│ ${suite.name.padEnd(37)} │ ${status} │ ${duration} │ ${passed} │ ${failed} │\n`;
  }
  
  // Table footer
  table += "└───────────────────────────────────────┴────────────┴──────────┴──────────┴──────────┘\n";
  
  return table;
};

// Run all test suites sequentially
const runAllTestSuites = async () => {
  const startTime = Date.now();
  
  for (const suite of testSuites) {
    await runTestSuite(suite);
  }
  
  const totalDuration = Date.now() - startTime;
  
  // Calculate total tests
  let totalPassedTests = 0;
  let totalFailedTests = 0;
  
  for (const suite of results.suites) {
    if (suite.passedTests) totalPassedTests += suite.passedTests;
    if (suite.failedTests) totalFailedTests += suite.failedTests;
  }
  
  // Generate summary report
  console.log('\n\x1b[34m===================================================\x1b[0m');
  console.log('\x1b[34m          COMPREHENSIVE TEST RESULTS                \x1b[0m');
  console.log('\x1b[34m===================================================\x1b[0m');
  
  // Results table
  console.log(generateResultsTable());
  
  // Summary stats
  console.log(`\x1b[34m🧪 Test Suites: ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped, ${results.total} total\x1b[0m`);
  console.log(`\x1b[34m🧪 Tests: ${totalPassedTests} passed, ${totalFailedTests} failed, ${totalPassedTests + totalFailedTests} total\x1b[0m`);
  console.log(`\x1b[34m⏱️ Total Duration: ${formatDuration(totalDuration)}\x1b[0m`);
  
  // Test coverage categories
  console.log('\n\x1b[34m📝 TEST COVERAGE AREAS:\x1b[0m');
  console.log('\x1b[34m✓ Core System Functionality\x1b[0m');
  console.log('\x1b[34m✓ Network Visualization Components\x1b[0m');
  console.log('\x1b[34m✓ Authentication and Authorization\x1b[0m');
  console.log('\x1b[34m✓ Performance and Load Handling\x1b[0m');
  console.log('\x1b[34m✓ Mobile Responsiveness\x1b[0m');
  console.log('\x1b[34m✓ Payment Processing\x1b[0m');
  console.log('\x1b[34m✓ Database Concurrency\x1b[0m');
  console.log('\x1b[34m✓ Backup and Recovery\x1b[0m');
  console.log('\x1b[34m✓ Data Migration\x1b[0m');
  console.log('\x1b[34m✓ File Upload and Processing\x1b[0m');
  
  // Final result
  const allPassed = results.failed === 0;
  console.log(`\n\x1b[${allPassed ? '32' : '31'}m🏆 OVERALL STATUS: ${allPassed ? 'PASSED' : 'FAILED'}\x1b[0m`);
  console.log(`\x1b[34m📆 Test suite completed at: ${new Date().toISOString()}\x1b[0m`);
  console.log('\x1b[34m===================================================\x1b[0m');
  
  return allPassed ? 0 : 1;
};

// Execute the test suite
runAllTestSuites().then(exitCode => {
  process.exitCode = exitCode;
}).catch(error => {
  console.error(`\x1b[31m❌ Error running test suite: ${error.message}\x1b[0m`);
  process.exitCode = 1;
});

/**
 * How to run this comprehensive test suite:
 * 
 * Simply run with Node.js:
 *    node test/comprehensiveTestSuite.js
 * 
 * Expected output:
 * - Execution of all available test suites
 * - Detailed results table showing each suite's status
 * - Overall summary of passed and failed tests
 * - Total test coverage reporting
 */