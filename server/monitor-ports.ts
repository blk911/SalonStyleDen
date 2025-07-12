
import { log } from './vite';
import * as net from 'net';

export function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '0.0.0.0');
  });
}

export async function findAvailablePort(startPort: number): Promise<number> {
  for (let port = startPort; port < startPort + 100; port++) {
    if (await checkPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

export async function ensurePortAvailable(port: number): Promise<number> {
  try {
    const isAvailable = await checkPortAvailable(port);
    if (isAvailable) {
      log(`Port ${port} is available`);
      return port;
    } else {
      log(`Port ${port} is in use, finding alternative...`);
      const alternativePort = await findAvailablePort(port + 1);
      log(`Using port ${alternativePort} instead`);
      return alternativePort;
    }
  } catch (error) {
    log(`Error managing port ${port}: ${error}`);
    throw error;
  }
}
