/**
 * Create test invitations via the API
 */

const BASE_URL = 'http://localhost:5000';

// Demo data to test PendingSalonInvitations component
async function createTestInvitations() {
  try {
    console.log('Starting test data creation via API...');
    
    // 1. First get all clients
    const clientsResponse = await fetch(`${BASE_URL}/api/clients`);
    if (!clientsResponse.ok) {
      throw new Error(`Failed to fetch clients: ${clientsResponse.status}`);
    }
    
    const clients = await clientsResponse.json();
    console.log(`Found ${clients.length} clients`);
    
    if (clients.length < 2) {
      throw new Error('Need at least 2 clients for this test');
    }
    
    // 2. Get first salon
    const salonsResponse = await fetch(`${BASE_URL}/api/salons`);
    if (!salonsResponse.ok) {
      throw new Error(`Failed to fetch salons: ${salonsResponse.status}`);
    }
    
    const salons = await salonsResponse.json();
    console.log(`Found ${salons.length} salons`);
    
    if (salons.length === 0) {
      throw new Error('Need at least 1 salon for this test');
    }
    
    const salon = salons[0];
    
    // 3. Create salon-to-client invitations (first 2 clients)
    for (let i = 0; i < 2 && i < clients.length; i++) {
      const client = clients[i];
      
      console.log(`Creating salon invitation for client ${client.name} (${client.id})`);
      
      const invitationData = {
        name: 'TEST INVITATION',
        phone: client.phone,
        email: client.email || 'test@example.com',
        message: `This is a salon invitation TO client ${client.name} (ID: ${client.id})`,
        type: 'service',
        salonId: salon.id,
        // Using the salon owner's user ID as the sender since null isn't allowed
        senderId: salon.ownerId || 1, 
        sponsor: salon.name,
        status: 'pending',
        styleOption: 'French Tips',
        stylePrice: 45,
        styleDuration: 30
      };
      
      const inviteResponse = await fetch(`${BASE_URL}/api/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invitationData)
      });
      
      if (!inviteResponse.ok) {
        console.error(`Failed to create salon invitation: ${inviteResponse.status}`);
        console.error(await inviteResponse.text());
      } else {
        console.log(`Created salon invitation for ${client.name}`);
      }
    }
    
    // 4. Create client-to-client invitations (client 0 sending to client 1)
    if (clients.length >= 2) {
      const sender = clients[0];
      const recipient = clients[1];
      
      console.log(`Creating client-to-client invitation from ${sender.name} to ${recipient.name}`);
      
      const invitationData = {
        name: recipient.name,
        phone: recipient.phone,
        email: recipient.email || 'test@example.com',
        message: `This is a client invitation FROM client ${sender.name} (ID: ${sender.id}) TO client ${recipient.name} (ID: ${recipient.id})`,
        type: 'gift',
        salonId: salon.id,
        senderId: sender.id,
        sponsor: sender.name,
        status: 'pending',
        styleOption: 'French Tips',
        stylePrice: 45,
        styleDuration: 30
      };
      
      const inviteResponse = await fetch(`${BASE_URL}/api/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invitationData)
      });
      
      if (!inviteResponse.ok) {
        console.error(`Failed to create client invitation: ${inviteResponse.status}`);
        console.error(await inviteResponse.text());
      } else {
        console.log(`Created client invitation from ${sender.name} to ${recipient.name}`);
      }
    }
    
    // 5. Create client-to-self invitations (should be filtered)
    const self = clients[0];
    
    console.log(`Creating client-to-self invitation for ${self.name}`);
    
    const selfInvitationData = {
      name: self.name,
      phone: self.phone,
      email: self.email || 'test@example.com',
      message: `This is a client invitation FROM client ${self.name} (ID: ${self.id}) TO THEMSELVES`,
      type: 'gift',
      salonId: salon.id,
      senderId: self.id,
      sponsor: self.name,
      status: 'pending',
      styleOption: 'French Tips',
      stylePrice: 45,
      styleDuration: 30
    };
    
    const selfInviteResponse = await fetch(`${BASE_URL}/api/invitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(selfInvitationData)
    });
    
    if (!selfInviteResponse.ok) {
      console.error(`Failed to create self invitation: ${selfInviteResponse.status}`);
      console.error(await selfInviteResponse.text());
    } else {
      console.log(`Created self invitation for ${self.name} (should be filtered out in UI)`);
    }
    
    console.log('\nTEST INSTRUCTIONS:');
    console.log(`1. Go to client dashboard for ${clients[0].name} (ID: ${clients[0].id}): /client/${clients[0].id}`);
    console.log('2. Check the "Pending Salon Invitations" section');
    console.log('3. You should see:');
    console.log('   - Salon invitations TO this client');
    console.log('   - You should NOT see any invitations this client sent (especially not the self invite)');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

createTestInvitations();