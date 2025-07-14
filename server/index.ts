import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import { startupMonitor } from './startup-monitor'; // Import the startup monitor utility
import { EventEmitter } from 'events';

// Increase the default max listeners to prevent warnings
EventEmitter.defaultMaxListeners = 20;


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

  // Start server on port 5000 or environment PORT
  const basePort = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  
  // Function to find and use available port
  async function startServerOnAvailablePort(startPort: number, maxAttempts: number = 5): Promise<void> {
    const { default: killPort } = await import('kill-port');
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const port = startPort + attempt;
      
      try {
        // First try to kill any process on this port
        await killPort(port);
        log(`Cleaned up port ${port}`);
        
        // Wait for port to be fully released
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Attempt to start server on this port
        await new Promise<void>((resolve, reject) => {
          const serverInstance = server.listen({
            port,
            host: "0.0.0.0",
          }, () => {
            log(`Server is running on port ${port}`);
            resolve();
          }).on('error', (error: any) => {
            if (error.code === 'EADDRINUSE') {
              log(`Port ${port} still in use, trying next port...`);
              reject(new Error(`Port ${port} in use`));
            } else {
              console.error('Server startup error:', error);
              process.exit(1);
            }
          });
        });
        
        // If we get here, server started successfully
        return;
        
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          console.error(`Failed to start server after ${maxAttempts} attempts`);
          process.exit(1);
        }
        // Continue to next port
      }
    }
  }
  
  // Start the server
  await startServerOnAvailablePort(basePort);

  // Simple startup verification - only after successful server start
  setTimeout(() => {
    startupMonitor.verifyService('HTTP Server', async () => {
      return true; // Server is running if we get here
    });
    startupMonitor.logStatus();
  }, 1000); // Wait 1 second to ensure server is fully started
})();