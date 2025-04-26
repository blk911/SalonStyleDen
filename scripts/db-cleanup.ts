import { db } from '../server/db';
import { salons, clients, invitations, styles, clientSalons } from '../shared/schema';
import { eq, ne } from 'drizzle-orm';

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

    // Step 3: Delete all client-salon relationships except for Tiffany's
    console.log('\nStep 3: Removing client-salon relationships...');
    const deletedClientSalons = await db.delete(clientSalons)
      .where(ne(clientSalons.salonId, tiffanySalon.id))
      .returning();
    console.log(`Deleted ${deletedClientSalons.length} client-salon relationships`);

    // Step 4: Delete all clients unrelated to Tiffany's salon
    console.log('\nStep 4: Finding clients to keep...');
    const tiffanyClientRelations = await db.select().from(clientSalons)
      .where(eq(clientSalons.salonId, tiffanySalon.id));
    
    const clientIdsToKeep = tiffanyClientRelations.map(relation => relation.clientId);
    console.log(`Found ${clientIdsToKeep.length} clients to keep for Tiffany's salon`);

    // Step 5: Delete all other clients
    console.log('\nStep 5: Removing other clients...');
    if (clientIdsToKeep.length > 0) {
      const deletedClients = await db.delete(clients)
        .where(
          clientIdsToKeep.length > 0 
            ? db.and(
                ...clientIdsToKeep.map(id => ne(clients.id, id))
              )
            : undefined // If no clients to keep, delete all
        )
        .returning();
      console.log(`Deleted ${deletedClients.length} clients`);
    } else {
      // If no clients are associated with Tiffany's salon, keep the database as is
      console.log('No clients found for Tiffany\'s salon, keeping existing clients for reference');
    }

    // Step 6: Delete all styles unrelated to Tiffany's salon
    console.log('\nStep 6: Keeping only Tiffany\'s salon styles...');
    const deletedStyles = await db.delete(styles)
      .where(ne(styles.salonId, tiffanySalon.id))
      .returning();
    console.log(`Deleted ${deletedStyles.length} styles from other salons`);

    // Step 7: Delete all other salons
    console.log('\nStep 7: Removing other salons...');
    const deletedSalons = await db.delete(salons)
      .where(ne(salons.id, tiffanySalon.id))
      .returning();
    console.log(`Deleted ${deletedSalons.length} other salons`);

    // Verify cleanup results
    console.log('\n=== Cleanup Summary ===');
    const remainingSalons = await db.select().from(salons);
    const remainingClients = await db.select().from(clients);
    const remainingStyles = await db.select().from(styles);
    const remainingInvitations = await db.select().from(invitations);

    console.log(`Remaining salons: ${remainingSalons.length}`);
    console.log(`Remaining clients: ${remainingClients.length}`);
    console.log(`Remaining styles: ${remainingStyles.length}`);
    console.log(`Remaining invitations: ${remainingInvitations.length}`);

    console.log('\n=== Database Cleanup Complete ===');
    console.log('The database has been purged of all data except for Tiffany\'s salon information');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    // Close the database connection
    await db.pool.end();
  }
}

// Run the cleanup
cleanupDatabase();