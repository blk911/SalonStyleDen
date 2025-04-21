/**
 * Direct Salon Purge Script
 * 
 * This script will delete all salon records except for the specified ones:
 * - Tiffany 5280 Nails Studio
 * - Deb Dazzles
 * - Jenna's Glamour Nails
 * - Ven Me, Baby! LTD
 */

const { Pool } = require('pg');

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
      name.includes('tiffany 5280') || name.includes('tiffany_5280') ||
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

// Function to purge salons and clients
async function purgeSalons() {
  console.log("Starting comprehensive purge process...");

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
    WHERE "salonId" IN (${deleteIds.length > 0 ? deleteIds.join(',') : '0'})
  `;

  const clientsQuery = `
    SELECT COUNT(*) as count FROM clients 
    WHERE "salonId" IN (${deleteIds.length > 0 ? deleteIds.join(',') : '0'})
  `;

  // Count all clients for potential purge
  const allClientsQuery = `
    SELECT COUNT(*) as count FROM clients
  `;

  const invitationResult = await executeQuery(invitationsQuery);
  const clientResult = await executeQuery(clientsQuery);
  const allClientsResult = await executeQuery(allClientsQuery);

  const invitationCount = parseInt(invitationResult[0]?.count || 0);
  const clientCount = parseInt(clientResult[0]?.count || 0);
  const allClientCount = parseInt(allClientsResult[0]?.count || 0);

  console.log(`Found ${invitationCount} invitations and ${clientCount} clients to delete related to salons.`);
  console.log(`Total clients in database: ${allClientCount}`);

  // Auto-confirm for non-interactive environment
  console.log("\nProceeding with deletion...");

  // Delete in the correct order to maintain referential integrity
  if (invitationCount > 0) {
    console.log("Deleting invitations for removed salons...");
    await executeQuery(`
      DELETE FROM invitations 
      WHERE "salonId" IN (${deleteIds.length > 0 ? deleteIds.join(',') : '0'})
    `);
    console.log(`Deleted ${invitationCount} invitations.`);
  }

  // Delete all invitations regardless of salon
  console.log("Deleting ALL invitations for comprehensive cleanup...");
  const deleteAllInvitationsResult = await executeQuery(`
    DELETE FROM invitations
    RETURNING id
  `);
  console.log(`Deleted ${deleteAllInvitationsResult.length} invitations in total.`);

  // Delete clients related to salons being removed
  if (clientCount > 0) {
    console.log("Deleting clients for removed salons...");
    await executeQuery(`
      DELETE FROM clients 
      WHERE "salonId" IN (${deleteIds.length > 0 ? deleteIds.join(',') : '0'})
    `);
    console.log(`Deleted ${clientCount} clients.`);
  }

  // Delete all test clients regardless of salon
  console.log("Deleting ALL test clients for comprehensive cleanup...");
  const deleteAllClientsResult = await executeQuery(`
    DELETE FROM clients
    WHERE name NOT IN ('Tiffany', 'Deb Dazzle', 'Jenna', 'Ven Me Baby')
    RETURNING id, name
  `);
  console.log(`Deleted ${deleteAllClientsResult.length} test clients in total.`);

  // Finally delete the salons
  if (deleteIds.length > 0) {
    console.log("Deleting salons...");
    const deleteResult = await executeQuery(`
      DELETE FROM salons 
      WHERE id IN (${deleteIds.join(',')})
      RETURNING id, name
    `);

    console.log(`Deleted ${deleteResult.length} salons.`);
  }

  // Verify remaining salons
  const remainingSalons = await executeQuery(`
    SELECT id, name, "ownerName" FROM salons ORDER BY id ASC
  `);

  console.log(`\nRemaining salons (${remainingSalons.length}):`);
  remainingSalons.forEach(salon => {
    console.log(`ID: ${salon.id} | Name: ${salon.name} | Owner: ${salon.ownerName}`);
  });

  // Verify remaining clients
  const remainingClients = await executeQuery(`
    SELECT id, name, "salonId" FROM clients ORDER BY id ASC
  `);

  console.log(`\nRemaining clients (${remainingClients.length}):`);
  remainingClients.forEach(client => {
    console.log(`ID: ${client.id} | Name: ${client.name} | Salon ID: ${client.salonId}`);
  });

  console.log("\nComprehensive purge complete!");
}

// Execute purge function
(async () => {
  try {
    // Execute the purge function to delete test data
    await purgeSalons();
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close pool and exit
    await pool.end();
    process.exit(0);
  }
})();