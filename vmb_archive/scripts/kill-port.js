/**
 * Process Killer Script for Port 5000
 */
import { exec } from 'child_process';

const PORT = 5000;

console.log(`Attempting to kill process on port ${PORT}...`);

// Try multiple commands to find the process
const commands = [
  `ps aux | grep node | grep -v grep`,
  `ps aux | grep tsx | grep -v grep`,
  `ps aux | grep server | grep -v grep`
];

for (const cmd of commands) {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.log(`Error executing command: ${cmd}`);
      return;
    }
    
    if (stdout) {
      console.log('Found potential processes:');
      console.log(stdout);
      
      // Get PIDs
      const lines = stdout.split('\n').filter(line => line.trim() !== '');
      const pids = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        return parts[1];
      });
      
      if (pids.length > 0) {
        console.log(`Found PIDs: ${pids.join(', ')}`);
        
        // Kill each PID
        pids.forEach(pid => {
          exec(`kill -9 ${pid}`, (err, out, stdErr) => {
            if (err) {
              console.log(`Error killing process ${pid}: ${err}`);
            } else {
              console.log(`Successfully killed process ${pid}`);
            }
          });
        });
      }
    }
  });
}

// Final attempt using fuser (may not work in all environments)
exec(`fuser -k ${PORT}/tcp`, (error, stdout, stderr) => {
  if (error) {
    console.log(`Error using fuser: ${error.message}`);
    return;
  }
  
  if (stdout) {
    console.log(`fuser output: ${stdout}`);
  }
});

console.log('Port kill operation attempted. Please restart the workflow.');