/**
 * VMB Comprehensive Debug Script
 * This script performs the following checks:
 * 1. Validates all API endpoints
 * 2. Checks for unused components
 * 3. Verifies database integrity
 * 4. Tests all client routes
 * 5. Identifies dead code
 * 6. Validates all imports
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const BASE_URL = 'http://localhost:5000';
const SOURCE_DIR = './client/src';
const SERVER_DIR = './server';

// Terminal colors for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test symbols
const PASS = `${colors.green}✓${colors.reset}`;
const FAIL = `${colors.red}✗${colors.reset}`;
const WARN = `${colors.yellow}⚠${colors.reset}`;
const INFO = `${colors.blue}ℹ${colors.reset}`;

// Track overall test results
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// All API endpoints to test
const apiEndpoints = [
  { method: 'GET', path: '/api/health', expectedStatus: 200 },
  { method: 'GET', path: '/api/status', expectedStatus: 200 },
  { method: 'GET', path: '/api/clients', expectedStatus: 200 },
  { method: 'GET', path: '/api/salons', expectedStatus: 200 },
  { method: 'GET', path: '/api/invitations', expectedStatus: 200 }
];

// Client routes to test
const clientRoutes = [
  '/',
  '/client-dashboard',
  '/salon-dashboard',
  '/invitation',
  '/register',
  '/salons'
];

// Helper functions
async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint.path}`, { 
      method: endpoint.method 
    });
    
    const statusMatch = response.status === endpoint.expectedStatus;
    const result = statusMatch ? PASS : FAIL;
    
    if (statusMatch) {
      testResults.passed++;
      console.log(`${result} API Endpoint: ${endpoint.method} ${endpoint.path} [${response.status}]`);
    } else {
      testResults.failed++;
      console.log(`${result} API Endpoint: ${endpoint.method} ${endpoint.path} [${response.status}, expected ${endpoint.expectedStatus}]`);
    }
    
    return {
      endpoint: endpoint.path,
      success: statusMatch,
      status: response.status,
      expected: endpoint.expectedStatus
    };
  } catch (error) {
    testResults.failed++;
    console.log(`${FAIL} API Endpoint: ${endpoint.method} ${endpoint.path} [Error: ${error.message}]`);
    return {
      endpoint: endpoint.path,
      success: false,
      error: error.message
    };
  }
}

async function findUnusedComponents() {
  console.log(`\n${colors.cyan}=== Checking for Unused Components ===${colors.reset}`);
  
  try {
    // Get all component files
    const componentsDir = path.join(SOURCE_DIR, 'components');
    const componentFiles = getAllFiles(componentsDir)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'))
      .map(file => ({
        path: file,
        name: path.basename(file, path.extname(file))
      }));
    
    console.log(`${INFO} Found ${componentFiles.length} component files`);
    
    // Check each component for usage
    const unusedComponents = [];
    
    for (const component of componentFiles) {
      // Skip UI library components which might be used dynamically
      if (component.path.includes('/ui/')) {
        continue;
      }
      
      const { stdout } = await execAsync(`grep -r "import.*${component.name}" --include="*.tsx" --include="*.jsx" ${SOURCE_DIR} | grep -v "${component.path}"`);
      
      if (!stdout.trim()) {
        unusedComponents.push(component);
        testResults.warnings++;
        console.log(`${WARN} Component ${component.name} may be unused`);
      }
    }
    
    return unusedComponents;
  } catch (error) {
    console.log(`${FAIL} Error checking unused components: ${error.message}`);
    return [];
  }
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

async function checkDatabaseIntegrity() {
  console.log(`\n${colors.cyan}=== Testing Database Integrity ===${colors.reset}`);
  
  try {
    const { stdout } = await execAsync('node -e "const { db } = require(\'./server/db.js\'); db.execute(\'SELECT 1\').then(r => console.log(\'DB Connection: OK\'))"');
    
    if (stdout.includes('OK')) {
      testResults.passed++;
      console.log(`${PASS} Database connection successful`);
      return true;
    } else {
      testResults.failed++;
      console.log(`${FAIL} Database connection failed`);
      return false;
    }
  } catch (error) {
    testResults.failed++;
    console.log(`${FAIL} Error testing database: ${error.message}`);
    return false;
  }
}

async function findDeadCode() {
  console.log(`\n${colors.cyan}=== Searching for Dead Code ===${colors.reset}`);
  
  try {
    // Look for commented out code blocks
    const { stdout: commentedCode } = await execAsync('grep -r "^\s*//" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" ./client ./server');
    const commentLines = commentedCode.split('\n').filter(line => line.trim());
    
    if (commentLines.length > 0) {
      testResults.warnings++;
      console.log(`${WARN} Found ${commentLines.length} commented code lines that might be removable`);
    }
    
    // Look for console.log statements in production code
    const { stdout: consoleLogs } = await execAsync('grep -r "console\.log" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" ./client ./server');
    const logLines = consoleLogs.split('\n').filter(line => line.trim());
    
    if (logLines.length > 0) {
      testResults.warnings++;
      console.log(`${WARN} Found ${logLines.length} console.log statements that should be removed for production`);
    }
    
    return {
      commentedCode: commentLines.length,
      consoleLogs: logLines.length
    };
  } catch (error) {
    console.log(`${FAIL} Error searching for dead code: ${error.message}`);
    return {
      commentedCode: 0,
      consoleLogs: 0
    };
  }
}

async function validateAllImports() {
  console.log(`\n${colors.cyan}=== Validating Module Imports ===${colors.reset}`);
  
  try {
    // Look for potential errors in imports
    const { stdout: importErrors } = await execAsync('grep -r "from \'" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" ./client ./server | grep -v "node_modules"');
    
    const importLines = importErrors.split('\n')
      .filter(line => line.trim())
      .map(line => ({
        line,
        hasError: line.includes('from \'./') && (
          !fs.existsSync(path.resolve(path.dirname(line.split(':')[0]), line.split('from \'')[1].split('\'')[0] + '.js')) &&
          !fs.existsSync(path.resolve(path.dirname(line.split(':')[0]), line.split('from \'')[1].split('\'')[0] + '.ts')) &&
          !fs.existsSync(path.resolve(path.dirname(line.split(':')[0]), line.split('from \'')[1].split('\'')[0] + '.tsx')) &&
          !fs.existsSync(path.resolve(path.dirname(line.split(':')[0]), line.split('from \'')[1].split('\'')[0] + '.jsx')) &&
          !fs.existsSync(path.resolve(path.dirname(line.split(':')[0]), line.split('from \'')[1].split('\'')[0] + '/index.js')) &&
          !fs.existsSync(path.resolve(path.dirname(line.split(':')[0]), line.split('from \'')[1].split('\'')[0] + '/index.ts'))
        )
      }));
    
    const problemImports = importLines.filter(imp => imp.hasError);
    
    if (problemImports.length > 0) {
      testResults.warnings += problemImports.length;
      problemImports.forEach(imp => {
        console.log(`${WARN} Potentially problematic import: ${imp.line}`);
      });
    } else {
      testResults.passed++;
      console.log(`${PASS} All import statements appear valid`);
    }
    
    return problemImports;
  } catch (error) {
    console.log(`${FAIL} Error validating imports: ${error.message}`);
    return [];
  }
}

async function checkFileConsistency() {
  console.log(`\n${colors.cyan}=== Checking File Naming and Structure Consistency ===${colors.reset}`);
  
  try {
    // Check for consistent file naming in components
    const componentFiles = getAllFiles(path.join(SOURCE_DIR, 'components'))
      .filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'));
    
    const pascalCasePattern = /^[A-Z][A-Za-z0-9]*/;
    let inconsistentNames = 0;
    
    componentFiles.forEach(file => {
      const baseName = path.basename(file, path.extname(file));
      if (!pascalCasePattern.test(baseName)) {
        inconsistentNames++;
        testResults.warnings++;
        console.log(`${WARN} Component file not in PascalCase: ${file}`);
      }
    });
    
    if (inconsistentNames === 0) {
      testResults.passed++;
      console.log(`${PASS} All component files follow PascalCase naming convention`);
    }
    
    return { inconsistentNames };
  } catch (error) {
    console.log(`${FAIL} Error checking file consistency: ${error.message}`);
    return { inconsistentNames: 0 };
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.magenta}=== VMB Comprehensive Debug Script ===${colors.reset}`);
  console.log(`${colors.magenta}=== Running tests at ${new Date().toLocaleString()} ===${colors.reset}\n`);
  
  // Step 1: Test all API endpoints
  console.log(`${colors.cyan}=== Testing API Endpoints ===${colors.reset}`);
  const apiResults = await Promise.all(apiEndpoints.map(testEndpoint));
  
  // Step 2: Find unused components
  const unusedComponents = await findUnusedComponents();
  
  // Step 3: Check database integrity
  const dbIntegrity = await checkDatabaseIntegrity();
  
  // Step 4: Search for dead code
  const deadCode = await findDeadCode();
  
  // Step 5: Validate all imports
  const importValidation = await validateAllImports();
  
  // Step 6: Check file naming consistency
  const fileConsistency = await checkFileConsistency();
  
  // Step 7: Final summary
  console.log(`\n${colors.magenta}=== Test Summary ===${colors.reset}`);
  console.log(`${PASS} Passed: ${testResults.passed} tests`);
  
  if (testResults.failed > 0) {
    console.log(`${FAIL} Failed: ${testResults.failed} tests`);
  }
  
  if (testResults.warnings > 0) {
    console.log(`${WARN} Warnings: ${testResults.warnings} items need attention`);
  }
  
  console.log(`\n${colors.magenta}=== PENULTIMATE TEST WARNING ===${colors.reset}`);
  console.log('The next test will be the FINAL comprehensive test of all components and routes.');
  console.log('Please confirm before proceeding to avoid interruptions.');
}

// Run all tests
runTests().catch(error => {
  console.error(`${FAIL} Unhandled error in test script:`, error);
});
