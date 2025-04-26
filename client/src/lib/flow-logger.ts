// ✅ WORKS EXACTLY AS INTENDED
// 🚫 DO NOT MODIFY WITHOUT FULL RETEST
// Module: flow-logger.ts - Centralized flow tracing utility

/**
 * FlowLogger - Utility for tracing application flows and critical paths
 * 
 * Used to track and debug the execution of important workflows in the application.
 * This creates a standard pattern for logging flow steps and helps with debugging.
 */
export const FlowLogger = {
  /**
   * Log a standard flow step
   * @param component - The component/module name
   * @param step - The specific step being executed
   * @param data - Optional data to log with the step
   */
  log: (component: string, step: string, data?: any): void => {
    console.log(`[FLOW][${component}] ${step}`, data ? data : '');
  },

  /**
   * Log an error in the flow
   * @param component - The component/module name
   * @param step - The step where the error occurred
   * @param error - The error that occurred
   */
  error: (component: string, step: string, error: any): void => {
    console.error(`[FLOW:ERROR][${component}] ${step}`, error);
  },

  /**
   * Log a warning in the flow
   * @param component - The component/module name
   * @param step - The step where the warning occurred
   * @param data - Optional data to log with the warning
   */
  warn: (component: string, step: string, data?: any): void => {
    console.warn(`[FLOW:WARN][${component}] ${step}`, data ? data : '');
  },

  /**
   * Log a successful completion of a flow step
   * @param component - The component/module name
   * @param step - The successfully completed step
   * @param data - Optional data to log with the success
   */
  success: (component: string, step: string, data?: any): void => {
    console.log(`[FLOW:SUCCESS][${component}] ${step}`, data ? data : '');
  },

  /**
   * Start tracking a new flow
   * @param flowName - The name of the flow being started
   */
  startFlow: (flowName: string): void => {
    console.log(`[FLOW:START] ===== ${flowName.toUpperCase()} FLOW STARTED =====`);
  },

  /**
   * End tracking of a flow
   * @param flowName - The name of the flow being ended
   * @param success - Whether the flow completed successfully
   */
  endFlow: (flowName: string, success: boolean): void => {
    if (success) {
      console.log(`[FLOW:END] ===== ${flowName.toUpperCase()} FLOW COMPLETED SUCCESSFULLY ✅ =====`);
    } else {
      console.log(`[FLOW:END] ===== ${flowName.toUpperCase()} FLOW FAILED ❌ =====`);
    }
  }
};

export default FlowLogger;