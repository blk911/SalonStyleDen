/**
 * VMB Project Cleanup Script
 * 
 * This script:
 * 1. Moves test files and logs to archive
 * 2. Removes unused API endpoints
 * 3. Creates a directory for debug scripts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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

// Test files to move to archive
const testFilesToArchive = [
  'test-*.js',
  '*test*.js',
  '*fixture*.js',
  '*mock*.js',
  'db-integrity-test.js',
  'debug-app.js',
  'final-test.js',
  'frontend-test.js',
  'run-debug.js'
];

// Create archive directory if it doesn't exist
const archiveDir = path.join(__dirname, 'vmb_archive', 'test_files');
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
  console.log(`${colors.green}✓${colors.reset} Created archive directory: ${archiveDir}`);
}

// Create debug directory for our scripts
const debugDir = path.join(__dirname, 'vmb_tools', 'debug');
if (!fs.existsSync(debugDir)) {
  fs.mkdirSync(debugDir, { recursive: true });
  console.log(`${colors.green}✓${colors.reset} Created debug tools directory: ${debugDir}`);
}

// Create reports directory inside debug tools
const reportsDir = path.join(debugDir, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
  console.log(`${colors.green}✓${colors.reset} Created debug reports directory: ${reportsDir}`);
}

// Helper function to safely move a file
function moveFile(sourcePath, destDir) {
  const fileName = path.basename(sourcePath);
  const destPath = path.join(destDir, fileName);
  
  // Handle filename collisions by adding a timestamp
  if (fs.existsSync(destPath)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const [name, ext] = fileName.split('.');
    const newFileName = `${name}_${timestamp}.${ext}`;
    const newDestPath = path.join(destDir, newFileName);
    
    fs.copyFileSync(sourcePath, newDestPath);
    fs.unlinkSync(sourcePath);
    console.log(`${colors.green}✓${colors.reset} Moved file with timestamp (collision): ${sourcePath} → ${newDestPath}`);
  } else {
    fs.copyFileSync(sourcePath, destPath);
    fs.unlinkSync(sourcePath);
    console.log(`${colors.green}✓${colors.reset} Moved file: ${sourcePath} → ${destPath}`);
  }
}

// Find and move test files
function findAndMoveTestFiles() {
  console.log(`\n${colors.magenta}=== Moving Test Files to Archive ===${colors.reset}`);
  
  let movedCount = 0;
  
  // Find all files matching the patterns
  for (const pattern of testFilesToArchive) {
    try {
      const files = execSync(`find . -name "${pattern}" -type f -not -path "*/node_modules/*" -not -path "*/vmb_archive/*"`)
        .toString()
        .trim()
        .split('\n')
        .filter(Boolean);
      
      for (const file of files) {
        // Move the file to the archive
        if (file.includes('debug') || file.includes('test')) {
          moveFile(file, debugDir);
        } else {
          moveFile(file, archiveDir);
        }
        movedCount++;
      }
    } catch (error) {
      // Suppress 'no matches found' errors from find
      if (!error.toString().includes('No such file or directory')) {
        console.error(`${colors.red}✗${colors.reset} Error finding test files:`, error.toString());
      }
    }
  }
  
  // Move debug reports to reports directory
  try {
    if (fs.existsSync('./debug-reports')) {
      const reportFiles = fs.readdirSync('./debug-reports');
      for (const file of reportFiles) {
        const sourcePath = path.join('./debug-reports', file);
        const destPath = path.join(reportsDir, file);
        fs.copyFileSync(sourcePath, destPath);
        console.log(`${colors.green}✓${colors.reset} Moved report: ${sourcePath} → ${destPath}`);
        movedCount++;
      }
      
      // Remove the old debug-reports directory
      fs.rmSync('./debug-reports', { recursive: true });
      console.log(`${colors.green}✓${colors.reset} Removed old debug-reports directory`);
    }
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Error moving debug reports:`, error.toString());
  }
  
  console.log(`${colors.green}✓${colors.reset} Moved ${movedCount} test files to archive`);
}

// Remove unused API endpoint
function removeUnusedEndpoint() {
  console.log(`\n${colors.magenta}=== Removing Unused API Endpoint ===${colors.reset}`);
  
  const routesFilePath = path.join(__dirname, 'server', 'routes.ts');
  
  try {
    let routesContent = fs.readFileSync(routesFilePath, 'utf8');
    
    // Find the migrate/service-images endpoint
    const endpointRegex = /\s+\/\/ Data migration endpoint for fixing stored image URLs.*?(?=\s+app\.)/s;
    
    // Make a backup of the file first
    const backupPath = path.join(archiveDir, `routes-${Date.now()}.ts.bak`);
    fs.writeFileSync(backupPath, routesContent);
    console.log(`${colors.green}✓${colors.reset} Created backup of routes.ts at ${backupPath}`);
    
    // Find and remove the endpoint
    const endpoint = routesContent.match(endpointRegex);
    if (endpoint) {
      const originalLength = routesContent.length;
      routesContent = routesContent.replace(endpointRegex, '\n\n  ');
      const newLength = routesContent.length;
      
      if (originalLength !== newLength) {
        fs.writeFileSync(routesFilePath, routesContent);
        console.log(`${colors.green}✓${colors.reset} Removed unused API endpoint: /api/migrate/service-images`);
      } else {
        console.log(`${colors.yellow}⚠${colors.reset} Failed to remove endpoint from routes.ts`);
      }
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} Could not find the migrate/service-images endpoint in routes.ts`);
    }
  } catch (error) {
    console.error(`${colors.red}✗${colors.reset} Error removing unused endpoint:`, error.toString());
  }
}

// Run the cleanup
console.log(`${colors.magenta}=======================================${colors.reset}`);
console.log(`${colors.magenta}=== VMB Project Cleanup Script =======${colors.reset}`);
console.log(`${colors.magenta}=======================================${colors.reset}`);
console.log(`Started at: ${new Date().toLocaleString()}`);

// Find and move test files
findAndMoveTestFiles();

// Remove unused API endpoint
removeUnusedEndpoint();

console.log(`\n${colors.magenta}=== Cleanup Complete ===${colors.reset}`);
console.log(`Completed at: ${new Date().toLocaleString()}`);
