/**
 * Script to create test data for gift deletion testing
 */

import { db } from '../server/db';
import { clients, salons, gifts } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Creating test data for gift handling...');
  
  try {
    // Look for Tiffany's salon as a default
    console.log('Looking for default salon...');
    const defaultSalon = await db.query.salons.findFirst({
      where: eq(salons.name, 'Tiffany 5280 Nails Studio')
    });
    
    if (!defaultSalon) {
      console.error('Error: Default salon not found. Cannot continue.');
      process.exit(1);
    }
    
    const defaultSalonId = defaultSalon.id;
    console.log(`Using salon ID ${defaultSalonId} as default sponsor.`);
    
    // Create a test client to be the sender
    console.log('Creating test client as gift sender...');
    const [senderClient] = await db.insert(clients)
      .values({
        name: 'TestSender',
        phone: '[555] 123-4567',
        email: 'test-sender@example.com',
        type: 'client',
        sponsorSalonId: defaultSalonId,
        sponsorName: defaultSalon.name,
        sponsor: 'VMB LTD'
      })
      .returning();
    
    console.log(`Created sender client with ID ${senderClient.id}`);
    
    // Create a test client to be the recipient
    console.log('Creating test client as gift recipient...');
    const [recipientClient] = await db.insert(clients)
      .values({
        name: 'TestRecipient',
        phone: '[555] 987-6543',
        email: 'test-recipient@example.com',
        type: 'client',
        sponsorSalonId: defaultSalonId,
        sponsorName: defaultSalon.name,
        sponsor: 'VMB LTD'
      })
      .returning();
    
    console.log(`Created recipient client with ID ${recipientClient.id}`);
    
    // Create a gift from sender to recipient
    console.log('Creating test gift...');
    const [gift] = await db.insert(gifts)
      .values({
        senderId: senderClient.id,
        recipientId: recipientClient.id,
        recipientPhone: recipientClient.phone,
        recipientEmail: recipientClient.email,
        giftType: 'style_card',
        amount: 2500, // $25.00
        message: 'Test gift message',
        status: 'sent'
      })
      .returning();
    
    console.log(`Created gift with ID ${gift.id}`);
    
    console.log('Test data created successfully!');
    console.log(`Sender client ID: ${senderClient.id}`);
    console.log(`Recipient client ID: ${recipientClient.id}`);
    console.log(`Gift ID: ${gift.id}`);
    
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

main();