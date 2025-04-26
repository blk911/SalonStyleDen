// ✅ WORKS EXACTLY AS INTENDED
// 🚫 DO NOT MODIFY WITHOUT FULL RETEST
// Module: test-flows/index.ts - Entry point for test flows

import FlowLogger from '../flow-logger';
import salonInvitationFlow from './salon-invitation-flow';
import clientInvitationFlow from './client-invitation-flow';

// Initialize test flows in development mode
export function initTestFlows() {
  if (import.meta.env.DEV) {
    FlowLogger.log('TestFlows', 'Initializing test flows in development environment');
    
    // Register test flows with global registry
    if ((window as any).vmb && (window as any).vmb.flowTests) {
      // Salon invitation flow
      (window as any).vmb.flowTests.registerTest('salonInvitation', salonInvitationFlow);
      
      // Client invitation flow
      (window as any).vmb.flowTests.registerTest('clientInvitation', clientInvitationFlow);
      
      FlowLogger.success('TestFlows', 'Test flows initialized successfully');
    }
  }
}

export { 
  salonInvitationFlow,
  clientInvitationFlow
};