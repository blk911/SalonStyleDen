// ✅ WORKS EXACTLY AS INTENDED
// 🚫 DO NOT MODIFY WITHOUT FULL RETEST
// Module: flow-tester.ts - Automated flow testing and verification

import FlowLogger from './flow-logger';

export interface TestStep {
  id: string;
  description: string;
  execute: () => Promise<any>;
  verify: (result: any) => boolean;
}

/**
 * Run a complete flow test and log results
 * This simulates a user going through all the steps of a particular flow
 * 
 * @param flowName The name of the flow to run
 * @param steps Array of test steps to execute and verify
 */
export async function runFlowTest(flowName: string, steps: TestStep[]): Promise<boolean> {
  FlowLogger.startFlow(`TEST_${flowName}`);
  
  try {
    FlowLogger.log('FlowTester', `Starting ${flowName} flow test with ${steps.length} steps`);
    
    for (const step of steps) {
      FlowLogger.log('FlowTester', `Executing step: ${step.id} - ${step.description}`);
      
      try {
        const result = await step.execute();
        const passed = step.verify(result);
        
        if (passed) {
          FlowLogger.success('FlowTester', `Step ${step.id} passed validation`);
        } else {
          FlowLogger.error('FlowTester', `Step ${step.id} failed validation`, result);
          throw new Error(`Validation failed for step ${step.id}`);
        }
      } catch (error) {
        FlowLogger.error('FlowTester', `Error in step ${step.id}`, error);
        throw error;
      }
    }
    
    FlowLogger.success('FlowTester', `${flowName} flow test completed successfully`);
    FlowLogger.endFlow(`TEST_${flowName}`, true);
    return true;
  } catch (error) {
    FlowLogger.error('FlowTester', `${flowName} flow test failed`, error);
    FlowLogger.endFlow(`TEST_${flowName}`, false);
    return false;
  }
}

/**
 * A simple mock implementation of a test step to simulate a user action
 * @param id Unique identifier for the step
 * @param description Human-readable description of what this step does
 * @param mockImplementation Function that implements the mock behavior
 * @param validationFn Function to validate the result of the mock
 */
export function createMockStep(
  id: string,
  description: string,
  mockImplementation: () => Promise<any>,
  validationFn: (result: any) => boolean
): TestStep {
  return {
    id,
    description,
    execute: mockImplementation,
    verify: validationFn
  };
}

/**
 * Create a test flow with sequential steps
 * @param flowName Name of the flow
 * @param steps Array of test steps
 * @returns A function that runs the flow test when called
 */
export function createTestFlow(flowName: string, steps: TestStep[]): () => Promise<boolean> {
  return async () => {
    return runFlowTest(flowName, steps);
  };
}

// Only expose testing utilities in development
if (import.meta.env.DEV) {
  (window as any).vmb = (window as any).vmb || {};
  (window as any).vmb.flowTests = {
    runFlowTest,
    createMockStep,
    createTestFlow,
    
    // Track available tests
    availableTests: new Set<string>(),
    
    // Register a test flow
    registerTest: (name: string, testFn: () => Promise<boolean>) => {
      const testRegistry = (window as any).vmb.flowTests;
      testRegistry.availableTests.add(name);
      testRegistry[name] = testFn;
    },
    
    // List all available tests
    listAvailableTests: () => {
      const testRegistry = (window as any).vmb.flowTests;
      console.log('%c VMB Flow Tests', 'background: #500; color: white; padding: 5px; border-radius: 3px;');
      console.log('Available tests:');
      testRegistry.availableTests.forEach((name: string) => {
        console.log(`  - ${name}: run with vmb.flowTests.${name}()`);
      });
    }
  };
  
  // Log that flow testing is available
  console.log('%c VMB Flow Testing Initialized', 'background: #500; color: white; padding: 5px; border-radius: 3px;');
  console.log('Type vmb.flowTests.listAvailableTests() to see available tests');
}

export default {
  runFlowTest,
  createMockStep,
  createTestFlow
};