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

  // Try to use port 5000 first, but fallback to alternative ports if necessary
  // These ports are accessible in Replit
  const PRIMARY_PORT = 5000;
  const FALLBACK_PORTS = [3000, 8080, 8000];
  let currentPortIndex = -1;
  
  // Function to try the next available port
  const tryNextPort = async (): Promise<{ success: boolean, port: number }> => {
    currentPortIndex++;
    
    // Try the primary port first, then fallbacks
    const port = currentPortIndex === 0 ? PRIMARY_PORT : 
                 currentPortIndex <= FALLBACK_PORTS.length ? FALLBACK_PORTS[currentPortIndex - 1] : null;
    
    // If we've tried all ports, give up
    if (port === null) {
      log(`All ports are in use. Server could not start.`);
      return { success: false, port: 0 };
    }
    
    return new Promise((resolve) => {
      log(`Attempting to start server on port ${port}...`);
      
      // Set up error handler before trying to listen
      const errorHandler = (error: any) => {
        server.removeListener('error', errorHandler);
        
        if (error.code === 'EADDRINUSE') {
          log(`Port ${port} is already in use. Trying another port...`);
          // Try the next port
          tryNextPort().then(resolve);
        } else {
          log(`Server error: ${error.message}`);
          resolve({ success: false, port });
        }
      };
      
      server.once('error', errorHandler);
      
      server.listen({
        port,
        host: "0.0.0.0",
      }, () => {
        log(`Server successfully started on port ${port}`);
        // Remove the error handler since we successfully started
        server.removeListener('error', errorHandler);
        resolve({ success: true, port });
      });
    });
  };

  // Verify server startup
  await startupMonitor.verifyService('HTTP Server', async () => {
    const result = await tryNextPort();
    if (result.success) {
      process.env.PORT = result.port.toString();
      log(`Server is running on port ${result.port}`);
      return true;
    } else {
      log(`Failed to start server on any available port.`);
      return false;
    }
  });

  // Log startup status
  startupMonitor.logStatus();
})();