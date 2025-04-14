
import { db } from './server/db.js';
import { clients, invitations } from './shared/schema.js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || '';
const client = postgres(connectionString, { ssl: 'require', max: 1 });

async function clearTestData() {
  console.log('Clearing test data from database...');

  try {
    // Delete all invitations
    const deletedInvitations = await db.delete(invitations).returning();
    console.log(`Cleared ${deletedInvitations.length} invitations`);

    // Delete all clients
    const deletedClients = await db.delete(clients).returning();
    console.log(`Cleared ${deletedClients.length} clients`);

    console.log('Database cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearTestData();
