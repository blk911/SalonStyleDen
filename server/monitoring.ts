import * as Sentry from '@sentry/node';

export function initServerMonitoring() {
  try {
    // Initialize Sentry
    Sentry.init({
      dsn: "https://5a59501e4c2214d841b1794ee7983c41@o4509136870834176.ingest.us.sentry.io/4509136882040832",
      environment: process.env.NODE_ENV || 'development',
      release: 'ven-me-baby@1.0.0',
    });
    
    console.log('Server monitoring initialized');
  } catch (error) {
    console.error('Failed to initialize server monitoring:', error);
  }
}

// Wrapper for capturing errors
export function captureServerError(error: Error, context?: Record<string, any>) {
  console.error('Server error:', error);
  
  Sentry.withScope((scope: any) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

// Create simplified middleware for Express
export function sentryRequestHandler(req: any, res: any, next: any) {
  try {
    // Add basic request information to Sentry scope
    Sentry.withScope((scope: any) => {
      scope.setExtra('url', req.url);
      scope.setExtra('method', req.method);
      scope.setExtra('headers', req.headers);
      
      if (req.user) {
        scope.setUser({ id: req.user.id });
      }
    });
    next();
  } catch (error) {
    next();
  }
}

export function sentryErrorHandler(err: any, req: any, res: any, next: any) {
  // Capture error in Sentry before passing it along
  Sentry.captureException(err);
  next(err);
}