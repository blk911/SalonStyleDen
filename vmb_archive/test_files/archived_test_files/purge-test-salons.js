/**
 * Salon Purge Script
 * 
 * This script will delete all salon records except for the specified ones:
 * - Tiffany 5280 Nails Studio
 * - Deb Dazzles
 * - Jenna's Glamour Nails
 * - Ven Me, Baby! LTD
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, not, or, ilike } from 'drizzle-orm';
import readline from 'readline';

// Define the table schemas
const salons = {
  id: { name: 'id' },
  name: { name: 'name' }
};

const clients = {
  id: { name: 'id' },
  name: { name: 'name' },
  salonId: { name: 'salon_id' }
};

const invitations = {
  id: { name: 'id' },
  salonId: { name: 'salon_id' }
};

// Pack them into a schema object
const schema = { salons, clients, invitations };

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const db = drizzle(pool, { schema });

async function purgeSalons() {
  console.log("Starting salon purge process...");

  try {
    // First, get all the salons we want to KEEP
    const keepSalons = await db.select()
      .from(salons)
      .where(
        or(
          ilike(salons.name, '%TIFFANY 5280%'),
          ilike(salons.name, '%deb%dazzle%'),
          ilike(salons.name, '%jenna%glamour%'),
          ilike(salons.name, '%ven%me%baby%')
        )
      );

    console.log(`Found ${keepSalons.length} salons to keep:`);
    keepSalons.forEach(salon => {
      console.log(`  - ID: ${salon.id}, Name: ${salon.name}`);
    });

    // Extract the IDs of salons to keep
    const keepIds = keepSalons.map(salon => salon.id);

    if (keepIds.length !== 4) {
      console.warn(`Warning: Expected to find 4 salons to keep, but found ${keepIds.length}.`);
      console.warn("Please verify the salon names and try again.");

      // Display all salons for debugging
      const allSalons = await db.select({ id: salons.id, name: salons.name }).from(salons);
      console.log("\nAll salons in the database:");
      allSalons.forEach(salon => {
        console.log(`  - ID: ${salon.id}, Name: ${salon.name}`);
      });

      // Ask for confirmation before proceeding
      const rl1 = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl1.question('\nContinue with purge? (yes/no): ', resolve);
      });

      rl1.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log("Purge aborted.");
        return;
      }
    }

    // Get all the salons to delete
    const salonsToDelete = await db.select({ id: salons.id, name: salons.name })
      .from(salons)
      .where(
        not(
          or(
            ...keepIds.map(id => eq(salons.id, id))
          )
        )
      );

    console.log(`\nFound ${salonsToDelete.length} salons to DELETE:`);
    salonsToDelete.forEach(salon => {
      console.log(`  - ID: ${salon.id}, Name: ${salon.name}`);
    });

    // Extract the IDs of salons to delete
    const deleteIds = salonsToDelete.map(salon => salon.id);

    // Find related invitations and clients
    const relatedInvitations = await db.select({ id: invitations.id, salon: invitations.salonId })
      .from(invitations)
      .where(
        or(
          ...deleteIds.map(id => eq(invitations.salonId, id))
        )
      );

    const relatedClients = await db.select({ id: clients.id, name: clients.name, salon: clients.salonId })
      .from(clients)
      .where(
        or(
          ...deleteIds.map(id => eq(clients.salonId, id))
        )
      );

    console.log(`\nFound ${relatedInvitations.length} related invitations to delete.`);
    console.log(`Found ${relatedClients.length} related clients to delete.`);

    // Ask for final confirmation before deleting
    const rl2 = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmation = await new Promise(resolve => {
      rl2.question(`\nAre you SURE you want to delete ${salonsToDelete.length} salons? This cannot be undone! (type 'DELETE' to confirm): `, resolve);
    });

    rl2.close();

    if (confirmation !== 'DELETE') {
      console.log("Purge aborted.");
      return;
    }

    // Delete in the correct order to maintain referential integrity
    console.log("\nDeleting invitations...");
    if (relatedInvitations.length > 0) {
      await db.delete(invitations)
        .where(
          or(
            ...deleteIds.map(id => eq(invitations.salonId, id))
          )
        );
      console.log(`Deleted ${relatedInvitations.length} invitations.`);
    } else {
      console.log("No invitations to delete.");
    }

    console.log("\nDeleting clients...");
    if (relatedClients.length > 0) {
      await db.delete(clients)
        .where(
          or(
            ...deleteIds.map(id => eq(clients.salonId, id))
          )
        );
      console.log(`Deleted ${relatedClients.length} clients.`);
    } else {
      console.log("No clients to delete.");
    }

    console.log("\nDeleting salons...");
    if (deleteIds.length > 0) {
      await db.delete(salons)
        .where(
          or(
            ...deleteIds.map(id => eq(salons.id, id))
          )
        );
      console.log(`Deleted ${deleteIds.length} salons.`);
    } else {
      console.log("No salons to delete.");
    }

    console.log("\nPurge complete!");

    // Verify remaining salons
    const remainingSalons = await db.select({ id: salons.id, name: salons.name }).from(salons);
    console.log(`\nRemaining salons (${remainingSalons.length}):`);
    remainingSalons.forEach(salon => {
      console.log(`  - ID: ${salon.id}, Name: ${salon.name}`);
    });

  } catch (error) {
    console.error("Error during purge:", error);
  }
}

// Execute the function
purgeSalons().then(() => {
  console.log("Script execution completed.");
  process.exit(0);
}).catch(err => {
  console.error("Script execution failed:", err);
  process.exit(1);
});