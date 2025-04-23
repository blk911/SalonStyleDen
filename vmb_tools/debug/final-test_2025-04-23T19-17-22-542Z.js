/**
 * VMB Final Comprehensive Test
 * This script tests all components and routes in the application
 */

import fetch from 'node-fetch';
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

// Base URL for the app
const BASE_URL = 'http://localhost:5000';

// Keep track of test results
const results = {
  endpoints: {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  },
  components: {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  },
  routes: {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  }
};

// Wait for a short delay
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test all API endpoints
async function testAllEndpoints() {
  console.log(`\n${colors.magenta}=== Testing All API Endpoints ====${colors.reset}`);
  
  // Define all API endpoints to test
  const endpoints = [
    { name: 'Health Check', method: 'GET', path: '/api/health', expectedStatus: 200 },
    { name: 'Status', method: 'GET', path: '/api/status', expectedStatus: 200 },
    { name: 'Get All Clients', method: 'GET', path: '/api/clients', expectedStatus: 200 },
    { name: 'Get All Salons', method: 'GET', path: '/api/salons', expectedStatus: 200 },
    { name: 'Get All Invitations', method: 'GET', path: '/api/invitations', expectedStatus: 200 },
    { name: 'Get Client by ID', method: 'GET', path: '/api/clients/2', expectedStatus: 200 },
    { name: 'Get Salon by ID', method: 'GET', path: '/api/salons/42', expectedStatus: 200 },
    { name: 'Get Style Selections', method: 'GET', path: '/api/clients/2/style-selections', expectedStatus: 200 }
  ];
  
  results.endpoints.total = endpoints.length;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint.method} ${endpoint.path}`);
      const response = await fetch(`${BASE_URL}${endpoint.path}`, { 
        method: endpoint.method 
      });
      
      const statusMatch = response.status === endpoint.expectedStatus;
      
      if (statusMatch) {
        console.log(`${PASS} ${endpoint.name}: ${endpoint.method} ${endpoint.path} [${response.status}]`);
        results.endpoints.passed++;
      } else {
        console.log(`${FAIL} ${endpoint.name}: ${endpoint.method} ${endpoint.path} [${response.status}, expected ${endpoint.expectedStatus}]`);
        results.endpoints.failed++;
      }
      
      results.endpoints.details.push({
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        expected: endpoint.expectedStatus,
        actual: response.status,
        success: statusMatch
      });
      
      // Give the server a small break between requests
      await wait(100);
    } catch (error) {
      console.log(`${FAIL} ${endpoint.name}: ${endpoint.method} ${endpoint.path} [Error: ${error.message}]`);
      results.endpoints.failed++;
      
      results.endpoints.details.push({
        name: endpoint.name,
        method: endpoint.method,
        path: endpoint.path,
        expected: endpoint.expectedStatus,
        error: error.message,
        success: false
      });
    }
  }
  
  console.log(`\n${colors.cyan}=== API Endpoints Summary ====${colors.reset}`);
  console.log(`Total endpoints tested: ${results.endpoints.total}`);
  console.log(`${PASS} Passed: ${results.endpoints.passed}`);
  
  if (results.endpoints.failed > 0) {
    console.log(`${FAIL} Failed: ${results.endpoints.failed}`);
  }
}

// Test component compilation and structure
async function testAllComponents() {
  console.log(`\n${colors.magenta}=== Testing All Components ====${colors.reset}`);
  
  const componentsDir = './client/src/components';
  const componentsToTest = [];
  
  function findComponents(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      
      if (fs.statSync(fullPath).isDirectory()) {
        findComponents(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        componentsToTest.push({
          path: fullPath,
          name: path.basename(file, path.extname(file)),
          directory: path.relative(componentsDir, dir)
        });
      }
    }
  }
  
  findComponents(componentsDir);
  
  results.components.total = componentsToTest.length;
  console.log(`Found ${componentsToTest.length} components to test`);
  
  for (const component of componentsToTest) {
    try {
      const content = fs.readFileSync(component.path, 'utf8');
      const issues = [];
      
      // Check if component has export
      const hasDefaultExport = content.includes(`export default ${component.name}`) || 
                             content.includes(`export default function ${component.name}`);
      const hasNamedExport = content.includes(`export function ${component.name}`) ||
                           content.includes(`export const ${component.name}`);
      const hasExport = hasDefaultExport || hasNamedExport;
      
      if (!hasExport) {
        issues.push('No export found');
      }
      
      // Check if component returns JSX
      const hasJsxReturn = content.includes("return (") && 
                         content.match(/<[A-Za-z]/g) !== null;
      
      if (!hasJsxReturn && !component.path.includes('/ui/')) {
        issues.push('Component may not return JSX');
      }
      
      // Check for potential issues with hooks
      const hasHooks = content.includes("useState") || 
                     content.includes("useEffect") || 
                     content.includes("useContext") ||
                     content.includes("useReducer") ||
                     content.includes("useMemo") ||
                     content.includes("useCallback") ||
                     content.includes("useRef");
      
      const hasConditionalHooks = hasHooks && 
                               content.match(/if\s*\(.*\)\s*\{\s*use[A-Z]/g) !== null;
      
      if (hasConditionalHooks) {
        issues.push('Potential conditional hooks usage');
      }
      
      if (issues.length === 0) {
        console.log(`${PASS} Component: ${component.directory}/${component.name}`);
        results.components.passed++;
      } else {
        console.log(`${WARN} Component: ${component.directory}/${component.name}`);
        issues.forEach(issue => console.log(`  - ${issue}`));
        results.components.failed++;
      }
      
      results.components.details.push({
        name: component.name,
        path: component.path,
        directory: component.directory,
        issues,
        success: issues.length === 0
      });
    } catch (error) {
      console.log(`${FAIL} Error testing component ${component.name}: ${error.message}`);
      results.components.failed++;
      
      results.components.details.push({
        name: component.name,
        path: component.path,
        directory: component.directory,
        issues: [`Error: ${error.message}`],
        success: false
      });
    }
  }
  
  console.log(`\n${colors.cyan}=== Components Summary ====${colors.reset}`);
  console.log(`Total components tested: ${results.components.total}`);
  console.log(`${PASS} Passed: ${results.components.passed}`);
  
  if (results.components.failed > 0) {
    console.log(`${WARN} Issues found: ${results.components.failed}`);
  }
}

// Test client-side routes
async function testClientRoutes() {
  console.log(`\n${colors.magenta}=== Testing Client Routes ====${colors.reset}`);
  
  // Get routes from App.tsx
  const appTsxPath = './client/src/App.tsx';
  
  try {
    const content = fs.readFileSync(appTsxPath, 'utf8');
    
    // Extract routes using regex
    const routeMatches = content.match(/<Route[^>]*path=["']([^"']*)["'][^>]*>/g) || [];
    const routes = routeMatches.map(match => {
      const pathMatch = match.match(/path=["']([^"']*)["']/);
      const componentMatch = match.match(/component=\{([^}]*)\}/);
      
      return {
        path: pathMatch ? pathMatch[1] : null,
        component: componentMatch ? componentMatch[1] : null,
        raw: match
      };
    }).filter(route => route.path !== null);
    
    results.routes.total = routes.length;
    console.log(`Found ${routes.length} routes defined in App.tsx`);
    
    // Verify that each route has a matching component
    for (const route of routes) {
      const issues = [];
      
      // Check for component
      if (!route.component) {
        issues.push('No component defined for route');
      }
      
      // Check for component file
      const possiblePaths = [
        `./client/src/pages/${route.component}.tsx`,
        `./client/src/pages/${route.component}.jsx`,
        `./client/src/components/${route.component}.tsx`,
        `./client/src/components/${route.component}.jsx`
      ];
      
      const componentExists = possiblePaths.some(p => fs.existsSync(p));
      
      if (!componentExists && route.component) {
        issues.push(`Component file not found for ${route.component}`);
      }
      
      if (issues.length === 0) {
        console.log(`${PASS} Route: ${route.path} → ${route.component}`);
        results.routes.passed++;
      } else {
        console.log(`${WARN} Route: ${route.path} → ${route.component}`);
        issues.forEach(issue => console.log(`  - ${issue}`));
        results.routes.failed++;
      }
      
      results.routes.details.push({
        path: route.path,
        component: route.component,
        issues,
        success: issues.length === 0
      });
    }
    
    console.log(`\n${colors.cyan}=== Routes Summary ====${colors.reset}`);
    console.log(`Total routes tested: ${results.routes.total}`);
    console.log(`${PASS} Passed: ${results.routes.passed}`);
    
    if (results.routes.failed > 0) {
      console.log(`${WARN} Issues found: ${results.routes.failed}`);
    }
  } catch (error) {
    console.log(`${FAIL} Error testing routes: ${error.message}`);
  }
}

// Generate a comprehensive test report
function generateReport() {
  const reportDir = './debug-reports';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }
  
  const reportDate = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(reportDir, `final-test-report-${reportDate}.html`);
  
  const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VMB Final Test Report - ${new Date().toLocaleString()}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
    h1, h2, h3 { color: #444; }
    .container { max-width: 1200px; margin: 0 auto; }
    .summary { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .test-result { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
    .test-header { padding: 10px 15px; background-color: #f8f8f8; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; }
    .test-content { padding: 15px; }
    .success { color: green; }
    .failure { color: red; }
    .warning { color: orange; }
    .item-list { list-style: none; padding: 0; }
    .item-list li { padding: 8px; border-bottom: 1px solid #eee; }
    .item-list li:last-child { border-bottom: none; }
    .details { margin-top: 5px; font-size: 0.9em; color: #666; }
    .issue { margin-left: 20px; color: #e74c3c; }
  </style>
</head>
<body>
  <div class="container">
    <h1>VMB Final Test Report</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    
    <div class="summary">
      <h2>Summary</h2>
      <table width="100%">
        <tr>
          <td><strong>API Endpoints:</strong></td>
          <td><span class="${results.endpoints.failed === 0 ? 'success' : 'failure'}">${results.endpoints.passed}/${results.endpoints.total} passed</span></td>
        </tr>
        <tr>
          <td><strong>Components:</strong></td>
          <td><span class="${results.components.failed === 0 ? 'success' : 'warning'}">${results.components.passed}/${results.components.total} passed</span></td>
        </tr>
        <tr>
          <td><strong>Routes:</strong></td>
          <td><span class="${results.routes.failed === 0 ? 'success' : 'warning'}">${results.routes.passed}/${results.routes.total} passed</span></td>
        </tr>
      </table>
    </div>
    
    <div class="test-result">
      <div class="test-header">
        <h2>API Endpoints</h2>
        <span class="${results.endpoints.failed === 0 ? 'success' : 'failure'}">${results.endpoints.failed === 0 ? 'PASSED' : 'ISSUES FOUND'}</span>
      </div>
      <div class="test-content">
        <ul class="item-list">
          ${results.endpoints.details.map(endpoint => `
            <li>
              <strong>${endpoint.name}</strong> 
              <span class="${endpoint.success ? 'success' : 'failure'}">${endpoint.success ? '✓' : '✗'}</span>
              <div class="details">
                ${endpoint.method} ${endpoint.path}
                ${!endpoint.success ? 
                  `<div class="issue">Expected status: ${endpoint.expected}, Actual: ${endpoint.actual || 'Error'}</div>` : 
                  ''}
                ${endpoint.error ? `<div class="issue">Error: ${endpoint.error}</div>` : ''}
              </div>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
    
    <div class="test-result">
      <div class="test-header">
        <h2>Components</h2>
        <span class="${results.components.failed === 0 ? 'success' : 'warning'}">${results.components.failed === 0 ? 'PASSED' : 'ISSUES FOUND'}</span>
      </div>
      <div class="test-content">
        <ul class="item-list">
          ${results.components.details.map(component => `
            <li>
              <strong>${component.directory}/${component.name}</strong> 
              <span class="${component.success ? 'success' : 'warning'}">${component.success ? '✓' : '⚠'}</span>
              ${component.issues.length > 0 ? 
                `<div class="issues">
                  ${component.issues.map(issue => `<div class="issue">${issue}</div>`).join('')}
                </div>` : 
                ''}
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
    
    <div class="test-result">
      <div class="test-header">
        <h2>Routes</h2>
        <span class="${results.routes.failed === 0 ? 'success' : 'warning'}">${results.routes.failed === 0 ? 'PASSED' : 'ISSUES FOUND'}</span>
      </div>
      <div class="test-content">
        <ul class="item-list">
          ${results.routes.details.map(route => `
            <li>
              <strong>${route.path}</strong> → ${route.component}
              <span class="${route.success ? 'success' : 'warning'}">${route.success ? '✓' : '⚠'}</span>
              ${route.issues.length > 0 ? 
                `<div class="issues">
                  ${route.issues.map(issue => `<div class="issue">${issue}</div>`).join('')}
                </div>` : 
                ''}
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  fs.writeFileSync(reportPath, htmlReport);
  console.log(`\nFinal test report generated: ${reportPath}`);
}

// Run all tests
async function runAllTests() {
  console.log(`${colors.magenta}=======================================${colors.reset}`);
  console.log(`${colors.magenta}=== VMB FINAL COMPREHENSIVE TEST =====${colors.reset}`);
  console.log(`${colors.magenta}=======================================${colors.reset}`);
  console.log(`Started at: ${new Date().toLocaleString()}`);
  
  // Test all API endpoints
  await testAllEndpoints();
  
  // Test all components
  await testAllComponents();
  
  // Test all client routes
  await testClientRoutes();
  
  // Generate a comprehensive report
  generateReport();
  
  // Final summary
  console.log(`\n${colors.magenta}=======================================${colors.reset}`);
  console.log(`${colors.magenta}=== FINAL TEST SUMMARY ================${colors.reset}`);
  console.log(`${colors.magenta}=======================================${colors.reset}`);
  
  const totalTests = results.endpoints.total + results.components.total + results.routes.total;
  const totalPassed = results.endpoints.passed + results.components.passed + results.routes.passed;
  const totalFailed = results.endpoints.failed + results.components.failed + results.routes.failed;
  
  console.log(`Total tests run: ${totalTests}`);
  console.log(`${PASS} Passed: ${totalPassed}`);
  
  if (totalFailed > 0) {
    console.log(`${FAIL} Issues found: ${totalFailed}`);
  }
  
  console.log(`\nTest completed at ${new Date().toLocaleString()}`);
}

// Run all tests
runAllTests().catch(error => {
  console.error(`\n${FAIL} Unhandled error in test runner:`, error);
  process.exit(1);
});
