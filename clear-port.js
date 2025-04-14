
import { ensurePortAvailable } from './server/monitor-ports.js';

async function clearPort() {
  console.log('Clearing port 5000...');
  await ensurePortAvailable(5000);
  console.log('Port 5000 is now available');
  process.exit(0);
}

clearPort();
