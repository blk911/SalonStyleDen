
import { db } from './server/db.js';
import { clients, invitations } from './shared/schema.js';

async function clearTestData() {
  console.log('Clearing test data from database...');

  try {
    // Delete all invitations
    await db.delete(invitations);
    console.log('Cleared all invitations');

    // Delete all clients
    await db.delete(clients);
    console.log('Cleared all clients');

    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

clearTestData();
