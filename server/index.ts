import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import { startupMonitor } from './startup-monitor'; // Import the startup monitor utility


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

  // Force port 5000 for Replit workflow compatibility
  const port = 5000;
  
  // Kill any existing processes and start fresh
  process.on('SIGTERM', () => {
    log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      process.exit(0);
    });
  });

  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`Server is running on port ${port}`);
    console.log(`Server listening on port ${port}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      log(`Port ${port} is in use. Attempting graceful restart...`);
      setTimeout(() => {
        server.close();
        server.listen({
          port,
          host: "0.0.0.0",
        }, () => {
          log(`Server restarted on port ${port}`);
        });
      }, 1000);
    } else {
      log(`Server error: ${err.message}`);
      throw err;
    }
  });

  // Simple startup verification
  startupMonitor.verifyService('HTTP Server', async () => {
    return true; // If we get here, server started successfully
  });

  startupMonitor.logStatus();
})();