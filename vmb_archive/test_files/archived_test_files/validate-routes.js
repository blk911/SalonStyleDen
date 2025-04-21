#!/usr/bin/env node

/**
 * Route Validator - VMB Error Tracing Utility
 * 
 * This utility analyzes client-side routes and verifies they connect
 * to valid components. It also checks for proper error handling and 
 * navigation patterns throughout the application.
 */

import fs from 'fs/promises';
import path from 'path';

// Configuration
const APP_ROOT = '.';
const CLIENT_SRC = path.join(APP_ROOT, 'client/src');
const OUTPUT_FILE = path.join(APP_ROOT, 'logs/error-tracing/route-validation-results.log');

// ANSI color codes
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';

// Results tracking
const results = {
  routes: [],
  components: {},
  issues: [],
  passed: []
};

async function main() {
  console.log(`${CYAN}=== Ven Me, Baby! Route Validation ====${RESET}`);
  console.log(`Analyzing client-side routes and navigation...`);
  
  try {
    await ensureDirectoryExists(path.dirname(OUTPUT_FILE));
    
    // Find App.tsx to analyze routes
    const appFile = path.join(CLIENT_SRC, 'App.tsx');
    if (!(await fileExists(appFile))) {
      throw new Error(`App.tsx not found at ${appFile}`);
    }
    
    // Extract routes from App.tsx
    await extractRoutes(appFile);
    
    // Verify all page components exist
    await verifyPageComponents();
    
    // Check for broken navigation links
    await checkNavigationLinks();
    
    // Generate report
    await generateReport();
    
    console.log(`\n${GREEN}✓ Route validation complete!${RESET}`);
    console.log(`Report generated at: ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error(`${RED}Error during analysis:${RESET}`, error);
    process.exit(1);
  }
}

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function extractRoutes(appFile) {
  console.log(`\n${BLUE}Extracting routes from App.tsx...${RESET}`);
  
  const content = await fs.readFile(appFile, 'utf8');
  
  // Extract routes defined with wouter's <Route> component
  const routePattern = /<Route\s+path=['"](\/[^'"]*)['"]\s+component=\{([^}]+)\}/g;
  let match;
  
  while ((match = routePattern.exec(content)) !== null) {
    const path = match[1];
    const component = match[2].trim();
    
    console.log(`  ${GREEN}✓${RESET} Found route: ${path} → ${component}`);
    results.routes.push({ path, component });
  }
  
  // Alternative format: <Route path="/path"><Component /></Route>
  const altRoutePattern = /<Route\s+path=['"](\/[^'"]*)['"]\s*>\s*<([^/>]+)/g;
  while ((match = altRoutePattern.exec(content)) !== null) {
    const path = match[1];
    const component = match[2].trim();
    
    console.log(`  ${GREEN}✓${RESET} Found route: ${path} → ${component}`);
    results.routes.push({ path, component });
  }
  
  if (results.routes.length === 0) {
    results.issues.push('No routes found in App.tsx');
    console.log(`  ${RED}✗${RESET} No routes found in App.tsx`);
  } else {
    results.passed.push(`Found ${results.routes.length} routes in App.tsx`);
  }
}

async function verifyPageComponents() {
  console.log(`\n${BLUE}Verifying page components...${RESET}`);
  
  const pagesDir = path.join(CLIENT_SRC, 'pages');
  
  // Scan pages directory to find all available components
  if (await fileExists(pagesDir)) {
    await scanPagesDirectory(pagesDir);
  } else {
    results.issues.push(`Pages directory not found at ${pagesDir}`);
    console.log(`  ${RED}✗${RESET} Pages directory not found at ${pagesDir}`);
  }
  
  // Check if each route's component exists
  for (const route of results.routes) {
    const componentExists = results.components[route.component] !== undefined;
    
    if (componentExists) {
      results.passed.push(`Component ${route.component} for route ${route.path} exists`);
      console.log(`  ${GREEN}✓${RESET} Component ${route.component} for route ${route.path} exists`);
    } else {
      results.issues.push(`Component ${route.component} for route ${route.path} not found`);
      console.log(`  ${RED}✗${RESET} Component ${route.component} for route ${route.path} not found`);
    }
  }
}

async function scanPagesDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await scanPagesDirectory(fullPath);
    } else if (entry.name.match(/\.(jsx|tsx)$/)) {
      // Extract component name from filename
      const componentName = path.parse(entry.name).name;
      results.components[componentName] = fullPath;
      
      // Convert kebab-case (not-found) to PascalCase (NotFound) for component name check
      const pascalCaseName = componentName.split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
      
      // Read the file to check for default export
      const content = await fs.readFile(fullPath, 'utf8');
      if (!content.includes(`export default ${componentName}`) && 
          !content.includes(`export default function ${componentName}`) &&
          !content.includes(`export default ${pascalCaseName}`) &&
          !content.includes(`export default function ${pascalCaseName}`)) {
        results.issues.push(`Component ${componentName} does not have a matching default export`);
        console.log(`  ${YELLOW}!${RESET} Component ${componentName} does not have a matching default export`);
      }
    }
  }
}

async function checkNavigationLinks() {
  console.log(`\n${BLUE}Checking navigation links...${RESET}`);
  
  // Get all valid routes
  const validRoutes = new Set(results.routes.map(r => r.path));
  
  // Check all components for Link usage
  for (const [component, filePath] of Object.entries(results.components)) {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Look for wouter Link components
    const linkPattern = /<Link\s+(?:[^>]*?\s+)?href=['"](\/[^'"]*)['"]/g;
    let match;
    
    while ((match = linkPattern.exec(content)) !== null) {
      const linkTarget = match[1];
      
      // Check if the link target is a valid route
      if (!validRoutes.has(linkTarget)) {
        results.issues.push(`${component} links to non-existent route: ${linkTarget}`);
        console.log(`  ${RED}✗${RESET} ${component} links to non-existent route: ${linkTarget}`);
      } else {
        results.passed.push(`${component} has valid link to ${linkTarget}`);
        console.log(`  ${GREEN}✓${RESET} ${component} has valid link to ${linkTarget}`);
      }
    }
    
    // Check for useLocation/navigate hooks
    if (content.includes('useLocation') || content.includes('navigate(')) {
      // This is just a basic check - a more sophisticated analysis would parse the code
      // to verify that the navigation targets are valid routes
      console.log(`  ${YELLOW}!${RESET} ${component} uses programmatic navigation (verify manually)`);
    }
  }
  
  // Check Navbar component specially
  const navbarPath = path.join(CLIENT_SRC, 'components/layout/Navbar.tsx');
  if (await fileExists(navbarPath)) {
    const content = await fs.readFile(navbarPath, 'utf8');
    
    // Look for links in Navbar
    const linkPattern = /<Link\s+(?:[^>]*?\s+)?href=['"](\/[^'"]*)['"]/g;
    let match;
    let navbarLinks = 0;
    
    while ((match = linkPattern.exec(content)) !== null) {
      const linkTarget = match[1];
      navbarLinks++;
      
      // Check if the link target is a valid route
      if (!validRoutes.has(linkTarget)) {
        results.issues.push(`Navbar links to non-existent route: ${linkTarget}`);
        console.log(`  ${RED}✗${RESET} Navbar links to non-existent route: ${linkTarget}`);
      } else {
        results.passed.push(`Navbar has valid link to ${linkTarget}`);
        console.log(`  ${GREEN}✓${RESET} Navbar has valid link to ${linkTarget}`);
      }
    }
    
    if (navbarLinks === 0) {
      results.issues.push('Navbar does not contain any navigation links');
      console.log(`  ${YELLOW}!${RESET} Navbar does not contain any navigation links`);
    }
  } else {
    results.issues.push('Navbar component not found');
    console.log(`  ${YELLOW}!${RESET} Navbar component not found`);
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function generateReport() {
  console.log(`\n${BLUE}Generating route validation report...${RESET}`);
  
  let report = `Ven Me, Baby! Route Validation Report\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `===========================================\n\n`;
  
  // Add summary
  report += `SUMMARY:\n`;
  report += `  Routes found: ${results.routes.length}\n`;
  report += `  Components found: ${Object.keys(results.components).length}\n`;
  report += `  Issues found: ${results.issues.length}\n`;
  report += `  Checks passed: ${results.passed.length}\n\n`;
  
  // Add routes
  report += `ROUTES:\n`;
  report += `------------------------------------------\n`;
  for (const route of results.routes) {
    report += `  [${route.path}] → ${route.component}\n`;
  }
  report += `\n`;
  
  // Add issues
  if (results.issues.length > 0) {
    report += `ISSUES:\n`;
    report += `------------------------------------------\n`;
    for (const issue of results.issues) {
      report += `  [✗] ${issue}\n`;
    }
    report += `\n`;
  }
  
  // Add passed checks
  if (results.passed.length > 0) {
    report += `PASSED CHECKS:\n`;
    report += `------------------------------------------\n`;
    for (const pass of results.passed) {
      report += `  [✓] ${pass}\n`;
    }
    report += `\n`;
  }
  
  await fs.writeFile(OUTPUT_FILE, report);
}

// Start the analysis
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});