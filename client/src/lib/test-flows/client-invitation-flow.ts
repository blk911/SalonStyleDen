// This file previously contained test flows which have been removed from the codebase
// The file is kept as a stub to avoid breaking imports
// since the actual application code no longer relies on these tests
const clientInvitationFlow = createTestFlow('CLIENT_INVITATION', [
  createMockStep(
    'create_invitation',
    'Client creates a new VMB invitation to a friend',
    async () => {
      FlowLogger.log('ClientInvitationFlow', 'Simulating client creating a VMB invitation');
      
      // Mock data for invitation creation
      const invitationData = {
        name: 'Test Friend',
        email: 'testfriend@example.com',
        phone: '555-987-6543',
        salonId: 42, // Using Tiffany's salon ID
        senderId: 123, // Mock client ID who is sending the invitation
        message: 'Check out this salon!',
        type: 'client_invitation',
        favoriteServices: ['Manicure', 'Pedicure']
      };
      
      // In a real test, we would call the actual API and verify the server response
      // For this mock, we simulate a successful response
      return {
        id: 888, // Mock ID
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
        result.name === 'Test Friend' &&
        result.type === 'client_invitation'
      );
    }
  ),
  
  createMockStep(
    'friend_receives_invitation',
    'Friend receives VMB invitation notification',
    async () => {
      FlowLogger.log('ClientInvitationFlow', 'Simulating friend receiving notification');
      
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
    'friend_views_invitation',
    'Friend opens VMB invitation link',
    async () => {
      FlowLogger.log('ClientInvitationFlow', 'Simulating friend opening invitation link');
      
      // Mock page load event
      return {
        loaded: true,
        invitation: {
          id: 888,
          name: 'Test Friend',
          status: 'pending',
          type: 'client_invitation'
        }
      };
    },
    (result) => {
      // Verify page loaded with correct invitation
      return result.loaded && 
             result.invitation.id === 888 && 
             result.invitation.type === 'client_invitation';
    }
  ),
  
  createMockStep(
    'friend_accepts_invitation',
    'Friend clicks "Accept Invitation" button',
    async () => {
      FlowLogger.log('ClientInvitationFlow', 'Simulating friend accepting invitation');
      
      // Mock update API call
      return {
        id: 888,
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
    'friend_completes_registration',
    'Friend fills out registration form and submits',
    async () => {
      FlowLogger.log('ClientInvitationFlow', 'Simulating friend completing registration');
      
      // Mock registration data
      const registrationData = {
        name: 'Test Friend',
        email: 'testfriend@example.com',
        phone: '555-987-6543',
        password: 'securePassword123',
        salonId: 42,
        referrerId: 123 // Track who referred them
      };
      
      // Mock successful registration
      return {
        success: true,
        client: {
          id: 456, // Mock client ID
          ...registrationData,
          createdAt: new Date().toISOString()
        }
      };
    },
    (result) => {
      // Verify registration was successful
      return result.success && 
             !!result.client.id && 
             result.client.referrerId === 123;
    }
  ),
  
  createMockStep(
    'friend_appears_in_salon_list',
    'New client appears in salon\'s client list with referral info',
    async () => {
      FlowLogger.log('ClientInvitationFlow', 'Simulating salon dashboard refresh');
      
      // Mock client list after refresh
      return {
        clients: [
          { 
            id: 456, 
            name: 'Test Friend', 
            email: 'testfriend@example.com',
            referrerId: 123,
            referrerName: 'Existing Client'
          },
          // Other existing clients would be here
        ]
      };
    },
    (result) => {
      // Verify new client appears in list with correct referral data
      return result.clients.some((client: any) => 
        client.id === 456 && client.referrerId === 123
      );
    }
  )
]);

// Register this test if in development mode
if (import.meta.env.DEV) {
  // Register with global test registry
  if ((window as any).vmb && (window as any).vmb.flowTests) {
    (window as any).vmb.flowTests.registerTest('clientInvitation', clientInvitationFlow);
  }
  
  FlowLogger.log('TestFlows', 'Registered client invitation test flow');
}

export default clientInvitationFlow;