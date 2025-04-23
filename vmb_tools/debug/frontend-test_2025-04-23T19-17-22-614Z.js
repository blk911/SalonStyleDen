/**
 * VMB Frontend Component Test
 * This script validates component rendering and route behavior
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Directories to check
const CLIENT_SRC = './client/src';
const PAGES_DIR = path.join(CLIENT_SRC, 'pages');
const COMPONENTS_DIR = path.join(CLIENT_SRC, 'components');

// Track test results
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Helper functions
function getAllFiles(dir, fileList = []) {
  try {
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
  } catch (error) {
    console.error(`${FAIL} Error reading directory ${dir}: ${error.message}`);
    return fileList;
  }
}

function checkComponentStructure(componentPath) {
  try {
    const content = fs.readFileSync(componentPath, 'utf8');
    const basename = path.basename(componentPath);
    const componentName = path.parse(basename).name;
    
    // Check if component is properly exported
    const hasDefaultExport = content.includes(`export default ${componentName}`) || 
                            content.includes(`export default function ${componentName}`);
    
    const hasNamedExport = content.includes(`export function ${componentName}`) ||
                          content.includes(`export const ${componentName}`);
    
    const hasExport = hasDefaultExport || hasNamedExport;
    
    // Check for React import (may not be needed with newer React versions)
    const hasReactImport = content.includes("import React") || 
                          content.includes("import * as React");
    
    // Check for proper hooks usage (conditional hooks are a common issue)
    const hasHooks = content.includes("useState") || 
                    content.includes("useEffect") || 
                    content.includes("useContext") ||
                    content.includes("useReducer") ||
                    content.includes("useMemo") ||
                    content.includes("useCallback") ||
                    content.includes("useRef");
                    
    // Check for conditional hooks (potential issues)
    const hasConditionalHooks = content.includes("if") && hasHooks && 
                            (content.match(/if\s*\(.*\)\s*\{\s*use[A-Z]/g) !== null);
                            
    // Check for proper JSX return
    const hasJsxReturn = content.includes("return (") && 
                        content.includes(")") && 
                        content.match(/<[A-Za-z]/g) !== null;
    
    const result = {
      path: componentPath,
      name: componentName,
      hasExport,
      hasReactImport,
      hasHooks,
      hasConditionalHooks,
      hasJsxReturn,
      issues: []
    };
    
    if (!hasExport) result.issues.push("Missing export statement");
    if (hasHooks && !hasJsxReturn) result.issues.push("Has hooks but may not return JSX");
    if (hasConditionalHooks) result.issues.push("Potential conditional hooks usage");
    
    return result;
  } catch (error) {
    console.error(`${FAIL} Error analyzing component ${componentPath}: ${error.message}`);
    return {
      path: componentPath,
      name: path.basename(componentPath),
      hasExport: false,
      hasReactImport: false,
      hasHooks: false,
      hasConditionalHooks: false,
      hasJsxReturn: false,
      issues: [`Error analyzing: ${error.message}`]
    };
  }
}

function checkRoutes() {
  console.log(`\n${colors.cyan}=== Checking Routes Configuration ===${colors.reset}`);
  
  try {
    const appTsxPath = path.join(CLIENT_SRC, 'App.tsx');
    
    if (!fs.existsSync(appTsxPath)) {
      console.log(`${FAIL} App.tsx not found`);
      testResults.failed++;
      return [];
    }
    
    const content = fs.readFileSync(appTsxPath, 'utf8');
    
    // Look for wouter Route components
    const routeMatches = content.match(/<Route\s+.*path=["']([^"']*)["']/g) || [];
    
    console.log(`${INFO} Found ${routeMatches.length} route definitions`);
    
    // Extract paths and components
    const routes = routeMatches.map(match => {
      const pathMatch = match.match(/path=["']([^"']*)["']/);
      const componentMatch = match.match(/component=\{([^}]*)\}/);
      
      return {
        path: pathMatch ? pathMatch[1] : null,
        component: componentMatch ? componentMatch[1] : null,
        routeString: match
      };
    });
    
    // Check if all page components are used in routes
    const pageFiles = getAllFiles(PAGES_DIR)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'))
      .map(file => path.basename(file, path.extname(file)));
    
    const routeComponents = routes
      .map(r => r.component)
      .filter(Boolean);
    
    const unusedPages = pageFiles.filter(page => 
      !routeComponents.some(comp => comp === page)
    );
    
    if (unusedPages.length > 0) {
      console.log(`${WARN} Found ${unusedPages.length} page components not used in routes:`);
      unusedPages.forEach(page => console.log(`  - ${page}`));
      testResults.warnings += unusedPages.length;
    } else {
      console.log(`${PASS} All page components are used in routes`);
      testResults.passed++;
    }
    
    // Check for potentially conflicting routes
    const paths = routes.map(r => r.path).filter(Boolean);
    const seenPaths = new Set();
    const ambiguousPaths = [];
    
    paths.forEach(path => {
      if (seenPaths.has(path)) {
        ambiguousPaths.push(path);
      }
      seenPaths.add(path);
    });
    
    if (ambiguousPaths.length > 0) {
      console.log(`${WARN} Found ${ambiguousPaths.length} potentially conflicting routes:`);
      ambiguousPaths.forEach(path => console.log(`  - ${path}`));
      testResults.warnings += ambiguousPaths.length;
    } else {
      console.log(`${PASS} No conflicting routes found`);
      testResults.passed++;
    }
    
    return {
      routes,
      unusedPages,
      ambiguousPaths
    };
  } catch (error) {
    console.error(`${FAIL} Error checking routes: ${error.message}`);
    testResults.failed++;
    return {
      routes: [],
      unusedPages: [],
      ambiguousPaths: []
    };
  }
}

function checkComponents() {
  console.log(`\n${colors.cyan}=== Checking Components ===${colors.reset}`);
  
  const componentFiles = getAllFiles(COMPONENTS_DIR)
    .filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'));
  
  console.log(`${INFO} Found ${componentFiles.length} component files`);
  
  const results = [];
  let passedComponents = 0;
  let componentsWithIssues = 0;
  
  componentFiles.forEach(file => {
    const result = checkComponentStructure(file);
    results.push(result);
    
    if (result.issues.length === 0) {
      passedComponents++;
    } else {
      componentsWithIssues++;
      console.log(`${WARN} Component issues in ${path.basename(file)}:`);
      result.issues.forEach(issue => console.log(`  - ${issue}`));
      testResults.warnings += result.issues.length;
    }
  });
  
  console.log(`${PASS} ${passedComponents} components passed checks`);
  testResults.passed += passedComponents;
  
  if (componentsWithIssues > 0) {
    console.log(`${WARN} ${componentsWithIssues} components have issues that should be addressed`);
  }
  
  return results;
}

function checkImports() {
  console.log(`\n${colors.cyan}=== Checking Import Statements ===${colors.reset}`);
  
  const allFiles = [
    ...getAllFiles(COMPONENTS_DIR).filter(file => file.endsWith('.tsx') || file.endsWith('.jsx')),
    ...getAllFiles(PAGES_DIR).filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'))
  ];
  
  const results = {
    unusedImports: [],
    circularDependencies: [],
    relativePaths: []
  };
  
  // Check for unused imports
  try {
    allFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const importLines = content.match(/^import\s+.*\s+from\s+['"].*['"];?$/gm) || [];
      
      importLines.forEach(line => {
        const importName = line.match(/import\s+{?\s*([^{}]*)\s*}?\s+from/);
        if (importName && importName[1] && !content.includes(importName[1])) {
          // This is a very simple check and might have false positives
          results.unusedImports.push({
            file: path.basename(file),
            import: line
          });
        }
      });
    });
    
    if (results.unusedImports.length > 0) {
      console.log(`${WARN} Found ${results.unusedImports.length} potentially unused imports`);
      console.log(`  (Note: This is a simple check and may include false positives)`);
      results.unusedImports.slice(0, 5).forEach(item => 
        console.log(`  - ${item.file}: ${item.import.trim()}`)
      );
      if (results.unusedImports.length > 5) {
        console.log(`  ... and ${results.unusedImports.length - 5} more`);
      }
      testResults.warnings += results.unusedImports.length;
    } else {
      console.log(`${PASS} No potentially unused imports found`);
      testResults.passed++;
    }
  } catch (error) {
    console.error(`${FAIL} Error checking imports: ${error.message}`);
    testResults.failed++;
  }
  
  // Check for relative vs absolute paths
  try {
    let relativePathCount = 0;
    let absolutePathCount = 0;
    
    allFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const importLines = content.match(/^import\s+.*\s+from\s+['"].*['"];?$/gm) || [];
      
      importLines.forEach(line => {
        if (line.includes("from './") || line.includes("from '../")) {
          relativePathCount++;
          results.relativePaths.push({
            file: path.basename(file),
            import: line
          });
        } else if (line.includes("from '@/") || line.includes("from '@components/")) {
          absolutePathCount++;
        }
      });
    });
    
    console.log(`${INFO} Import paths: ${absolutePathCount} absolute, ${relativePathCount} relative`);
    
    if (relativePathCount > absolutePathCount) {
      console.log(`${WARN} Project uses more relative paths than absolute paths`);
      console.log(`  Consider using more absolute paths with aliases for better maintainability`);
      testResults.warnings++;
    } else {
      console.log(`${PASS} Project primarily uses absolute import paths`);
      testResults.passed++;
    }
  } catch (error) {
    console.error(`${FAIL} Error checking import paths: ${error.message}`);
    testResults.failed++;
  }
  
  return results;
}

// Main function to run all checks
async function runTests() {
  console.log(`${colors.magenta}=== VMB Frontend Component Test ===${colors.reset}`);
  console.log(`Testing at ${new Date().toLocaleString()}\n`);
  
  // Check components
  const componentResults = checkComponents();
  
  // Check routes
  const routeResults = checkRoutes();
  
  // Check imports
  const importResults = checkImports();
  
  // Summary
  console.log(`\n${colors.magenta}=== Test Summary ===${colors.reset}`);
  console.log(`${PASS} Passed: ${testResults.passed} checks`);
  
  if (testResults.failed > 0) {
    console.log(`${FAIL} Failed: ${testResults.failed} checks`);
  }
  
  if (testResults.warnings > 0) {
    console.log(`${WARN} Warnings: ${testResults.warnings} issues that should be addressed`);
  }
  
  console.log(`\n${colors.magenta}=== Component Testing ===${colors.reset}`);
  console.log(`Components checked: ${componentResults.length}`);
  console.log(`Components with issues: ${componentResults.filter(c => c.issues.length > 0).length}`);
  
  console.log(`\n${colors.magenta}=== Route Testing ===${colors.reset}`);
  if (routeResults.routes) {
    console.log(`Routes checked: ${routeResults.routes.length}`);
    console.log(`Unused pages: ${routeResults.unusedPages ? routeResults.unusedPages.length : 0}`);
    console.log(`Ambiguous routes: ${routeResults.ambiguousPaths ? routeResults.ambiguousPaths.length : 0}`);
  }
  
  console.log(`\n${colors.magenta}=== Import Testing ===${colors.reset}`);
  console.log(`Potentially unused imports: ${importResults.unusedImports.length}`);
  console.log(`Relative import paths: ${importResults.relativePaths.length}`);
  
  console.log(`\nTest completed at ${new Date().toLocaleString()}`);
}

// Run the tests
runTests();
