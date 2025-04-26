import { pool, db } from '../server/db';
import { salons, clients, invitations, styleSelections, users } from '../shared/schema';
import { eq, ne, and, or, sql } from 'drizzle-orm';

/**
 * Database Cleanup Script
 * 
 * This script performs a database cleanup, keeping only Tiffany's salon data
 * and removing all other clients, invitations, and artifacts.
 */
async function cleanupDatabase() {
  console.log('=== Starting VMB Database Cleanup ===');
  console.log('This will remove all data except for Tiffany\'s salon information');
  console.log('-----------------------------------------------');

  try {
    // Step 1: Find Tiffany's salon ID
    console.log('Step 1: Locating Tiffany\'s salon...');
    const tiffanySalons = await db.select().from(salons).where(
      eq(salons.name, 'Tiffany 5280 Nails Studio')
    );

    if (tiffanySalons.length === 0) {
      console.error('Error: Tiffany\'s salon not found in the database');
      return;
    }

    const tiffanySalon = tiffanySalons[0];
    console.log(`Found Tiffany's salon with ID: ${tiffanySalon.id}`);

    // Step 2: Delete all invitations
    console.log('\nStep 2: Removing all invitations...');
    const deletedInvitations = await db.delete(invitations).returning();
    console.log(`Deleted ${deletedInvitations.length} invitations`);

    // Step 3: Delete all style selections except for those related to Tiffany's salon
    console.log('\nStep 3: Removing style selections...');
    const deletedStyleSelections = await db.delete(styleSelections)
      .where(ne(styleSelections.salonId, tiffanySalon.id))
      .returning();
    console.log(`Deleted ${deletedStyleSelections.length} style selections`);

    // Step 4: Find clients related to Tiffany's salon
    console.log('\nStep 4: Finding clients to keep...');
    const tiffanyClients = await db.select().from(clients)
      .where(eq(clients.salonId, tiffanySalon.id));
    
    const clientIdsToKeep = tiffanyClients.map(client => client.id);
    console.log(`Found ${clientIdsToKeep.length} clients to keep for Tiffany's salon`);

    // Step 5: Delete all other clients
    console.log('\nStep 5: Removing other clients...');
    if (clientIdsToKeep.length > 0) {
      // If we have clients to keep, delete all others
      let deletedCount = 0;
      
      // For simplicity, we'll use SQL directly for more complex conditions
      if (clientIdsToKeep.length > 0) {
        // Create a NOT IN condition for the IDs we want to keep
        const idsToKeepStr = clientIdsToKeep.join(',');
        const client = await pool.connect();
        
        try {
          const result = await client.query(
            `DELETE FROM clients WHERE id NOT IN (${idsToKeepStr}) RETURNING id`
          );
          deletedCount = result.rowCount;
        } finally {
          client.release();
        }
      } else {
        // If no specific clients to keep, just delete them all
        const deletedClients = await db.delete(clients).returning();
        deletedCount = deletedClients.length;
      }
      
      console.log(`Deleted ${deletedCount} clients`);
    } else {
      // If no clients are associated with Tiffany's salon, don't delete anything
      console.log('No clients found for Tiffany\'s salon, keeping existing clients for reference');
    }

    // Step 6: Delete all other salons
    console.log('\nStep 6: Removing other salons...');
    const deletedSalons = await db.delete(salons)
      .where(ne(salons.id, tiffanySalon.id))
      .returning();
    console.log(`Deleted ${deletedSalons.length} other salons`);

    // Verify cleanup results
    console.log('\n=== Cleanup Summary ===');
    const remainingSalons = await db.select().from(salons);
    const remainingClients = await db.select().from(clients);
    const remainingStyleSelections = await db.select().from(styleSelections);
    const remainingInvitations = await db.select().from(invitations);

    console.log(`Remaining salons: ${remainingSalons.length}`);
    console.log(`Remaining clients: ${remainingClients.length}`);
    console.log(`Remaining style selections: ${remainingStyleSelections.length}`);
    console.log(`Remaining invitations: ${remainingInvitations.length}`);

    console.log('\n=== Database Cleanup Complete ===');
    console.log('The database has been purged of all data except for Tiffany\'s salon information');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the cleanup
cleanupDatabase();