/**
 * Direct Salon Purge Script
 * 
 * This script will delete all salon records except for the specified ones:
 * - Tiffany 5280 Nails Studio
 * - Deb Dazzles
 * - Jenna's Glamour Nails
 * - Ven Me, Baby! LTD
 */

import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Function to execute a query and log results
async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Function to list all salons
async function listSalons() {
  console.log("Listing all salons...");
  
  const query = `
    SELECT id, name, "ownerName", "createdAt" 
    FROM salons 
    ORDER BY id ASC
  `;
  
  const salons = await executeQuery(query);
  
  console.log(`Found ${salons.length} salons:`);
  salons.forEach(salon => {
    console.log(`ID: ${salon.id} | Name: ${salon.name} | Owner: ${salon.ownerName}`);
  });
  
  // Highlight the ones to keep
  console.log('\nSalons to KEEP:');
  const toKeep = salons.filter(salon => {
    const name = salon.name.toLowerCase();
    return (
      name.includes('tiffany') ||
      name.includes('deb dazzle') ||
      name.includes('jenna') ||
      name.includes('ven me')
    );
  });
  
  toKeep.forEach(salon => {
    console.log(`* ID: ${salon.id} | Name: ${salon.name} | Owner: ${salon.ownerName} *`);
  });
  
  if (toKeep.length !== 4) {
    console.warn(`\nWARNING: Expected to find exactly 4 salons to keep, but found ${toKeep.length}.`);
    console.warn("Please check your search criteria and try again.");
  }
  
  return { allSalons: salons, toKeep };
}

// Function to purge salons
async function purgeSalons() {
  console.log("Starting salon purge process...");
  
  // First list all salons and identify which ones to keep
  const { allSalons, toKeep } = await listSalons();
  
  // Get IDs of salons to keep
  const keepIds = toKeep.map(salon => salon.id);
  
  // If we don't have exactly 4 salons to keep, show a more detailed list
  if (keepIds.length !== 4) {
    console.log("\nAll salon names for reference:");
    allSalons.forEach(salon => {
      console.log(`${salon.id}: "${salon.name}"`);
    });
    
    // Hard-code auto confirmation for non-interactive environment
    console.log("\nContinuing with purge despite discrepancy...");
  }
  
  // Get all salons to delete
  const deleteIds = allSalons
    .filter(salon => !keepIds.includes(salon.id))
    .map(salon => salon.id);
  
  console.log(`\nWill delete ${deleteIds.length} salons.`);
  
  // Check for related records
  const invitationsQuery = `
    SELECT COUNT(*) as count FROM invitations 
    WHERE "salonId" IN (${deleteIds.join(',')})
  `;
  
  const clientsQuery = `
    SELECT COUNT(*) as count FROM clients 
    WHERE "salonId" IN (${deleteIds.join(',')})
  `;
  
  const invitationResult = await executeQuery(invitationsQuery);
  const clientResult = await executeQuery(clientsQuery);
  
  const invitationCount = parseInt(invitationResult[0]?.count || 0);
  const clientCount = parseInt(clientResult[0]?.count || 0);
  
  console.log(`Found ${invitationCount} invitations and ${clientCount} clients to delete.`);
  
  // Auto-confirm for non-interactive environment
  console.log("\nProceeding with deletion...");
  
  // Delete in the correct order to maintain referential integrity
  if (invitationCount > 0) {
    console.log("Deleting invitations...");
    await executeQuery(`
      DELETE FROM invitations 
      WHERE "salonId" IN (${deleteIds.join(',')})
    `);
    console.log(`Deleted ${invitationCount} invitations.`);
  }
  
  if (clientCount > 0) {
    console.log("Deleting clients...");
    await executeQuery(`
      DELETE FROM clients 
      WHERE "salonId" IN (${deleteIds.join(',')})
    `);
    console.log(`Deleted ${clientCount} clients.`);
  }
  
  // Finally delete the salons
  console.log("Deleting salons...");
  const deleteResult = await executeQuery(`
    DELETE FROM salons 
    WHERE id IN (${deleteIds.join(',')})
    RETURNING id, name
  `);
  
  console.log(`Deleted ${deleteResult.length} salons.`);
  
  // Verify remaining salons
  const remainingSalons = await executeQuery(`
    SELECT id, name, "ownerName" FROM salons ORDER BY id ASC
  `);
  
  console.log(`\nRemaining salons (${remainingSalons.length}):`);
  remainingSalons.forEach(salon => {
    console.log(`ID: ${salon.id} | Name: ${salon.name} | Owner: ${salon.ownerName}`);
  });
  
  console.log("\nPurge complete!");
}

// Execute purge function
try {
  // Execute the function - change to purgeSalons() to actually delete
  await listSalons();
  //await purgeSalons();
} catch (error) {
  console.error("Error:", error);
} finally {
  // Close pool and exit
  await pool.end();
  process.exit(0);
}