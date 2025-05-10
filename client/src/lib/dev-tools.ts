// This file previously contained developer utilities for testing and debugging
// It has been simplified to maintain interface compatibility

import FlowLogger from './flow-logger';
import { shouldLog } from './debug-config';

/**
 * Simple stub implementation that maintains the same interface
 * This used to run flow tests but now just returns a success result
 */
export const runManualFlowTest = async (flowName: string, steps: Array<() => Promise<any>>): Promise<boolean> => {
  if (import.meta.env.DEV && shouldLog()) {
    console.log(`[INFO] Manual flow testing has been removed - requested test: ${flowName}`);
  }
  return Promise.resolve(true);
};

/**
 * Generates a stable code comment block for marking stable components
 * This functionality is still useful so it's kept intact
 */
export const generateStableCodeMarker = (componentName: string): string => {
  return `// ✅ WORKS EXACTLY AS INTENDED
// 🚫 DO NOT MODIFY WITHOUT FULL RETEST
// Component: ${componentName}`;
};

// Simplified development tools in window object
if (import.meta.env.DEV) {
  (window as any).vmb = (window as any).vmb || {};
  (window as any).vmb.devTools = {
    runManualFlowTest,
    generateStableCodeMarker,
    
    // Simplified logging methods
    logFlow: (component: string, step: string, data?: any) => {
      FlowLogger.log(component, step, data);
    },
    
    logSuccess: (component: string, step: string, data?: any) => {
      FlowLogger.success(component, step, data);
    },
    
    logError: (component: string, step: string, error: any) => {
      FlowLogger.error(component, step, error);
    },
    
    // These now just log info messages instead of running tests
    runSalonInvitationTest: () => {
      console.log('[INFO] Test flows have been removed from this version');
    },
    
    runClientInvitationTest: () => {
      console.log('[INFO] Test flows have been removed from this version');
    },
    
    // Simplified help command
    help: () => {
      console.log('VMB Developer Tools');
      console.log('Note: Test flows have been removed from this version');
      console.log('Available utilities:');
      console.log('  - generateStableCodeMarker(name): Creates a stable code marker');
    }
  };
}

export default {
  runManualFlowTest,
  generateStableCodeMarker
};