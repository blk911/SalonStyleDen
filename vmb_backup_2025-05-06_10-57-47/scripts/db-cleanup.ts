import { db, pool } from '../server/db';
import { salons, clients, invitations, styleSelections, activityLogs } from '../shared/schema';
import { eq, ne } from 'drizzle-orm';

/**
 * Database Cleanup Script
 * 
 * This script performs a complete database cleanup, keeping only Tiffany's salon data
 * and removing all clients, invitations, and artifacts to achieve a clean database state.
 */
async function cleanupDatabase() {
  console.log('=== Starting VMB Database Complete Cleanup ===');
  console.log('This will remove ALL clients, invitations, and artifacts while preserving Tiffany\'s salon information');
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

    // Step 2: Delete all activity logs
    console.log('\nStep 2: Removing ALL activity logs...');
    try {
      const deletedLogs = await db.delete(activityLogs).returning();
      console.log(`Deleted ${deletedLogs.length} activity logs`);
    } catch (error) {
      console.log('Error deleting activity logs:', error.message);
    }

    // Step 3: Delete all style selections
    console.log('\nStep 3: Removing ALL style selections...');
    try {
      const deletedStyleSelections = await db.delete(styleSelections).returning();
      console.log(`Deleted ${deletedStyleSelections.length} style selections`);
    } catch (error) {
      console.log('Error deleting style selections:', error.message);
    }

    // Step 4: Delete all invitations
    console.log('\nStep 4: Removing ALL invitations...');
    const deletedInvitations = await db.delete(invitations).returning();
    console.log(`Deleted ${deletedInvitations.length} invitations`);

    // Step 5: Delete ALL clients
    console.log('\nStep 5: Removing ALL clients...');
    const deletedClients = await db.delete(clients).returning();
    console.log(`Deleted ${deletedClients.length} clients`);

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
    const remainingInvitations = await db.select().from(invitations);
    const remainingStyleSelections = await db.select().from(styleSelections).catch(() => []);
    const remainingActivityLogs = await db.select().from(activityLogs).catch(() => []);

    console.log(`Remaining salons: ${remainingSalons.length}`);
    console.log(`Remaining clients: ${remainingClients.length} (should be 0)`);
    console.log(`Remaining style selections: ${remainingStyleSelections.length} (should be 0)`);
    console.log(`Remaining invitations: ${remainingInvitations.length} (should be 0)`);
    console.log(`Remaining activity logs: ${remainingActivityLogs.length} (should be 0)`);

    console.log('\n=== Database Cleanup Complete ===');
    console.log('The database has been completely purged - only Tiffany\'s salon information remains');
    console.log('All clients, invitations and associated records have been removed');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the cleanup
cleanupDatabase();