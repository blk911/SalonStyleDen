import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import fs from 'fs';
import { startupMonitor } from './startup-monitor';
import { EventEmitter } from 'events';
import http from 'http';

// Increase the default max listeners to prevent warnings
EventEmitter.defaultMaxListeners = 20;

// Enhanced port cleanup utility using kill-port package
async function killPortProcesses(port: number): Promise<void> {
  try {
    // @ts-ignore
    const killPort = await import('kill-port');
    await killPort.default(port);
    // Small delay to ensure port is freed
    await new Promise(resolve => setTimeout(resolve, 200));
  } catch (error) {
    // Ignore errors - port might already be free
  }
}

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

  // Simplified server startup
  const TARGET_PORT = 5000;
  
  // Clean up port 5000 first
  log(`🧹 Ensuring port ${TARGET_PORT} is available...`);
  await killPortProcesses(TARGET_PORT);
  
  // Set environment variables
  process.env.VITE_API_PORT = String(TARGET_PORT);
  process.env.PORT = String(TARGET_PORT);
  
  // Simple server startup with single instance protection
  let serverStarted = false;
  
  server.on('error', (err: any) => {
    if (!serverStarted && err.code === 'EADDRINUSE') {
      log(`⚠️ Port ${TARGET_PORT} busy, trying port ${TARGET_PORT + 1}...`);
      serverStarted = true;
      
      // Try next port
      server.listen(TARGET_PORT + 1, "0.0.0.0", () => {
        log(`🚀 Server listening on port ${TARGET_PORT + 1}`);
        log(`📍 API endpoint: http://localhost:${TARGET_PORT + 1}`);
        log(`✅ Server started successfully on fallback port`);
        
        // Update environment variables
        process.env.VITE_API_PORT = String(TARGET_PORT + 1);
        process.env.PORT = String(TARGET_PORT + 1);
        
        // Health check after startup
        setTimeout(async () => {
          try {
            const response = await fetch(`http://localhost:${TARGET_PORT + 1}/api/health`);
            if (response.ok) {
              log('✅ Server health check passed');
              log('🚀 VMB Application ready for connections');
            }
          } catch (error) {
            log('⚠️ Server health check error:', String(error));
          }
        }, 500);
      });
    } else if (!serverStarted) {
      console.error('Server startup error:', err);
      process.exit(1);
    }
    // Ignore errors if server already started
  });
  
  server.listen(TARGET_PORT, "0.0.0.0", () => {
    if (!serverStarted) {
      serverStarted = true;
      log(`🚀 Server listening on port ${TARGET_PORT}`);
      log(`📍 API endpoint: http://localhost:${TARGET_PORT}`);
      log(`✅ Server started successfully`);
      
      // Update environment variables
      process.env.VITE_API_PORT = String(TARGET_PORT);
      process.env.PORT = String(TARGET_PORT);
      
      // Health check after startup
      setTimeout(async () => {
        try {
          const response = await fetch(`http://localhost:${TARGET_PORT}/api/health`);
          if (response.ok) {
            log('✅ Server health check passed');
            log('🚀 VMB Application ready for connections');
          }
        } catch (error) {
          log('⚠️ Server health check error:', String(error));
        }
      }, 500);
    }
  });
})();
