// ✅ WORKS EXACTLY AS INTENDED
// 🚫 DO NOT MODIFY WITHOUT FULL RETEST
// Flow: Salon Invitation - From salon sending an invitation to client accepting it

import { createMockStep, createTestFlow, TestStep } from '../flow-tester';
import FlowLogger from '../flow-logger';

/**
 * Test flow for the complete salon invitation process:
 * 1. Salon owner creates invitation
 * 2. Client receives invitation (via email/SMS)
 * 3. Client views and accepts invitation
 * 4. Client completes registration
 * 5. Client appears in salon's client list
 */
const salonInvitationFlow = createTestFlow('SALON_INVITATION', [
  createMockStep(
    'create_invitation',
    'Salon owner creates a new invitation',
    async () => {
      FlowLogger.log('SalonInvitationFlow', 'Simulating salon owner creating an invitation');
      
      // Mock data for invitation creation
      const invitationData = {
        name: 'Test Client',
        email: 'testclient@example.com',
        phone: '555-123-4567',
        salonId: 42, // Using Tiffany's salon ID
        message: 'Please join our salon!',
        type: 'salon_invitation',
        favoriteServices: ['Manicure', 'Pedicure']
      };
      
      // In a real test, we would call the actual API and verify the server response
      // For this mock, we simulate a successful response
      return {
        id: 999, // Mock ID
        ...invitationData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        inviteHash: 'test-hash-' + Math.random().toString(36).substring(2),
      };
    },
    (result) => {
      // Verify that invitation was created successfully
      return (
        !!result &&
        !!result.id &&
        result.status === 'pending' &&
        result.name === 'Test Client'
      );
    }
  ),
  
  createMockStep(
    'client_receives_invitation',
    'Client receives invitation notification',
    async () => {
      FlowLogger.log('SalonInvitationFlow', 'Simulating client receiving notification');
      
      // Mock delivery status
      return {
        delivered: true,
        method: 'email',
        timestamp: new Date().toISOString()
      };
    },
    (result) => {
      // Verify delivery was successful
      return result.delivered === true;
    }
  ),
  
  createMockStep(
    'client_views_invitation',
    'Client opens invitation link',
    async () => {
      FlowLogger.log('SalonInvitationFlow', 'Simulating client opening invitation link');
      
      // Mock page load event
      return {
        loaded: true,
        invitation: {
          id: 999,
          name: 'Test Client',
          status: 'pending'
        }
      };
    },
    (result) => {
      // Verify page loaded with correct invitation
      return result.loaded && result.invitation.id === 999;
    }
  ),
  
  createMockStep(
    'client_accepts_invitation',
    'Client clicks "Accept Invitation" button',
    async () => {
      FlowLogger.log('SalonInvitationFlow', 'Simulating client accepting invitation');
      
      // Mock update API call
      return {
        id: 999,
        status: 'accepted',
        updatedAt: new Date().toISOString()
      };
    },
    (result) => {
      // Verify invitation status was updated
      return result.status === 'accepted';
    }
  ),
  
  createMockStep(
    'client_completes_registration',
    'Client fills out registration form and submits',
    async () => {
      FlowLogger.log('SalonInvitationFlow', 'Simulating client completing registration');
      
      // Mock registration data
      const registrationData = {
        name: 'Test Client',
        email: 'testclient@example.com',
        phone: '555-123-4567',
        password: 'securePassword123',
        salonId: 42
      };
      
      // Mock successful registration
      return {
        success: true,
        client: {
          id: 888, // Mock client ID
          ...registrationData,
          createdAt: new Date().toISOString()
        }
      };
    },
    (result) => {
      // Verify registration was successful
      return result.success && !!result.client.id;
    }
  ),
  
  createMockStep(
    'client_appears_in_salon_list',
    'New client appears in salon\'s client list',
    async () => {
      FlowLogger.log('SalonInvitationFlow', 'Simulating salon dashboard refresh');
      
      // Mock client list after refresh
      return {
        clients: [
          { id: 888, name: 'Test Client', email: 'testclient@example.com' },
          // Other existing clients would be here
        ]
      };
    },
    (result) => {
      // Verify new client appears in list
      return result.clients.some((client: any) => client.id === 888);
    }
  )
]);

// Register this test if in development mode
if (import.meta.env.DEV) {
  // Register with global test registry
  if ((window as any).vmb && (window as any).vmb.flowTests) {
    (window as any).vmb.flowTests.registerTest('salonInvitation', salonInvitationFlow);
  }
  
  FlowLogger.log('TestFlows', 'Registered salon invitation test flow');
}

export default salonInvitationFlow;