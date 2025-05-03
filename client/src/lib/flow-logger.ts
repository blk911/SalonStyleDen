// ✅ WORKS EXACTLY AS INTENDED
// 🚫 DO NOT MODIFY WITHOUT FULL RETEST
// Module: flow-logger.ts - Standard logging format for application flows

import { shouldLog } from './debug-config';

/**
 * Flow Logger - Standardized logging system for the VMB application
 * 
 * This utility provides consistent logging patterns for tracking
 * application processes and workflows.
 */
class FlowLogger {
  private static activeFlows: Record<string, { startTime: number, steps: string[] }> = {};
  
  /**
   * Start tracking a new flow
   * @param flowName Unique identifier for this flow
   */
  static startFlow(flowName: string): void {
    this.activeFlows[flowName] = {
      startTime: Date.now(),
      steps: []
    };
    
    if (shouldLog()) {
      console.log(`[FLOW][${flowName}] Flow started`);
    }
  }
  
  /**
   * Log a step in an active flow
   * @param component The component/module name initiating the log
   * @param step Description of the step being logged
   * @param data Optional data to include in the log
   */
  static log(component: string, step: string, data?: any): void {
    if (shouldLog()) {
      console.log(`[FLOW][${component}] ${step}`, data || '');
    }
  }
  
  /**
   * Log a successful step in an active flow
   * @param component The component/module name initiating the log
   * @param step Description of the successful step
   * @param data Optional data to include in the log
   */
  static success(component: string, step: string, data?: any): void {
    if (shouldLog()) {
      console.log(`[FLOW:SUCCESS][${component}] ${step}`, data || '');
    }
  }
  
  /**
   * Log an error in an active flow
   * @param component The component/module name initiating the log
   * @param step Description of the step that failed
   * @param error The error that occurred
   */
  static error(component: string, step: string, error: any): void {
    // Always log errors for debugging, regardless of shouldLog setting
    console.error(`[FLOW:ERROR][${component}] ${step}`, error);
  }
  
  /**
   * End an active flow with success or failure status
   * @param flowName The name of the flow to end
   * @param success Whether the flow completed successfully
   */
  static endFlow(flowName: string, success: boolean): void {
    const flow = this.activeFlows[flowName];
    if (!flow) {
      if (shouldLog()) {
        console.warn(`[FLOW:WARNING] Attempted to end flow "${flowName}" which was not started`);
      }
      return;
    }
    
    const duration = Date.now() - flow.startTime;
    
    if (success && shouldLog()) {
      console.log(`[FLOW:SUCCESS][${flowName}] Flow completed successfully (duration: ${duration}ms)`);
    } else if (!success) {
      // Always log errors
      console.error(`[FLOW:ERROR][${flowName}] Flow failed (duration: ${duration}ms)`);
    }
    
    delete this.activeFlows[flowName];
  }
  
  /**
   * Log a custom flow marker with a specific status
   * @param component The component/module name 
   * @param marker The marker name/label
   * @param status Status of the marker (success, warning, error)
   * @param data Optional data to include with the marker
   */
  static marker(component: string, marker: string, status: 'success' | 'warning' | 'error', data?: any): void {
    if (status === 'error' || shouldLog()) {
      const prefix = status === 'success' 
        ? '[FLOW:SUCCESS]' 
        : status === 'warning' 
          ? '[FLOW:WARNING]' 
          : '[FLOW:ERROR]';
      
      console.log(`${prefix}[${component}] ${marker}`, data || '');
    }
  }
}

export default FlowLogger;