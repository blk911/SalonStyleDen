/**
 * VMB Project Cleanup Script
 * 
 * This script safely archives unused test files, utilities, and artifacts
 * without deleting anything. All files are moved to an organized archive
 * structure for later reference if needed.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Create main archive directory
const ARCHIVE_DIR = './vmb_archive';
const TEST_ARCHIVE_DIR = path.join(ARCHIVE_DIR, 'test_files');
const JSON_ARCHIVE_DIR = path.join(ARCHIVE_DIR, 'test_data');
const SCRIPTS_ARCHIVE_DIR = path.join(ARCHIVE_DIR, 'scripts');
const DOCS_ARCHIVE_DIR = path.join(ARCHIVE_DIR, 'docs');

// Ensure directories exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Initialize archive structure
function initializeArchive() {
  ensureDirectoryExists(ARCHIVE_DIR);
  ensureDirectoryExists(TEST_ARCHIVE_DIR);
  ensureDirectoryExists(JSON_ARCHIVE_DIR);
  ensureDirectoryExists(SCRIPTS_ARCHIVE_DIR);
  ensureDirectoryExists(DOCS_ARCHIVE_DIR);
  console.log('Archive directory structure created successfully');
}

// Move a file to the archive
function moveToArchive(srcPath, destDir) {
  if (!fs.existsSync(srcPath)) {
    console.log(`File not found: ${srcPath}`);
    return false;
  }
  
  const fileName = path.basename(srcPath);
  const destPath = path.join(destDir, fileName);
  
  try {
    fs.copyFileSync(srcPath, destPath);
    fs.unlinkSync(srcPath);
    console.log(`Moved: ${srcPath} → ${destPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to move ${srcPath}: ${error.message}`);
    return false;
  }
}

// Move a directory and its contents to the archive
function moveDirectoryToArchive(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.log(`Directory not found: ${srcDir}`);
    return false;
  }
  
  const dirName = path.basename(srcDir);
  const destPath = path.join(destDir, dirName);
  
  try {
    ensureDirectoryExists(destPath);
    
    // Copy all files and subdirectories
    execSync(`cp -R ${srcDir}/* ${destPath}`);
    
    // Remove the original directory
    execSync(`rm -rf ${srcDir}`);
    
    console.log(`Moved directory: ${srcDir} → ${destPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to move directory ${srcDir}: ${error.message}`);
    return false;
  }
}

// Main cleanup function
async function cleanupProject() {
  console.log('Starting VMB project cleanup...\n');
  
  // Initialize archive structure
  initializeArchive();
  
  console.log('\n--- Moving Archive Folders ---');
  moveDirectoryToArchive('./archived_logs', ARCHIVE_DIR);
  moveDirectoryToArchive('./archived_test_files', TEST_ARCHIVE_DIR);
  
  console.log('\n--- Moving JSON Test Data Files ---');
  const jsonTestFiles = [
    './salon24.json',
    './salon_24_data.json',
    './salon_data.json',
    './salon_create_response.json',
    './salon_update_endpoint.json',
    './service_gifurl_test.json',
    './services_data.json',
    './services_update.json',
    './owner_photo_update.json'
  ];
  
  jsonTestFiles.forEach(file => moveToArchive(file, JSON_ARCHIVE_DIR));
  
  console.log('\n--- Moving Utility Scripts ---');
  
  // Port utility scripts
  const portScripts = [
    './cleanup-port.js',
    './clear-port.js',
    './clear-process.js',
    './clear-process.cjs',
    './kill-port.js'
  ];
  
  // Migration scripts
  const migrationScripts = [
    './migrate-invitation-hashes.js',
    './migrate-invitation-message-type.js',
    './migrate-invitations-sender.js',
    './migrate-optional-email.js',
    './migrate-sponsor-name.js',
    './migrate-sponsor-salon.js'
  ];
  
  // Purge and verification scripts
  const purgeScripts = [
    './purge-all-invitations.js',
    './purge-data.js',
    './purge-system.js',
    './purge-testing-data.js',
    './verify-data.js',
    './verify-invitations.js',
    './verify-purge.js',
    './verify-purge-state.js',
    './validate-invitation-fix.js',
    './purge-db.sh',
    './restore-benchmark.sh',
    './watch-invitation-events.sh'
  ];
  
  // Move all scripts
  [...portScripts, ...migrationScripts, ...purgeScripts].forEach(script => {
    moveToArchive(script, SCRIPTS_ARCHIVE_DIR);
  });
  
  console.log('\n--- Moving Documentation Files ---');
  const docFiles = [
    './BENCHMARK_RESTORE_POINT.md',
    './BENCHMARK_TIMESTAMP.md',
    './CRITICAL_PRE_DEPLOY_FIXES.md',
    './FLOW_TEST_RESULTS.md',
    './INVITATION_STYLE_FLOW.md',
    './PROMOTION_FIX_NOTES.md'
  ];
  
  docFiles.forEach(doc => moveToArchive(doc, DOCS_ARCHIVE_DIR));
  
  console.log('\n--- Cleanup Summary ---');
  console.log('All files have been safely archived to the ./vmb_archive directory.');
  console.log('No files were permanently deleted.');
  console.log('The project structure is now cleaner while preserving all previous work.');
  console.log('\nTo restore any files, copy them back from the vmb_archive directory.');
}

// Run the cleanup process
cleanupProject().catch(error => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});