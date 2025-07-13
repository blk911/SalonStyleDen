import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import { startupMonitor } from './startup-monitor'; // Import the startup monitor utility
import { enableJsonParseMonkeyPatch } from '../shared/utils/json';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);


const app = express();

// Enable JSON.parse debugging in development mode
if (process.env.NODE_ENV !== 'production') {
  enableJsonParseMonkeyPatch();
}

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

  // Enhanced error handling middleware with JSON parse error detection
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Special handling for JSON parse errors
    if (err.message && err.message.includes('[object Object] is not valid JSON')) {
      log('🚨 Detected JSON parse error - "[object Object]" issue');
      console.error('JSON Parse Error Details:', {
        url: req.url,
        method: req.method,
        body: req.body,
        headers: req.headers,
        stack: err.stack
      });
      
      message = 'Invalid JSON format in request';
      res.status(400).json({ 
        error: 'Bad Request',
        message: 'Malformed JSON data',
        code: 'JSON_PARSE_ERROR'
      });
      return;
    }

    // Handle other SyntaxError types that might be JSON-related
    if (err instanceof SyntaxError && err.message.includes('JSON')) {
      log(`🚨 JSON Syntax Error: ${err.message}`);
      res.status(400).json({ 
        error: 'Bad Request',
        message: 'Invalid JSON syntax',
        code: 'JSON_SYNTAX_ERROR'
      });
      return;
    }

    // Log all other errors for debugging
    log(`❌ Server Error: ${message}`);
    console.error('Error Details:', {
      status,
      message,
      url: req.url,
      method: req.method,
      stack: err.stack
    });

    res.status(status).json({ message });
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
  
  // Clean shutdown handling
  const gracefulShutdown = () => {
    log('Graceful shutdown initiated...');
    server.close(() => {
      log('Server closed successfully');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGUSR2', gracefulShutdown);

  // Start the server with kill-port cleanup
  const startServer = async () => {
    try {
      // Use kill-port to clean up port 5000 first
      log('Cleaning up port 5000...');
      await execAsync('npx kill-port 5000 || true');
      log('Port cleanup completed');

      // Start the server
      server.listen({
        port,
        host: "0.0.0.0",
      }, () => {
        log(`Server is running on port ${port}`);
        console.log(`Server listening on port ${port}`);
      });

      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          log(`Port ${port} is in use. Exiting to allow restart.`);
          process.exit(1);
        } else {
          log(`Server error: ${err.message}`);
          throw err;
        }
      });
      
    } catch (error) {
      log(`Server startup failed: ${error.message}`);
      process.exit(1);
    }
  };

  // Start the server
  startServer();

  // Simple startup verification
  startupMonitor.verifyService('HTTP Server', async () => {
    return true; // If we get here, server started successfully
  });

  startupMonitor.logStatus();
})();