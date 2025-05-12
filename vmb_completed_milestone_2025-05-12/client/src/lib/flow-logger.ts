// This file previously contained advanced flow logging functionality
// It has been simplified to maintain interface compatibility while removing test code

import { shouldLog } from './debug-config';

/**
 * Simple logger that maintains the same interface as the original FlowLogger
 * but with minimal implementation to reduce complexity
 */
class FlowLogger {
  /**
   * Start tracking a new flow (stub method)
   */
  static startFlow(flowName: string): void {
    if (import.meta.env.DEV && shouldLog()) {
      console.log(`[${flowName}] Started`);
    }
  }
  
  /**
   * Log a step (simplified implementation)
   */
  static log(component: string, step: string, data?: any): void {
    if (import.meta.env.DEV && shouldLog()) {
      console.log(`[${component}] ${step}`, data || '');
    }
  }
  
  /**
   * Log a successful step (simplified implementation)
   */
  static success(component: string, step: string, data?: any): void {
    if (import.meta.env.DEV && shouldLog()) {
      console.log(`[${component}] Success: ${step}`, data || '');
    }
  }
  
  /**
   * Log an error (simplified implementation)
   */
  static error(component: string, step: string, error: any): void {
    if (import.meta.env.DEV) {
      console.error(`[${component}] Error: ${step}`, error);
    }
  }
  
  /**
   * End a flow (stub method)
   */
  static endFlow(flowName: string, success: boolean): void {
    if (import.meta.env.DEV && shouldLog()) {
      console.log(`[${flowName}] ${success ? 'Completed successfully' : 'Failed'}`);
    }
  }
  
  /**
   * Log a marker (simplified implementation)
   */
  static marker(component: string, marker: string, status: 'success' | 'warning' | 'error', data?: any): void {
    if (import.meta.env.DEV && (status === 'error' || shouldLog())) {
      console.log(`[${component}] ${status.toUpperCase()}: ${marker}`, data || '');
    }
  }
}

export default FlowLogger;