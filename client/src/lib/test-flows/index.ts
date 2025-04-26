// ✅ WORKS EXACTLY AS INTENDED
// 🚫 DO NOT MODIFY WITHOUT FULL RETEST
// Module: test-flows/index.ts - Main entry point for all test flows

import testSalonInvitationFlow from './salon-invitation-flow';
import testClientInvitationFlow from './client-invitation-flow';
import FlowLogger from '../flow-logger';

/**
 * Collection of all available flow tests
 */
export const FlowTests = {
  testSalonInvitationFlow,
  testClientInvitationFlow,
};

/**
 * Initialize flow testing utilities in development environment
 * This attaches test functions to the window object for easy access
 * in the browser console.
 */
export const initializeTestFlows = (): void => {
  // Only initialize in development environment
  if (import.meta.env.DEV) {
    FlowLogger.log('TestFlows', 'Initializing test flows in development environment');
    
    // Create or get the VMB namespace on window
    const vmb = (window as any).vmb = (window as any).vmb || {};
    
    // Add test flows to vmb namespace
    vmb.flowTests = {
      runSalonInvitationTest: () => {
        FlowLogger.log('TestFlows', 'Running Salon Invitation Test via Console');
        return testSalonInvitationFlow();
      },
      
      runClientInvitationTest: () => {
        FlowLogger.log('TestFlows', 'Running Client Invitation Test via Console');
        return testClientInvitationFlow();
      },
      
      // Add developer utility functions
      listAvailableTests: () => {
        console.log('=== VMB Available Flow Tests ===');
        console.log('- vmb.flowTests.runSalonInvitationTest()');
        console.log('- vmb.flowTests.runClientInvitationTest()');
        console.log('');
        console.log('Example usage: await vmb.flowTests.runSalonInvitationTest()');
      }
    };
    
    FlowLogger.success('TestFlows', 'Test flows initialized successfully');
    
    // Log a helpful message to developers
    console.log('%c VMB Flow Testing Initialized', 'background: #500; color: white; padding: 5px; border-radius: 3px;');
    console.log('Type vmb.flowTests.listAvailableTests() to see available tests');
  }
};

export default FlowTests;