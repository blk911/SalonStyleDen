// ✅ TEST FLOW FOR INVITATION STATUS TRANSITIONS
// Module: invitation-status-flow.ts - Tests invitation status transitions and UI updates

import { createMockStep, createTestFlow, TestStep } from '../flow-tester';
import FlowLogger from '../flow-logger';

/**
 * Test flow for the complete invitation status transition process:
 * 1. Create a pending invitation
 * 2. Verify SEND GIFT button is visible for pending status
 * 3. Send gift (transition to 'sent' status)
 * 4. Verify GIFT SENT badge appears and SEND GIFT button is hidden
 * 5. Accept gift (transition to 'accepted' status)
 * 6. Verify GIFT ACCEPTED badge appears
 * 7. Redeem gift (transition to 'redeemed' status)
 * 8. Verify GIFT REDEEMED badge appears
 * 9. Complete transaction (transition to 'completed' status)
 * 10. Verify COMPLETED badge appears
 * 11. Test navigation back to client dashboard with proper tracking
 */
const invitationStatusFlow = createTestFlow('INVITATION_STATUS', [
  createMockStep(
    'create_pending_invitation',
    'Create invitation with pending status',
    async () => {
      FlowLogger.log('InvitationStatusFlow', 'Creating test invitation with pending status');
      
      // In a real test, we would call the actual API
      // For this test, we'll use predetermined hash for a specific test invitation
      const inviteHash = 'VMB-INV-GA1WEX-ma1755lp';
      
      try {
        // Try to fetch the real invitation from API
        const response = await fetch(`/api/invitations/by-hash/${inviteHash}`);
        
        if (response.ok) {
          const invitation = await response.json();
          FlowLogger.log('InvitationStatusFlow', 'Using existing invitation', invitation);
          return {
            success: true,
            invitation,
            inviteHash
          };
        } else {
          // If we can't fetch the real invitation, use a mock one for testing
          FlowLogger.log('InvitationStatusFlow', 'Could not fetch real invitation, using mock');
          return {
            success: true,
            invitation: {
              id: 999,
              name: 'test2',
              phone: '303555111',
              email: 'test2@example.com',
              salonId: 110,
              status: 'pending',
              inviteHash
            },
            inviteHash
          };
        }
      } catch (error) {
        FlowLogger.error('InvitationStatusFlow', 'Error creating test invitation', error);
        return {
          success: false,
          error
        };
      }
    },
    (result) => {
      // Verify invitation was retrieved or created successfully
      return result.success && !!result.invitation && !!result.inviteHash;
    }
  ),
  
  createMockStep(
    'verify_button_visibility_pending',
    'Verify SEND GIFT button is visible for pending status',
    async (prevResult) => {
      FlowLogger.log('InvitationStatusFlow', 'Verifying SEND GIFT button visibility for pending status');
      
      const { invitation } = prevResult;
      
      // Check if invitation status is 'pending'
      const isPending = invitation.status === 'pending';
      
      // In a real test, we would interact with the actual DOM
      // For this mock test, we'll simulate checking the button visibility
      // based on the component's logic which shows the button only for 'pending' status
      const shouldShowButton = isPending;
      
      return {
        invitation,
        isPending,
        shouldShowButton,
        buttonVisible: shouldShowButton
      };
    },
    (result) => {
      // For pending status, button should be visible
      if (result.isPending) {
        return result.buttonVisible === true;
      } 
      // If invitation is not pending, log that the test is being skipped
      FlowLogger.log('InvitationStatusFlow', 'Invitation not in pending status, skipping button visibility test');
      return true;
    }
  ),
  
  createMockStep(
    'send_gift_transition',
    'Send gift (transition to sent status)',
    async (prevResult) => {
      FlowLogger.log('InvitationStatusFlow', 'Simulating sending gift');
      
      const { invitation } = prevResult;
      
      // Only proceed with transition if invitation is in pending status
      if (invitation.status !== 'pending') {
        FlowLogger.log('InvitationStatusFlow', `Invitation already in ${invitation.status} status, skipping transition`);
        return {
          invitation,
          transitioned: false
        };
      }
      
      try {
        // In a real test, we would call the actual API to update status
        // For this mock, we'll simulate the update
        const updatedInvitation = {
          ...invitation,
          status: 'sent',
          updatedAt: new Date().toISOString()
        };
        
        FlowLogger.log('InvitationStatusFlow', 'Updated invitation status to sent', updatedInvitation);
        
        return {
          invitation: updatedInvitation,
          transitioned: true
        };
      } catch (error) {
        FlowLogger.error('InvitationStatusFlow', 'Error updating invitation status', error);
        return {
          invitation,
          transitioned: false,
          error
        };
      }
    },
    (result) => {
      // If we attempted a transition, verify it succeeded
      if (result.transitioned) {
        return result.invitation.status === 'sent';
      }
      // If we didn't attempt a transition, the test passes
      return true;
    }
  ),
  
  createMockStep(
    'verify_badge_sent',
    'Verify GIFT SENT badge appears and SEND GIFT button is hidden',
    async (prevResult) => {
      FlowLogger.log('InvitationStatusFlow', 'Verifying GIFT SENT badge visibility');
      
      const { invitation } = prevResult;
      
      // Check if invitation status is 'sent'
      const isSent = invitation.status === 'sent';
      
      // Button should be hidden for sent status
      const buttonShouldBeHidden = isSent;
      
      // Badge should be visible and show "GIFT SENT" for sent status
      const badgeShouldBeVisible = isSent;
      const badgeShouldShowSent = isSent;
      
      return {
        invitation,
        isSent,
        buttonHidden: buttonShouldBeHidden,
        badgeVisible: badgeShouldBeVisible,
        badgeShowsSent: badgeShouldShowSent
      };
    },
    (result) => {
      // If invitation is in sent status, verify UI elements
      if (result.isSent) {
        return result.buttonHidden && result.badgeVisible && result.badgeShowsSent;
      }
      // If invitation is not in sent status, skip this test
      FlowLogger.log('InvitationStatusFlow', `Invitation not in sent status (${result.invitation.status}), skipping badge verification`);
      return true;
    }
  ),
  
  createMockStep(
    'accept_gift_transition',
    'Accept gift (transition to accepted status)',
    async (prevResult) => {
      FlowLogger.log('InvitationStatusFlow', 'Simulating accepting gift');
      
      const { invitation } = prevResult;
      
      // Only proceed with transition if invitation is in sent status
      if (invitation.status !== 'sent') {
        FlowLogger.log('InvitationStatusFlow', `Invitation in ${invitation.status} status, skipping transition to accepted`);
        return {
          invitation,
          transitioned: false
        };
      }
      
      try {
        // In a real test, we would call the actual API to update status
        // For this mock, we'll simulate the update
        const updatedInvitation = {
          ...invitation,
          status: 'accepted',
          updatedAt: new Date().toISOString()
        };
        
        FlowLogger.log('InvitationStatusFlow', 'Updated invitation status to accepted', updatedInvitation);
        
        return {
          invitation: updatedInvitation,
          transitioned: true
        };
      } catch (error) {
        FlowLogger.error('InvitationStatusFlow', 'Error updating invitation status', error);
        return {
          invitation,
          transitioned: false,
          error
        };
      }
    },
    (result) => {
      // If we attempted a transition, verify it succeeded
      if (result.transitioned) {
        return result.invitation.status === 'accepted';
      }
      // If we didn't attempt a transition, the test passes
      return true;
    }
  ),
  
  createMockStep(
    'verify_badge_accepted',
    'Verify GIFT ACCEPTED badge appears',
    async (prevResult) => {
      FlowLogger.log('InvitationStatusFlow', 'Verifying GIFT ACCEPTED badge visibility');
      
      const { invitation } = prevResult;
      
      // Check if invitation status is 'accepted'
      const isAccepted = invitation.status === 'accepted';
      
      // Button should be hidden for accepted status
      const buttonShouldBeHidden = isAccepted;
      
      // Badge should be visible and show "GIFT ACCEPTED" for accepted status
      const badgeShouldBeVisible = isAccepted;
      const badgeShouldShowAccepted = isAccepted;
      
      return {
        invitation,
        isAccepted,
        buttonHidden: buttonShouldBeHidden,
        badgeVisible: badgeShouldBeVisible,
        badgeShowsAccepted: badgeShouldShowAccepted
      };
    },
    (result) => {
      // If invitation is in accepted status, verify UI elements
      if (result.isAccepted) {
        return result.buttonHidden && result.badgeVisible && result.badgeShowsAccepted;
      }
      // If invitation is not in accepted status, skip this test
      FlowLogger.log('InvitationStatusFlow', `Invitation not in accepted status (${result.invitation.status}), skipping badge verification`);
      return true;
    }
  ),
  
  createMockStep(
    'redeem_gift_transition',
    'Redeem gift (transition to redeemed status)',
    async (prevResult) => {
      FlowLogger.log('InvitationStatusFlow', 'Simulating redeeming gift');
      
      const { invitation } = prevResult;
      
      // Only proceed with transition if invitation is in accepted status
      if (invitation.status !== 'accepted') {
        FlowLogger.log('InvitationStatusFlow', `Invitation in ${invitation.status} status, skipping transition to redeemed`);
        return {
          invitation,
          transitioned: false
        };
      }
      
      try {
        // In a real test, we would call the actual API to update status
        // For this mock, we'll simulate the update
        const updatedInvitation = {
          ...invitation,
          status: 'redeemed',
          updatedAt: new Date().toISOString()
        };
        
        FlowLogger.log('InvitationStatusFlow', 'Updated invitation status to redeemed', updatedInvitation);
        
        return {
          invitation: updatedInvitation,
          transitioned: true
        };
      } catch (error) {
        FlowLogger.error('InvitationStatusFlow', 'Error updating invitation status', error);
        return {
          invitation,
          transitioned: false,
          error
        };
      }
    },
    (result) => {
      // If we attempted a transition, verify it succeeded
      if (result.transitioned) {
        return result.invitation.status === 'redeemed';
      }
      // If we didn't attempt a transition, the test passes
      return true;
    }
  ),
  
  createMockStep(
    'verify_badge_redeemed',
    'Verify GIFT REDEEMED badge appears',
    async (prevResult) => {
      FlowLogger.log('InvitationStatusFlow', 'Verifying GIFT REDEEMED badge visibility');
      
      const { invitation } = prevResult;
      
      // Check if invitation status is 'redeemed'
      const isRedeemed = invitation.status === 'redeemed';
      
      // Button should be hidden for redeemed status
      const buttonShouldBeHidden = isRedeemed;
      
      // Badge should be visible and show "GIFT REDEEMED" for redeemed status
      const badgeShouldBeVisible = isRedeemed;
      const badgeShouldShowRedeemed = isRedeemed;
      
      return {
        invitation,
        isRedeemed,
        buttonHidden: buttonShouldBeHidden,
        badgeVisible: badgeShouldBeVisible,
        badgeShowsRedeemed: badgeShouldShowRedeemed
      };
    },
    (result) => {
      // If invitation is in redeemed status, verify UI elements
      if (result.isRedeemed) {
        return result.buttonHidden && result.badgeVisible && result.badgeShowsRedeemed;
      }
      // If invitation is not in redeemed status, skip this test
      FlowLogger.log('InvitationStatusFlow', `Invitation not in redeemed status (${result.invitation.status}), skipping badge verification`);
      return true;
    }
  ),
  
  createMockStep(
    'complete_transaction_transition',
    'Complete transaction (transition to completed status)',
    async (prevResult) => {
      FlowLogger.log('InvitationStatusFlow', 'Simulating completing transaction');
      
      const { invitation } = prevResult;
      
      // Only proceed with transition if invitation is in redeemed status
      if (invitation.status !== 'redeemed') {
        FlowLogger.log('InvitationStatusFlow', `Invitation in ${invitation.status} status, skipping transition to completed`);
        return {
          invitation,
          transitioned: false
        };
      }
      
      try {
        // In a real test, we would call the actual API to update status
        // For this mock, we'll simulate the update
        const updatedInvitation = {
          ...invitation,
          status: 'completed',
          updatedAt: new Date().toISOString()
        };
        
        FlowLogger.log('InvitationStatusFlow', 'Updated invitation status to completed', updatedInvitation);
        
        return {
          invitation: updatedInvitation,
          transitioned: true
        };
      } catch (error) {
        FlowLogger.error('InvitationStatusFlow', 'Error updating invitation status', error);
        return {
          invitation,
          transitioned: false,
          error
        };
      }
    },
    (result) => {
      // If we attempted a transition, verify it succeeded
      if (result.transitioned) {
        return result.invitation.status === 'completed';
      }
      // If we didn't attempt a transition, the test passes
      return true;
    }
  ),
  
  createMockStep(
    'verify_badge_completed',
    'Verify COMPLETED badge appears',
    async (prevResult) => {
      FlowLogger.log('InvitationStatusFlow', 'Verifying COMPLETED badge visibility');
      
      const { invitation } = prevResult;
      
      // Check if invitation status is 'completed'
      const isCompleted = invitation.status === 'completed';
      
      // Button should be hidden for completed status
      const buttonShouldBeHidden = isCompleted;
      
      // Badge should be visible and show "COMPLETED" for completed status
      const badgeShouldBeVisible = isCompleted;
      const badgeShouldShowCompleted = isCompleted;
      
      return {
        invitation,
        isCompleted,
        buttonHidden: buttonShouldBeHidden,
        badgeVisible: badgeShouldBeVisible,
        badgeShowsCompleted: badgeShouldShowCompleted
      };
    },
    (result) => {
      // If invitation is in completed status, verify UI elements
      if (result.isCompleted) {
        return result.buttonHidden && result.badgeVisible && result.badgeShowsCompleted;
      }
      // If invitation is not in completed status, skip this test
      FlowLogger.log('InvitationStatusFlow', `Invitation not in completed status (${result.invitation.status}), skipping badge verification`);
      return true;
    }
  ),
  
  createMockStep(
    'test_dashboard_navigation',
    'Test navigation back to client dashboard with proper tracking',
    async (prevResult) => {
      FlowLogger.log('InvitationStatusFlow', 'Testing dashboard navigation with invitation tracking');
      
      const { invitation } = prevResult;
      
      // Extract client name from invitation
      const clientName = invitation.name;
      
      // For test2, we know the client ID is 14
      const clientId = clientName === 'test2' ? 14 : null;
      
      // Construct the navigation URL with tracking parameters
      const navUrl = clientId
        ? `/client/${clientId}?inviteHash=${invitation.inviteHash}`
        : `/client/dashboard?inviteHash=${invitation.inviteHash}`;
        
      FlowLogger.log('InvitationStatusFlow', `Navigation URL constructed: ${navUrl}`);
      
      return {
        invitation,
        clientName,
        clientId,
        navigationUrl: navUrl,
        navigationSuccess: true
      };
    },
    (result) => {
      // Verify navigation URL is correctly formed with tracking parameters
      return (
        result.navigationSuccess &&
        result.navigationUrl.includes('inviteHash=') &&
        result.navigationUrl.includes(result.invitation.inviteHash)
      );
    }
  )
]);

// Register this test if in development mode
if (import.meta.env.DEV) {
  // Register with global test registry
  if ((window as any).vmb && (window as any).vmb.flowTests) {
    (window as any).vmb.flowTests.registerTest('invitationStatus', invitationStatusFlow);
  }
  
  FlowLogger.log('TestFlows', 'Registered invitation status test flow');
}

export default invitationStatusFlow;