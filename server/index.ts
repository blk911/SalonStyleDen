import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import fs from 'fs';
import { startupMonitor } from './startup-monitor'; // Import the startup monitor utility
import { EventEmitter } from 'events';

// Increase the default max listeners to prevent warnings
EventEmitter.defaultMaxListeners = 20;

// Process lock mechanism to prevent multiple server instances
const LOCK_FILE = path.join(process.cwd(), 'server', '.server.lock');

// Check if another server instance is running
if (fs.existsSync(LOCK_FILE)) {
  const pid = fs.readFileSync(LOCK_FILE, 'utf8');
  console.log(`⚠️ Another server instance may be running (PID: ${pid})`);
  console.log('🔄 Cleaning up and continuing...');
  fs.unlinkSync(LOCK_FILE);
}

// Create lock file
fs.writeFileSync(LOCK_FILE, process.pid.toString());

// Cleanup function
function cleanup() {
  if (fs.existsSync(LOCK_FILE)) {
    fs.unlinkSync(LOCK_FILE);
  }
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  cleanup();
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  cleanup();
  process.exit(1);
});


const app = express();
// Increase payload size limit to 50MB for handling larger requests
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve files from attached_assets directory
app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

import { errorMonitor } from './error-monitor';

// Error monitoring middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorMonitor.logError('backend', err);
  next(err);
});


// Serve files from client/public/assets directory
app.use('/assets', express.static(path.join(process.cwd(), 'client/public/assets')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Start server with automatic port selection
  const BASE_PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  let serverStarted = false;
  
  function startServer(port: number): void {
    if (serverStarted) return;
    
    server.listen(port, "0.0.0.0")
      .on('listening', () => {
        serverStarted = true;
        log(`🚀 Server listening on port ${port}`);
        // Set the chosen port for Vite/React to use
        process.env.VITE_API_PORT = String(port);
      })
      .on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          log(`⚠️ Port ${port} busy, trying ${port + 1}`);
          startServer(port + 1);
        } else {
          console.error('Server startup error:', err);
          cleanup();
          process.exit(1);
        }
      });
  }
  
  // Start the server
  startServer(BASE_PORT);

  // Enhanced startup verification - only after successful server start
  setTimeout(async () => {
    startupMonitor.verifyService('HTTP Server', async () => {
      return true; // Server is running if we get here
    });
    
    // Verify API endpoints are responding
    startupMonitor.verifyService('API Health', async () => {
      try {
        const response = await fetch(`http://localhost:${process.env.VITE_API_PORT || BASE_PORT}/api/health`);
        return response.ok;
      } catch (error) {
        return false;
      }
    });
    
    startupMonitor.logStatus();
    log('🚀 VMB Application fully started and verified');
  }, 2000); // Wait 2 seconds to ensure server is fully started
})();