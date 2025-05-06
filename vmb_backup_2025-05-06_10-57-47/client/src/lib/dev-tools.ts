// ✅ WORKS EXACTLY AS INTENDED
// 🚫 DO NOT MODIFY WITHOUT FULL RETEST
// Module: dev-tools.ts - Developer utilities for testing and debugging

import FlowLogger from './flow-logger';
import { runFlowTest, TestStep } from './flow-tester';
import { shouldLog } from './debug-config';

/**
 * Run a complete sequential flow test manually
 * This simulates a user going through all the steps of a particular flow
 * 
 * @param flowName The name of the flow to run
 * @param steps Array of test steps to execute
 */
export const runManualFlowTest = async (flowName: string, steps: Array<() => Promise<any>>): Promise<boolean> => {
  FlowLogger.startFlow(`MANUAL_${flowName}`);
  
  try {
    FlowLogger.log('DevTools', `Starting manual ${flowName} flow test`);
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      FlowLogger.log('DevTools', `Executing ${flowName} step ${i + 1}/${steps.length}`);
      
      try {
        await step();
        FlowLogger.success('DevTools', `Completed ${flowName} step ${i + 1}/${steps.length}`);
      } catch (error) {
        FlowLogger.error('DevTools', `Error in ${flowName} step ${i + 1}/${steps.length}`, error);
        throw error;
      }
    }
    
    FlowLogger.success('DevTools', `${flowName} flow test completed successfully`);
    FlowLogger.endFlow(`MANUAL_${flowName}`, true);
    return true;
  } catch (error) {
    FlowLogger.error('DevTools', `${flowName} flow test failed`, error);
    FlowLogger.endFlow(`MANUAL_${flowName}`, false);
    return false;
  }
};

/**
 * Generates a stable code comment block for marking stable components
 */
export const generateStableCodeMarker = (componentName: string): string => {
  return `// ✅ WORKS EXACTLY AS INTENDED
// 🚫 DO NOT MODIFY WITHOUT FULL RETEST
// Component: ${componentName}`;
};

// Expose developer utilities to the window object in development environment
if (import.meta.env.DEV) {
  (window as any).vmb = (window as any).vmb || {};
  (window as any).vmb.devTools = {
    runManualFlowTest,
    generateStableCodeMarker,
    
    // Convenience methods
    logFlow: (component: string, step: string, data?: any) => {
      FlowLogger.log(component, step, data);
    },
    
    logSuccess: (component: string, step: string, data?: any) => {
      FlowLogger.success(component, step, data);
    },
    
    logError: (component: string, step: string, error: any) => {
      FlowLogger.error(component, step, error);
    },
    
    runSalonInvitationTest: () => {
      // This will call the fully automated test
      import('./test-flows/salon-invitation-flow').then(module => {
        module.default();
      });
    },
    
    runClientInvitationTest: () => {
      // This will call the fully automated test
      import('./test-flows/client-invitation-flow').then(module => {
        module.default();
      });
    },
    
    help: () => {
      console.log('%c VMB Developer Tools', 'background: #500; color: white; padding: 5px; border-radius: 3px; font-weight: bold;');
      console.log('Available commands:');
      console.log('  vmb.devTools.logFlow(component, step, data) - Log a flow step');
      console.log('  vmb.devTools.logSuccess(component, step, data) - Log a successful flow step');
      console.log('  vmb.devTools.logError(component, step, error) - Log a flow error');
      console.log('  vmb.devTools.runSalonInvitationTest() - Run salon invitation flow test');
      console.log('  vmb.devTools.runClientInvitationTest() - Run client invitation flow test');
      console.log('  vmb.devTools.runManualFlowTest(name, steps) - Run a custom flow test');
      console.log('  vmb.devTools.generateStableCodeMarker(name) - Generate a stable code marker');
      console.log('  vmb.flowTests.listAvailableTests() - List all available automated tests');
    }
  };
  
  // Log that dev tools are available - only if debug is enabled
  if (shouldLog()) {
    console.log('%c VMB Developer Tools Initialized', 'background: #500; color: white; padding: 5px; border-radius: 3px;');
    console.log('Type vmb.devTools.help() for available commands');
  }
}

export default {
  runManualFlowTest,
  generateStableCodeMarker
};