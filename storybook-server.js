#!/usr/bin/env node

/**
 * Storybook Server for VMB Platform
 * Starts Storybook on port 6006 with proper configuration
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting VMB Storybook Server...');
console.log('📖 Component documentation and interactive examples');

const storybook = spawn('npx', ['storybook', 'dev', '-p', '6006', '--host', '0.0.0.0', '--no-open'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

storybook.on('close', (code) => {
  console.log(`Storybook process exited with code ${code}`);
});

storybook.on('error', (error) => {
  console.error('Failed to start Storybook:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📚 Shutting down Storybook server...');
  storybook.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  storybook.kill('SIGTERM');
  process.exit(0);
});