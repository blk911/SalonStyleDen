/**
 * Database Purge Script
 * 
 * This script purges test data from the database while preserving:
 * - TIFFANY 5280 NAILS STUDIO
 * - Deb Dazzles
 * - Jenna's Glamour Nails
 * - Ven Me, Baby! LTD
 */

import { db } from './server/db.ts';
import { eq, ne, notInArray } from 'drizzle-orm';
import { salons, clients, invitations } from './shared/schema.ts';

// List of authorized salon names to keep
const AUTHORIZED_SALONS = [
  'TIFFANY 5280 NAILS STUDIO',
  'Deb Dazzles',
  'Jenna\'s Glamour Nails',
  'Ven Me, Baby! LTD'
];

// Client names to preserve (matching the salons)
const AUTHORIZED_CLIENTS = [
  'Tiffany', 
  'Deb Dazzle', 
  'Jenna', 
  'Ven Me Baby'
];

async function purgeDatabase() {
  console.log("Starting database purge process...");
  
  try {
    // 1. List all salons
    console.log("Listing all salons...");
    const allSalons = await db.select().from(salons);
    console.log(`Found ${allSalons.length} salons in database.`);
    
    allSalons.forEach(salon => {
      console.log(`ID: ${salon.id} | Name: ${salon.name}`);
    });

    // 2. Identify salons to keep
    const salonsToKeep = allSalons.filter(salon => 
      AUTHORIZED_SALONS.some(name => salon.name.includes(name))
    );
    
    console.log("\nSalons to keep:");
    salonsToKeep.forEach(salon => {
      console.log(`* ID: ${salon.id} | Name: ${salon.name} *`);
    });
    
    const salonIdsToKeep = salonsToKeep.map(salon => salon.id);
    
    // 3. Get counts of records to be deleted
    const salonCount = allSalons.length - salonsToKeep.length;
    
    // Count invitations to delete - using length instead of count function
    const invitationsToDelete = await db
      .select()
      .from(invitations)
      .where(
        salonIdsToKeep.length > 0 
          ? notInArray(invitations.salonId, salonIdsToKeep)
          : eq(invitations.id, -1) // Fallback if no salons to keep
      );
    
    // Count clients to delete - using length instead of count function
    const clientsToDelete = await db
      .select()
      .from(clients)
      .where(
        salonIdsToKeep.length > 0 
          ? notInArray(clients.salonId, salonIdsToKeep)
          : eq(clients.id, -1) // Fallback if no salons to keep
      );
    
    console.log(`\nWill delete: ${salonCount} salons, ${invitationsToDelete.length} invitations, ${clientsToDelete.length} clients`);
    
    console.log("\nProceeding with deletion...");
    
    // 4. Delete in order of dependencies
    
    // First delete invitations (depend on salons)
    if (salonIdsToKeep.length > 0) {
      const deletedInvitations = await db
        .delete(invitations)
        .where(notInArray(invitations.salonId, salonIdsToKeep))
        .returning({ id: invitations.id });
      
      console.log(`Deleted ${deletedInvitations.length} invitations for non-authorized salons.`);
      
      // Also delete any remaining invitations
      const deletedRemainingInvitations = await db
        .delete(invitations)
        .returning({ id: invitations.id });
      
      console.log(`Deleted ${deletedRemainingInvitations.length} additional invitations.`);
    } else {
      // Delete all invitations if no salons to keep
      const deletedInvitations = await db
        .delete(invitations)
        .returning({ id: invitations.id });
      
      console.log(`Deleted all ${deletedInvitations.length} invitations.`);
    }
    
    // Then delete clients for non-authorized salons
    if (salonIdsToKeep.length > 0) {
      const deletedClients = await db
        .delete(clients)
        .where(notInArray(clients.salonId, salonIdsToKeep))
        .returning({ id: clients.id, name: clients.name });
      
      console.log(`Deleted ${deletedClients.length} clients for non-authorized salons.`);
      
      // Also delete test clients even for authorized salons
      const deletedTestClients = await db
        .delete(clients)
        .where(notInArray(clients.name, AUTHORIZED_CLIENTS))
        .returning({ id: clients.id, name: clients.name });
      
      console.log(`Deleted ${deletedTestClients.length} test clients.`);
    } else {
      // Delete all clients except authorized ones if no salons to keep
      const deletedClients = await db
        .delete(clients)
        .where(notInArray(clients.name, AUTHORIZED_CLIENTS))
        .returning({ id: clients.id, name: clients.name });
      
      console.log(`Deleted ${deletedClients.length} clients.`);
    }
    
    // Finally delete unwanted salons
    if (salonIdsToKeep.length > 0) {
      const deletedSalons = await db
        .delete(salons)
        .where(notInArray(salons.id, salonIdsToKeep))
        .returning({ id: salons.id, name: salons.name });
      
      console.log(`Deleted ${deletedSalons.length} salons.`);
    } else {
      console.log("No authorized salons found to keep. Skipping salon deletion for safety.");
    }
    
    // 5. Verify results
    const remainingSalons = await db.select().from(salons);
    const remainingClients = await db.select().from(clients);
    const remainingInvitations = await db.select().from(invitations);
    
    console.log(`\nRemaining after purge: ${remainingSalons.length} salons, ${remainingClients.length} clients, ${remainingInvitations.length} invitations`);
    
    console.log("\nRemaining salons:");
    remainingSalons.forEach(salon => {
      console.log(`ID: ${salon.id} | Name: ${salon.name}`);
    });
    
    console.log("\nDatabase purge completed successfully!");
    
  } catch (error) {
    console.error("Error during database purge:", error);
  }
}

// Run the purge function
purgeDatabase()
  .then(() => {
    console.log("Purge script execution complete.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });