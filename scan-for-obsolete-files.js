/**
 * VMB File System Scanner
 * 
 * This script checks the project for potential obsolete or unused files
 * that might be candidates for cleanup.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Configuration
const IGNORE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'vmb_archive'
];

const COMMON_DEV_FILES = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'drizzle.config.ts',
  'tailwind.config.ts',
  'postcss.config.js',
  'theme.json',
  '.gitignore',
  '.npmrc',
  'README.md',
  'clean-project.js',
  'scan-for-obsolete-files.js'
];

// Get file stats with last modified time
function getFileStats(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      path: filePath,
      size: stats.size,
      lastModified: stats.mtime,
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    console.error(`Error getting stats for ${filePath}: ${error.message}`);
    return null;
  }
}

// Check if a path should be ignored
function shouldIgnore(filePath) {
  const basename = path.basename(filePath);
  return IGNORE_DIRS.includes(basename) ||
         basename.startsWith('.') ||
         COMMON_DEV_FILES.includes(basename);
}

// Scan a directory recursively for files
function scanDirectory(dirPath, results = { files: [], directories: [] }) {
  if (shouldIgnore(dirPath)) {
    return results;
  }
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (shouldIgnore(fullPath)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        const stats = getFileStats(fullPath);
        if (stats) {
          results.directories.push(stats);
          // Recursively scan subdirectories
          scanDirectory(fullPath, results);
        }
      } else {
        const stats = getFileStats(fullPath);
        if (stats) {
          results.files.push(stats);
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}: ${error.message}`);
  }
  
  return results;
}

// Format bytes to human-readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Group files by extension
function groupByExtension(files) {
  const groups = {};
  
  for (const file of files) {
    const ext = path.extname(file.path).toLowerCase() || 'no-extension';
    if (!groups[ext]) {
      groups[ext] = [];
    }
    groups[ext].push(file);
  }
  
  return groups;
}

// Find files that haven't been modified in a long time
function findOldFiles(files, daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return files.filter(file => file.lastModified < cutoffDate);
}

// Find large files
function findLargeFiles(files, minSizeInBytes = 1024 * 1024) {
  return files.filter(file => file.size > minSizeInBytes);
}

// Main function
async function scanProject() {
  console.log('Scanning project for obsolete files...\n');
  
  // Scan the project
  const results = scanDirectory('.');
  const filesByExtension = groupByExtension(results.files);
  const oldFiles = findOldFiles(results.files, 30);
  const largeFiles = findLargeFiles(results.files, 1024 * 1024);
  
  // Display summary
  console.log('=== File Summary ===');
  console.log(`Total files: ${results.files.length}`);
  console.log(`Total directories: ${results.directories.length}`);
  
  // Display extension groups
  console.log('\n=== Files by Extension ===');
  for (const [ext, files] of Object.entries(filesByExtension)) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    console.log(`${ext}: ${files.length} files (${formatBytes(totalSize)})`);
  }
  
  // Display old files
  console.log('\n=== Files Not Modified in Last 30 Days ===');
  if (oldFiles.length > 0) {
    oldFiles.forEach(file => {
      console.log(`${file.path} (${formatBytes(file.size)}, Last modified: ${file.lastModified.toISOString().split('T')[0]})`);
    });
  } else {
    console.log('No old files found.');
  }
  
  // Display large files
  console.log('\n=== Large Files (>1MB) ===');
  if (largeFiles.length > 0) {
    largeFiles.forEach(file => {
      console.log(`${file.path} (${formatBytes(file.size)})`);
    });
  } else {
    console.log('No large files found.');
  }
  
  // Check for JavaScript files in the root
  const rootJsFiles = results.files.filter(file => 
    file.path.match(/^\.\/[^\/]+\.js$/) && 
    !COMMON_DEV_FILES.includes(path.basename(file.path))
  );
  
  console.log('\n=== JavaScript Utilities in Root Directory ===');
  if (rootJsFiles.length > 0) {
    rootJsFiles.forEach(file => {
      console.log(`${file.path} (${formatBytes(file.size)})`);
    });
  } else {
    console.log('No JavaScript utilities found in root directory.');
  }
  
  // Check for JSON files in the root
  const rootJsonFiles = results.files.filter(file => 
    file.path.match(/^\.\/[^\/]+\.json$/) && 
    !COMMON_DEV_FILES.includes(path.basename(file.path))
  );
  
  console.log('\n=== JSON Files in Root Directory ===');
  if (rootJsonFiles.length > 0) {
    rootJsonFiles.forEach(file => {
      console.log(`${file.path} (${formatBytes(file.size)})`);
    });
  } else {
    console.log('No JSON files found in root directory.');
  }
  
  // Check for shell scripts in the root
  const rootShellScripts = results.files.filter(file => 
    file.path.match(/^\.\/[^\/]+\.sh$/)
  );
  
  console.log('\n=== Shell Scripts in Root Directory ===');
  if (rootShellScripts.length > 0) {
    rootShellScripts.forEach(file => {
      console.log(`${file.path} (${formatBytes(file.size)})`);
    });
  } else {
    console.log('No shell scripts found in root directory.');
  }
  
  console.log('\nScan complete. Review the results above to identify potential files for cleanup.');
  console.log('To clean up the identified files, run: node clean-project.js');
}

// Run the scan
scanProject().catch(error => {
  console.error('Scan failed:', error);
  process.exit(1);
});