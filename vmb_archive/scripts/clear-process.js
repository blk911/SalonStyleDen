#!/usr/bin/env node

// Simple script to clear a process on port 5000
const { execSync } = require('child_process');

const PORT = 5000;

try {
  console.log(`Finding process using port ${PORT}...`);
  
  // For Linux/macOS
  const findCommand = `lsof -i :${PORT} -t`;
  
  try {
    const pid = execSync(findCommand).toString().trim();
    
    if (pid) {
      console.log(`Found process ${pid} using port ${PORT}, killing it...`);
      execSync(`kill -9 ${pid}`);
      console.log(`Process ${pid} killed successfully`);
    } else {
      console.log(`No process found using port ${PORT}`);
    }
  } catch (err) {
    // If lsof didn't find any process, that's fine
    console.log(`No process found using port ${PORT}`);
  }
} catch (error) {
  console.error('Error:', error.message);
}