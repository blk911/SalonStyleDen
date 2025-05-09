/**
 * Test Data Generator for VMB Invitation Testing
 * This script creates test invitations including:
 * - Salon invitations TO clients
 * - Client invitations TO other clients
 * Purpose: To test filtering in PendingSalonInvitations component
 */
import { db } from '../server/db.js';
import { invitations } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

async function createTestInvitations() {
  try {
    console.log('Starting test invitation creation...');
    
    // First, let's get some existing clients to use in our test
    const clients = await db.query.clients.findMany({
      limit: 5,
    });
    
    if (clients.length < 2) {
      console.error('Need at least 2 clients in the database to run this test');
      return;
    }
    
    console.log(`Found ${clients.length} clients to use for test data`);
    
    // Get salon info
    const salons = await db.query.salons.findMany({
      limit: 1,
    });
    
    if (salons.length === 0) {
      console.error('Need at least one salon in the database to run this test');
      return;
    }
    
    const salon = salons[0];
    console.log(`Using salon: ${salon.name} (ID: ${salon.id})`);
    
    // Clear any existing test invitations
    const deleteResult = await db.delete(invitations)
      .where(eq(invitations.name, 'TEST INVITATION'))
      .returning();
    
    console.log(`Deleted ${deleteResult.length} existing test invitations`);
    
    // Create 3 types of invitations:
    
    // 1. Salon-to-client invitations (salon sending to client)
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      
      // Skip if this is a test client
      if (client.name === 'TEST CLIENT') continue;
      
      await db.insert(invitations).values({
        name: 'TEST INVITATION',
        phone: client.phone,
        email: client.email || 'test@example.com',
        message: `This is a salon invitation TO client ${client.name} (ID: ${client.id})`,
        type: 'service',
        salonId: salon.id,
        senderId: null, // NULL senderId indicates it's from the salon
        sponsor: salon.name,
        status: 'pending',
        inviteHash: `test-salon-to-client-${Date.now()}-${i}`,
        createdAt: new Date().toISOString(),
        styleOption: 'French Tips',
        stylePrice: 45,
        styleDuration: 30,
      });
      
      console.log(`Created salon-to-client invitation for ${client.name}`);
    }
    
    // 2. Client-to-other-clients invitations (client sending to others)
    // Use the first client as the sender
    const sender = clients[0];
    
    for (let i = 1; i < clients.length; i++) {
      const recipient = clients[i];
      
      // Skip if this is a test client
      if (recipient.name === 'TEST CLIENT') continue;
      
      await db.insert(invitations).values({
        name: 'TEST INVITATION',
        phone: recipient.phone,
        email: recipient.email || 'test@example.com',
        message: `This is a client invitation FROM client ${sender.name} (ID: ${sender.id}) TO client ${recipient.name} (ID: ${recipient.id})`,
        type: 'gift',
        salonId: salon.id,
        senderId: sender.id, // Client is the sender
        sponsor: sender.name,
        status: 'pending',
        inviteHash: `test-client-to-other-${Date.now()}-${i}`,
        createdAt: new Date().toISOString(),
        styleOption: 'French Tips',
        stylePrice: 45,
        styleDuration: 30,
      });
      
      console.log(`Created client-to-other invitation from ${sender.name} to ${recipient.name}`);
    }
    
    // 3. Client-to-self invitations (client sending to themselves - should be filtered out)
    for (let i = 0; i < 2; i++) {
      const client = clients[i];
      
      // Skip if this is a test client
      if (client.name === 'TEST CLIENT') continue;
      
      await db.insert(invitations).values({
        name: 'TEST INVITATION',
        phone: client.phone,
        email: client.email || 'test@example.com',
        message: `This is a client invitation FROM client ${client.name} (ID: ${client.id}) TO THEMSELVES - should be filtered out`,
        type: 'gift',
        salonId: salon.id,
        senderId: client.id, // Client is sending to themselves
        sponsor: client.name,
        status: 'pending',
        inviteHash: `test-client-to-self-${Date.now()}-${i}`,
        createdAt: new Date().toISOString(),
        styleOption: 'French Tips',
        stylePrice: 45,
        styleDuration: 30,
      });
      
      console.log(`Created client-to-self invitation for ${client.name} (should be filtered out in UI)`);
    }
    
    console.log('All test invitations created successfully!');
    console.log('\nTEST INSTRUCTIONS:');
    console.log('1. Log in to the client dashboard for client ID: ' + clients[0].id);
    console.log('2. Check the "Pending Salon Invitations" section');
    console.log('3. You should see:');
    console.log('   - Salon invitations TO this client');
    console.log('   - You should NOT see any invitations this client sent');
    console.log('\nTesting URL: /client/' + clients[0].id);
    
  } catch (error) {
    console.error('Error creating test invitations:', error);
  } finally {
    process.exit(0);
  }
}

createTestInvitations();