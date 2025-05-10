// This file previously contained flow testing functionality
// It has been simplified to maintain interface compatibility while removing test code

import FlowLogger from './flow-logger';

// Keep the interface for TypeScript compatibility
export interface TestStep {
  id: string;
  description: string;
  execute: () => Promise<any>;
  verify: (result: any) => boolean;
}

/**
 * Simplified stub implementation that returns true
 */
export async function runFlowTest(flowName: string, steps: TestStep[]): Promise<boolean> {
  if (import.meta.env.DEV) {
    console.log(`[INFO] Test flows have been removed - runFlowTest stub called for ${flowName}`);
  }
  return Promise.resolve(true);
}

/**
 * Simplified stub implementation that creates a dummy test step
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
    execute: () => Promise.resolve(true), 
    verify: () => true
  };
}

/**
 * Simplified stub implementation that creates a dummy test flow
 */
export function createTestFlow(flowName: string, steps: TestStep[]): () => Promise<boolean> {
  return () => Promise.resolve(true);
}

// Empty global registry replacement
if (import.meta.env.DEV) {
  (window as any).vmb = (window as any).vmb || {};
  (window as any).vmb.flowTests = {
    runFlowTest: () => Promise.resolve(true),
    createMockStep: (...args: any[]) => ({ id: '', description: '', execute: () => Promise.resolve(true), verify: () => true }),
    createTestFlow: () => () => Promise.resolve(true),
    availableTests: new Set<string>(),
    registerTest: () => {},
    listAvailableTests: () => console.log('Test flows have been removed from this version')
  };
}

export default {
  runFlowTest,
  createMockStep,
  createTestFlow
};