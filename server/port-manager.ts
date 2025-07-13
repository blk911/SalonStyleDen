/**
 * Port Management Tool
 * Handles port conflicts and ensures clean server startup
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { log } from './vite';

const execAsync = promisify(exec);

export class PortManager {
  private static instance: PortManager;
  private port: number;

  constructor(port: number = 5000) {
    this.port = port;
  }

  static getInstance(port: number = 5000): PortManager {
    if (!PortManager.instance) {
      PortManager.instance = new PortManager(port);
    }
    return PortManager.instance;
  }

  /**
   * Kill any processes using the specified port
   */
  async killProcessOnPort(): Promise<void> {
    try {
      log(`🔄 Checking for processes on port ${this.port}...`);
      
      // Kill all tsx and node processes related to server
      const commands = [
        'pkill -f "tsx server/index.ts" 2>/dev/null || true',
        'pkill -f "node.*server/index.ts" 2>/dev/null || true',
        `fuser -k ${this.port}/tcp 2>/dev/null || true`,
        `lsof -ti:${this.port} | xargs kill -9 2>/dev/null || true`,
        `pkill -f ".*:${this.port}" 2>/dev/null || true`
      ];

      for (const cmd of commands) {
        try {
          await execAsync(cmd);
          log(`✅ Executed: ${cmd}`);
        } catch (error) {
          // Ignore errors - these commands are expected to fail sometimes
        }
      }

      // Wait for processes to be killed
      await new Promise(resolve => setTimeout(resolve, 2000));
      log(`✅ Port ${this.port} cleanup completed`);
    } catch (error) {
      log(`⚠️ Port cleanup warning: ${error.message}`);
    }
  }

  /**
   * Check if port is available
   */
  async isPortAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(false);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(true);
      });
      
      server.listen(this.port, '0.0.0.0');
    });
  }

  /**
   * Wait for port to become available
   */
  async waitForPortAvailable(maxRetries: number = 10): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      const available = await this.isPortAvailable();
      if (available) {
        log(`✅ Port ${this.port} is available`);
        return true;
      }
      
      log(`⏳ Port ${this.port} not available, retrying in 500ms... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    log(`❌ Port ${this.port} still not available after ${maxRetries} retries`);
    return false;
  }

  /**
   * Force clear the port and ensure it's available
   */
  async ensurePortAvailable(): Promise<boolean> {
    log(`🚀 Ensuring port ${this.port} is available...`);
    
    // First kill any existing processes
    await this.killProcessOnPort();
    
    // Wait for port to become available
    const available = await this.waitForPortAvailable();
    
    if (!available) {
      log(`❌ Unable to free port ${this.port} after cleanup attempts`);
      return false;
    }
    
    log(`✅ Port ${this.port} is ready for use`);
    return true;
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown(server: any): void {
    const gracefulShutdown = () => {
      log('🛑 Graceful shutdown initiated...');
      server.close(() => {
        log('✅ Server closed successfully');
        process.exit(0);
      });
    };

    // Handle various shutdown signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGUSR2', gracefulShutdown); // For nodemon restarts
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      log(`❌ Uncaught exception: ${error.message}`);
      gracefulShutdown();
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      log(`❌ Unhandled rejection at ${promise}, reason: ${reason}`);
      gracefulShutdown();
    });
  }
}

export const portManager = PortManager.getInstance(5000);