// This file was previously used for test flows
// These have been simplified to maintain import compatibility

// Import the stub test flow implementations
import salonInvitationFlowImpl from './salon-invitation-flow';
import clientInvitationFlowImpl from './client-invitation-flow';
import invitationStatusFlowImpl from './invitation-status-flow';

// Empty initialization function
export function initTestFlows() {
  if (import.meta.env.DEV) {
    console.log('[INFO] Test flows have been removed from this version');
  }
}

// Export the test flow stubs
export const salonInvitationFlow = salonInvitationFlowImpl;
export const clientInvitationFlow = clientInvitationFlowImpl;
export const invitationStatusFlow = invitationStatusFlowImpl;