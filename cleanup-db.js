/**
 * Database Cleanup Script
 * 
 * This script will delete all data from the database except for Tiffany's salon profile.
 * CAUTION: THIS WILL DELETE ALL CLIENTS, INVITATIONS, AND OTHER SALONS
 */

import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

async function cleanupDatabase() {
  // Create a new client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database');

    // Start a transaction
    await client.query('BEGIN');

    console.log('Starting database cleanup...');

    // Get Tiffany's salon ID
    const tiffanyQuery = await client.query("SELECT id FROM salons WHERE name LIKE '%Tiffany%' OR owner_name LIKE '%Tiffany%'");
    const tiffanySalonId = tiffanyQuery.rows.length > 0 ? tiffanyQuery.rows[0].id : null;
    
    console.log(`Found Tiffany's salon ID: ${tiffanySalonId}`);
    
    // Make sure VMB, LTD (id=1) is preserved
    const vmbCheck = await client.query("SELECT id FROM salons WHERE id = 1");
    const vmbExists = vmbCheck.rows.length > 0;

    console.log(`VMB, LTD salon exists: ${vmbExists}`);

    // Delete all invitations
    const deleteInvitationsResult = await client.query('DELETE FROM invitations');
    console.log(`Deleted ${deleteInvitationsResult.rowCount} invitations`);

    // Delete all clients
    const deleteClientsResult = await client.query('DELETE FROM clients');
    console.log(`Deleted ${deleteClientsResult.rowCount} clients`);

    // Delete all activity logs
    const deleteLogsResult = await client.query('DELETE FROM activity_logs');
    console.log(`Deleted ${deleteLogsResult.rowCount} activity logs`);

    // Delete all salons EXCEPT Tiffany's salon and VMB, LTD
    let deleteSalonsQuery = 'DELETE FROM salons WHERE 1=1';
    
    if (tiffanySalonId) {
      deleteSalonsQuery += ` AND id != ${tiffanySalonId}`;
    }
    
    // Always preserve VMB, LTD (ID 1)
    deleteSalonsQuery += ' AND id != 1';
    
    const deleteSalonsResult = await client.query(deleteSalonsQuery);
    console.log(`Deleted ${deleteSalonsResult.rowCount} salons (preserving Tiffany's salon and VMB, LTD)`);

    // Check if VMB, LTD needs to be created
    if (!vmbExists) {
      await client.query(`
        INSERT INTO salons (id, name, owner_name, phone, email, type, license_verified, created_at) 
        VALUES (1, 'VMB, LTD', 'VMB Admin', '555-VMB-ADMN', 'admin@venmebaby.com', 'corporate', true, CURRENT_TIMESTAMP)
      `);
      console.log('Created VMB, LTD salon record');
    }

    // Check Tiffany's salon status
    if (!tiffanySalonId) {
      // Create Tiffany's salon if it doesn't exist
      await client.query(`
        INSERT INTO salons (name, owner_name, phone, email, type, license_verified, created_at) 
        VALUES ('Tiffany 5280 Nails Studio', 'Tiffany', '303-555-5280', 'tiffany@5280nails.com', 'salon', true, CURRENT_TIMESTAMP)
      `);
      console.log('Created Tiffany salon record');
    } else {
      // Make sure Tiffany's salon has the correct sponsor (VMB, LTD)
      await client.query(`
        UPDATE salons 
        SET sponsor = 'VMB, LTD', sponsor_id = 1
        WHERE id = $1
      `, [tiffanySalonId]);
      console.log('Updated Tiffany salon sponsor to VMB, LTD');
    }

    // Commit the transaction
    await client.query('COMMIT');
    console.log('Database cleanup completed successfully');

  } catch (err) {
    // If an error occurs, rollback the transaction
    await client.query('ROLLBACK');
    console.error('Error during database cleanup:', err);
    throw err;
  } finally {
    // Close the client
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the cleanup function
cleanupDatabase().catch(err => {
  console.error('Database cleanup failed:', err);
  process.exit(1);
});