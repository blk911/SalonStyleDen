#!/usr/bin/env node

// Simple script to clear a process on port 5000
const { execSync } = require('child_process');

const PORT = 5000;

try {
  console.log(`Finding process using port ${PORT}...`);
  
  // For Linux systems using ss command (available on most systems)
  const findCommand = `ss -lptn 'sport = :${PORT}'`;
  
  try {
    const output = execSync(findCommand).toString();
    console.log('Port scan output:', output);
    
    // Look for PIDs in the output
    const pidMatch = output.match(/pid=(\d+)/);
    if (pidMatch && pidMatch[1]) {
      const pid = pidMatch[1];
      console.log(`Found process ${pid} using port ${PORT}, killing it...`);
      execSync(`kill -9 ${pid}`);
      console.log(`Process ${pid} killed successfully`);
    } else {
      console.log(`No process found using port ${PORT} in ss output`);
      
      // Try an alternative approach using fuser
      try {
        const fuserOutput = execSync(`fuser -n tcp ${PORT} 2>/dev/null`).toString().trim();
        if (fuserOutput) {
          console.log(`Found processes using fuser: ${fuserOutput}`);
          execSync(`fuser -k -n tcp ${PORT}`);
          console.log(`Killed processes on port ${PORT}`);
        }
      } catch (fuserErr) {
        console.log('No processes found using fuser');
      }
    }
  } catch (err) {
    console.log(`Error running ss command: ${err.message}`);
    console.log('Attempting alternative methods...');
    
    // Try netstat if ss is not available
    try {
      const netstatOutput = execSync(`netstat -tlpn | grep :${PORT}`).toString();
      console.log('Netstat output:', netstatOutput);
      
      const netstatPidMatch = netstatOutput.match(/(\d+)\/\w+/);
      if (netstatPidMatch && netstatPidMatch[1]) {
        const pid = netstatPidMatch[1];
        console.log(`Found process ${pid} using port ${PORT}, killing it...`);
        execSync(`kill -9 ${pid}`);
        console.log(`Process ${pid} killed successfully`);
      }
    } catch (netstatErr) {
      console.log(`Error with netstat: ${netstatErr.message}`);
    }
  }
} catch (error) {
  console.error('Error:', error.message);
}