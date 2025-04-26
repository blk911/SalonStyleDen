// ✅ WORKS EXACTLY AS INTENDED
// 🚫 DO NOT MODIFY WITHOUT FULL RETEST
// Module: flow-tester.ts - Test harness for critical flows

import FlowLogger from './flow-logger';

/**
 * Represents a single step in a flow test
 */
export interface TestStep {
  /** Name of the test step */
  name: string;
  
  /** Function that executes the test step */
  execute: () => Promise<any>;
  
  /** Optional validation function to verify the step executed correctly */
  validate?: (result: any) => boolean;
  
  /** Optional timeout in milliseconds */
  timeout?: number;
}

/**
 * Run a complete flow test with multiple steps
 * @param flowName - Name of the flow being tested
 * @param steps - Array of test steps to execute
 * @returns Promise resolving to success (true) or failure (false)
 */
export const runFlowTest = async (flowName: string, steps: TestStep[]): Promise<boolean> => {
  FlowLogger.startFlow(flowName);
  let stepResults: Record<string, any> = {};
  
  try {
    for (const step of steps) {
      FlowLogger.log('TestHarness', `Executing step: ${step.name}`);
      
      try {
        // Execute the step with timeout if specified
        let stepPromise = step.execute();
        if (step.timeout) {
          stepPromise = Promise.race([
            stepPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Step "${step.name}" timed out after ${step.timeout}ms`)), step.timeout)
            )
          ]);
        }
        
        const result = await stepPromise;
        stepResults[step.name] = result;
        
        // Validate the result if a validation function exists
        if (step.validate && !step.validate(result)) {
          throw new Error(`Validation failed for step: ${step.name}`);
        }
        
        FlowLogger.success('TestHarness', `Step completed: ${step.name}`);
      } catch (error) {
        FlowLogger.error('TestHarness', `Step failed: ${step.name}`, error);
        throw error;
      }
    }
    
    FlowLogger.endFlow(flowName, true);
    return true;
  } catch (err) {
    FlowLogger.error('TestHarness', `Flow failed: ${flowName}`, err);
    FlowLogger.endFlow(flowName, false);
    return false;
  }
};

/**
 * Simulates user interaction with elements
 */
export const TestUtils = {
  /**
   * Simulates clicking an element
   * @param selector - CSS selector for the element to click
   */
  click: async (selector: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const element = document.querySelector(selector);
          if (!element) {
            reject(new Error(`Element not found: ${selector}`));
            return;
          }
          
          (element as HTMLElement).click();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 100); // Small delay to allow UI to update
    });
  },
  
  /**
   * Simulates typing in an input field
   * @param selector - CSS selector for the input element
   * @param value - Value to type
   */
  type: async (selector: string, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const element = document.querySelector(selector) as HTMLInputElement;
          if (!element) {
            reject(new Error(`Input element not found: ${selector}`));
            return;
          }
          
          element.value = value;
          
          // Dispatch input event
          const inputEvent = new Event('input', { bubbles: true });
          element.dispatchEvent(inputEvent);
          
          // Dispatch change event
          const changeEvent = new Event('change', { bubbles: true });
          element.dispatchEvent(changeEvent);
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  },
  
  /**
   * Waits for an element to appear in the DOM
   * @param selector - CSS selector for the element to wait for
   * @param timeout - Maximum time to wait in milliseconds
   */
  waitForElement: async (selector: string, timeout = 5000): Promise<Element> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        const element = document.querySelector(selector);
        
        if (element) {
          resolve(element);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for element: ${selector}`));
          return;
        }
        
        setTimeout(checkElement, 100);
      };
      
      checkElement();
    });
  },
  
  /**
   * Simulates form submission
   * @param formSelector - CSS selector for the form
   */
  submitForm: async (formSelector: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const form = document.querySelector(formSelector) as HTMLFormElement;
          if (!form) {
            reject(new Error(`Form not found: ${formSelector}`));
            return;
          }
          
          // Create and dispatch submit event
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          const submitResult = form.dispatchEvent(submitEvent);
          
          if (!submitResult) {
            reject(new Error('Form submission was prevented by event handler'));
            return;
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  }
};

export default { runFlowTest, TestUtils };