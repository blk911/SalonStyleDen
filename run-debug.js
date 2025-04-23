/**
 * VMB Comprehensive Debug Runner
 * This script runs all other debugging scripts and compiles results
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Terminal colors
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

// Test scripts to run (we'll run these manually since we need to convert them to ESM)
const testScripts = [
  { name: 'Basic API Health Check', script: 'api-health-check.js' }
];

// Track overall results
const results = [];
let currentTest = null;
let output = '';
let errorOutput = '';

// Helper function to run a script
function runScript(script) {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.magenta}=== Running ${script.name} ====${colors.reset}`);
    console.log(`Executing: ${script.script}`);
    
    currentTest = script;
    output = '';
    errorOutput = '';
    
    const child = spawn('node', [script.script], { stdio: 'pipe' });
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });
    
    child.on('close', (code) => {
      const result = {
        name: script.name,
        script: script.script,
        exitCode: code,
        success: code === 0,
        output: output,
        errorOutput: errorOutput
      };
      
      results.push(result);
      
      if (code === 0) {
        console.log(`\n${PASS} ${script.name} completed successfully`);
        resolve(result);
      } else {
        console.log(`\n${FAIL} ${script.name} failed with exit code ${code}`);
        resolve(result);  // Still resolve so we continue with other tests
      }
    });
    
    child.on('error', (err) => {
      const result = {
        name: script.name,
        script: script.script,
        exitCode: -1,
        success: false,
        output: output,
        errorOutput: `Failed to start process: ${err.message}`
      };
      
      results.push(result);
      console.log(`\n${FAIL} Failed to start ${script.name}: ${err.message}`);
      resolve(result);  // Still resolve so we continue with other tests
    });
  });
}

// Run basic API health checks
async function testAPIHealth() {
  console.log(`\n${colors.magenta}=== Testing API Health ====${colors.reset}`);
  
  const apiEndpoints = [
    { method: 'GET', path: '/api/health', expectedStatus: 200 },
    { method: 'GET', path: '/api/status', expectedStatus: 200 },
    { method: 'GET', path: '/api/clients', expectedStatus: 200 },
    { method: 'GET', path: '/api/salons', expectedStatus: 200 },
    { method: 'GET', path: '/api/invitations', expectedStatus: 200 }
  ];
  
  const apiResults = [];
  const testResults = { passed: 0, failed: 0 };
  
  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(`http://localhost:5000${endpoint.path}`, { 
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
      
      apiResults.push({
        endpoint: endpoint.path,
        success: statusMatch,
        status: response.status,
        expected: endpoint.expectedStatus
      });
    } catch (error) {
      testResults.failed++;
      console.log(`${FAIL} API Endpoint: ${endpoint.method} ${endpoint.path} [Error: ${error.message}]`);
      apiResults.push({
        endpoint: endpoint.path,
        success: false,
        error: error.message
      });
    }
  }
  
  console.log(`\n${colors.cyan}=== API Health Summary ===${colors.reset}`);
  console.log(`${PASS} Passed: ${testResults.passed} endpoints`);
  
  if (testResults.failed > 0) {
    console.log(`${FAIL} Failed: ${testResults.failed} endpoints`);
  }
  
  return {
    name: 'API Health Check',
    results: apiResults,
    passed: testResults.passed,
    failed: testResults.failed
  };
}

// Find and identify dead files
async function findDeadFiles() {
  console.log(`\n${colors.magenta}=== Finding Dead Files ====${colors.reset}`);
  
  try {
    // Look for potential test files
    const testFileCandidates = [];
    
    function searchDirectory(dir) {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        
        if (fs.statSync(fullPath).isDirectory()) {
          // Skip node_modules and other common directories to check
          if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
            searchDirectory(fullPath);
          }
        } else {
          // Check if filename suggests it's a test
          if (file.toLowerCase().includes('test') || 
              file.toLowerCase().includes('spec') ||
              file.toLowerCase().includes('mock') ||
              file.toLowerCase().includes('fixture') ||
              file.toLowerCase().includes('stub') ||
              file.toLowerCase().includes('fake')) {
            testFileCandidates.push(fullPath);
          }
          
          // Also check for files that appear to be unused
          if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.js')) {
            // We'll do a more comprehensive check later
          }
        }
      }
    }
    
    // Start the search from the project root
    searchDirectory('.');
    
    if (testFileCandidates.length > 0) {
      console.log(`${INFO} Found ${testFileCandidates.length} potential test files:`);
      testFileCandidates.forEach(file => {
        console.log(`  - ${file}`);
      });
    } else {
      console.log(`${PASS} No test files found in the project`);
    }
    
    return testFileCandidates;
  } catch (error) {
    console.error(`${FAIL} Error searching for dead files: ${error.message}`);
    return [];
  }
}

// Check for unused endpoints
async function checkUnusedEndpoints() {
  console.log(`\n${colors.magenta}=== Checking for Unused Endpoints ====${colors.reset}`);
  
  try {
    // Get all API endpoints defined in server routes
    const routesContent = fs.readFileSync('./server/routes.ts', 'utf8');
    
    // Extract route definitions using regex
    const apiEndpoints = [];
    const appMethodRegex = /app\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = appMethodRegex.exec(routesContent)) !== null) {
      apiEndpoints.push({
        method: match[1].toUpperCase(),
        path: match[2]
      });
    }
    
    console.log(`${INFO} Found ${apiEndpoints.length} API endpoints defined in server/routes.ts`);
    
    // Now search for endpoint usage in client code
    const clientFiles = [];
    function searchClientFiles(dir) {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        
        if (fs.statSync(fullPath).isDirectory()) {
          // Skip node_modules
          if (file !== 'node_modules') {
            searchClientFiles(fullPath);
          }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
          clientFiles.push(fullPath);
        }
      }
    }
    
    searchClientFiles('./client');
    
    // Check if each endpoint is used in client code
    const unusedEndpoints = [];
    
    for (const endpoint of apiEndpoints) {
      let endpointUsed = false;
      
      // Skip health and status endpoints as they might be used differently
      if (endpoint.path === '/api/health' || endpoint.path === '/api/status') {
        continue;
      }
      
      for (const file of clientFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Simple check if the endpoint path appears in the file
        if (content.includes(endpoint.path)) {
          endpointUsed = true;
          break;
        }
      }
      
      if (!endpointUsed) {
        unusedEndpoints.push(endpoint);
      }
    }
    
    if (unusedEndpoints.length > 0) {
      console.log(`${WARN} Found ${unusedEndpoints.length} potentially unused API endpoints:`);
      unusedEndpoints.forEach(endpoint => {
        console.log(`  - ${endpoint.method} ${endpoint.path}`);
      });
    } else {
      console.log(`${PASS} All API endpoints appear to be used in client code`);
    }
    
    return unusedEndpoints;
  } catch (error) {
    console.error(`${FAIL} Error checking unused endpoints: ${error.message}`);
    return [];
  }
}

// Check file naming consistency
async function checkFileNamingConsistency() {
  console.log(`\n${colors.magenta}=== Checking File Naming Consistency ====${colors.reset}`);
  
  try {
    const componentFiles = [];
    function searchComponentFiles(dir) {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        
        if (fs.statSync(fullPath).isDirectory()) {
          // Skip node_modules
          if (file !== 'node_modules') {
            searchComponentFiles(fullPath);
          }
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
          componentFiles.push({
            path: fullPath,
            name: path.basename(file, path.extname(file))
          });
        }
      }
    }
    
    searchComponentFiles('./client/src/components');
    
    console.log(`${INFO} Found ${componentFiles.length} component files`);
    
    // Check for consistent naming (PascalCase for components)
    const pascalCasePattern = /^[A-Z][A-Za-z0-9]*/;
    let inconsistentNames = 0;
    
    componentFiles.forEach(component => {
      if (!pascalCasePattern.test(component.name)) {
        inconsistentNames++;
        console.log(`${WARN} Component file not in PascalCase: ${component.path}`);
      }
    });
    
    if (inconsistentNames === 0) {
      console.log(`${PASS} All component files follow PascalCase naming convention`);
    } else {
      console.log(`${WARN} Found ${inconsistentNames} components not following PascalCase convention`);
    }
    
    return { 
      totalComponents: componentFiles.length,
      inconsistentNames 
    };
  } catch (error) {
    console.error(`${FAIL} Error checking file naming consistency: ${error.message}`);
    return { 
      totalComponents: 0,
      inconsistentNames: 0 
    };
  }
}

// Find console.log statements
async function findConsoleLogs() {
  console.log(`\n${colors.magenta}=== Finding console.log Statements ====${colors.reset}`);
  
  try {
    let consoleLogCount = 0;
    const filesWithLogs = [];
    
    function searchDirectory(dir) {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        
        if (fs.statSync(fullPath).isDirectory()) {
          // Skip node_modules and other common directories to check
          if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
            searchDirectory(fullPath);
          }
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.js')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const matches = content.match(/console\.log\(/g);
          
          if (matches && matches.length > 0) {
            consoleLogCount += matches.length;
            filesWithLogs.push({
              path: fullPath,
              count: matches.length
            });
          }
        }
      }
    }
    
    // Start the search from client and server directories
    searchDirectory('./client');
    searchDirectory('./server');
    
    if (consoleLogCount > 0) {
      console.log(`${WARN} Found ${consoleLogCount} console.log statements in ${filesWithLogs.length} files:`);
      
      // Sort by count (descending)
      filesWithLogs.sort((a, b) => b.count - a.count);
      
      // Show top 10 files with most console.logs
      filesWithLogs.slice(0, 10).forEach(file => {
        console.log(`  - ${file.path}: ${file.count} statements`);
      });
      
      if (filesWithLogs.length > 10) {
        console.log(`  ...and ${filesWithLogs.length - 10} more files`);
      }
    } else {
      console.log(`${PASS} No console.log statements found in the project`);
    }
    
    return {
      totalCount: consoleLogCount,
      filesWithLogs
    };
  } catch (error) {
    console.error(`${FAIL} Error searching for console.log statements: ${error.message}`);
    return {
      totalCount: 0,
      filesWithLogs: []
    };
  }
}

// Run all tests
async function runAllTests() {
  console.log(`${colors.magenta}=======================================${colors.reset}`);
  console.log(`${colors.magenta}=== VMB COMPREHENSIVE DEBUG SCRIPT ===${colors.reset}`);
  console.log(`${colors.magenta}=======================================${colors.reset}`);
  console.log(`Started at: ${new Date().toLocaleString()}`);
  
  // Create the test report folder if it doesn't exist
  const reportDir = './debug-reports';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }
  
  // Run API health tests
  const apiHealth = await testAPIHealth();
  
  // Find dead files
  const deadFiles = await findDeadFiles();
  
  // Check for unused endpoints
  const unusedEndpoints = await checkUnusedEndpoints();
  
  // Check file naming consistency
  const fileNamingResult = await checkFileNamingConsistency();
  
  // Find console.log statements
  const consoleLogResults = await findConsoleLogs();
  
  // Generate summary report
  console.log(`\n${colors.magenta}=======================================${colors.reset}`);
  console.log(`${colors.magenta}=== COMPREHENSIVE DEBUG REPORT ===${colors.reset}`);
  console.log(`${colors.magenta}=======================================${colors.reset}`);
  
  console.log(`\nAPI Health Check: ${apiHealth.passed}/${apiHealth.passed + apiHealth.failed} endpoints passed`);
  console.log(`Potential dead files: ${deadFiles.length}`);
  console.log(`Potentially unused endpoints: ${unusedEndpoints.length}`);
  console.log(`Component file naming: ${fileNamingResult.totalComponents - fileNamingResult.inconsistentNames}/${fileNamingResult.totalComponents} follow convention`);
  console.log(`Console.log statements: ${consoleLogResults.totalCount} in ${consoleLogResults.filesWithLogs.length} files`);
  
  // Generate HTML report
  const reportDate = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(reportDir, `debug-report-${reportDate}.html`);
  
  const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VMB Debug Report - ${new Date().toLocaleString()}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
    h1, h2, h3 { color: #444; }
    .container { max-width: 1200px; margin: 0 auto; }
    .summary { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .test-result { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
    .test-header { padding: 10px 15px; background-color: #f8f8f8; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; }
    .test-output { padding: 15px; white-space: pre-wrap; overflow-x: auto; background-color: #f9f9f9; max-height: 300px; overflow-y: auto; }
    .success { color: green; }
    .failure { color: red; }
    .warning { color: orange; }
    .file-list { list-style: none; padding: 0; }
    .file-list li { padding: 5px 0; border-bottom: 1px solid #eee; }
    .endpoint-list { list-style: none; padding: 0; }
    .endpoint-list li { padding: 5px 0; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <h1>VMB Debug Report</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    
    <div class="summary">
      <h2>Summary</h2>
      <p><strong>API Health Check:</strong> <span class="${apiHealth.failed === 0 ? 'success' : 'failure'}">${apiHealth.passed}/${apiHealth.passed + apiHealth.failed} endpoints passed</span></p>
      <p><strong>Potential Dead Files:</strong> <span class="warning">${deadFiles.length}</span></p>
      <p><strong>Potentially Unused Endpoints:</strong> <span class="warning">${unusedEndpoints.length}</span></p>
      <p><strong>Component File Naming:</strong> <span class="${fileNamingResult.inconsistentNames === 0 ? 'success' : 'warning'}">${fileNamingResult.totalComponents - fileNamingResult.inconsistentNames}/${fileNamingResult.totalComponents} follow convention</span></p>
      <p><strong>Console.log Statements:</strong> <span class="warning">${consoleLogResults.totalCount} in ${consoleLogResults.filesWithLogs.length} files</span></p>
    </div>
    
    <h2>API Health Check</h2>
    <div class="test-result">
      <div class="test-header">
        <h3>API Endpoint Tests</h3>
        <span class="${apiHealth.failed === 0 ? 'success' : 'failure'}">${apiHealth.failed === 0 ? 'PASSED' : 'ISSUES FOUND'}</span>
      </div>
      <div class="test-output">
        <ul class="endpoint-list">
          ${apiHealth.results.map(result => `
            <li>
              ${result.endpoint}: 
              <span class="${result.success ? 'success' : 'failure'}">
                ${result.success ? 'PASSED' : 'FAILED'} 
                ${result.status ? `(Status: ${result.status})` : ''}
                ${result.error ? `(Error: ${result.error})` : ''}
              </span>
            </li>
          `).join('\n')}
        </ul>
      </div>
    </div>
    
    <h2>Potential Dead Files</h2>
    <ul class="file-list">
      ${deadFiles.map(file => `<li>${file}</li>`).join('\n')}
    </ul>
    
    <h2>Potentially Unused Endpoints</h2>
    <ul class="endpoint-list">
      ${unusedEndpoints.map(endpoint => `<li>${endpoint.method} ${endpoint.path}</li>`).join('\n')}
    </ul>
    
    <h2>Component File Naming</h2>
    <div class="test-result">
      <div class="test-header">
        <h3>Component Naming Convention Check</h3>
        <span class="${fileNamingResult.inconsistentNames === 0 ? 'success' : 'warning'}">${fileNamingResult.inconsistentNames === 0 ? 'PASSED' : 'ISSUES FOUND'}</span>
      </div>
      <div class="test-output">
        <p>Total Components: ${fileNamingResult.totalComponents}</p>
        <p>Components Following PascalCase Convention: ${fileNamingResult.totalComponents - fileNamingResult.inconsistentNames}</p>
        <p>Components Not Following Convention: ${fileNamingResult.inconsistentNames}</p>
      </div>
    </div>
    
    <h2>Console.log Statements</h2>
    <div class="test-result">
      <div class="test-header">
        <h3>Console.log Usage Check</h3>
        <span class="${consoleLogResults.totalCount === 0 ? 'success' : 'warning'}">${consoleLogResults.totalCount === 0 ? 'PASSED' : 'ISSUES FOUND'}</span>
      </div>
      <div class="test-output">
        <p>Total console.log Statements: ${consoleLogResults.totalCount}</p>
        <p>Files with console.log Statements: ${consoleLogResults.filesWithLogs.length}</p>
        
        <h4>Top Files with console.log Statements:</h4>
        <ul class="file-list">
          ${consoleLogResults.filesWithLogs.slice(0, 10).map(file => `
            <li>${file.path}: ${file.count} statements</li>
          `).join('\n')}
          ${consoleLogResults.filesWithLogs.length > 10 ? `<li>...and ${consoleLogResults.filesWithLogs.length - 10} more files</li>` : ''}
        </ul>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  fs.writeFileSync(reportPath, htmlReport);
  console.log(`\nHTML report generated: ${reportPath}`);
  
  console.log(`\n${colors.magenta}=== PENULTIMATE TEST WARNING ===${colors.reset}`);
  console.log('The next test would be the FINAL comprehensive test of all components and routes.');
  console.log('Please confirm when you are ready to proceed.');
}

// Execute all tests
runAllTests().catch(error => {
  console.error(`Unhandled error in test runner: ${error.message}`);
  process.exit(1);
});
