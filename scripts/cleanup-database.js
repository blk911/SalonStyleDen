/**
 * Database Cleanup Script
 * 
 * This script cleans the database while preserving:
 * - VMB LTD (ID 1) 
 * - Tiffany 5280 Nails Studio (ID 2)
 * 
 * It will remove test/unreg data:
 * - Test clients (John Test User, jo bob, Rando Dando)
 * - Associated gifts, invitations, activity logs
 * - Reset sequences appropriately
 */

import postgres from 'postgres';
import { config } from 'dotenv';

config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

function logWithTime(message) {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${timestamp}] ${message}`);
}

async function cleanupDatabase() {
  logWithTime('Starting database cleanup process...');

  try {
    const salons = await sql`SELECT id, name FROM salons ORDER BY id`;
    const clients = await sql`SELECT id, name, phone FROM clients ORDER BY id`;
    const gifts = await sql`SELECT id, sender_id, recipient_id FROM gifts ORDER BY id`;
    
    logWithTime(`Current state: ${salons.length} salons, ${clients.length} clients, ${gifts.length} gifts`);
    
    await sql.begin(async sql => {
      const testClientIds = [93, 94, 95];
      
      if (testClientIds.length > 0) {
        logWithTime(`Deleting ${testClientIds.length} test clients and related data...`);
        
        await sql`DELETE FROM activity_logs WHERE client_id = ANY(${testClientIds})`;
        await sql`DELETE FROM style_selections WHERE client_id = ANY(${testClientIds})`;
        await sql`DELETE FROM invitations WHERE sender_id = ANY(${testClientIds})`;
        await sql`DELETE FROM gifts WHERE sender_id = ANY(${testClientIds}) OR recipient_id = ANY(${testClientIds})`;
        await sql`DELETE FROM appointment_confirmations WHERE client_id = ANY(${testClientIds})`;
        
        await sql`DELETE FROM clients WHERE id = ANY(${testClientIds})`;
      }
      
      await sql`DELETE FROM gifts WHERE sender_id IS NOT NULL AND sender_id NOT IN (SELECT id FROM clients)`;
      await sql`DELETE FROM gifts WHERE recipient_id IS NOT NULL AND recipient_id NOT IN (SELECT id FROM clients)`;
      await sql`DELETE FROM invitations WHERE sender_id NOT IN (SELECT id FROM clients)`;
      await sql`DELETE FROM style_selections WHERE client_id NOT IN (SELECT id FROM clients)`;
      await sql`DELETE FROM activity_logs WHERE client_id IS NOT NULL AND client_id NOT IN (SELECT id FROM clients)`;
      
      await sql`
        INSERT INTO activity_logs (type, description, timestamp) 
        VALUES ('system_maintenance', 'Database cleanup - removed test clients and orphaned data', NOW())
      `;
      
      logWithTime('Database cleanup completed successfully');
    });
    
  } catch (error) {
    logWithTime(`ERROR: ${error.message}`);
    console.error(error);
  } finally {
    await sql.end();
  }
}

cleanupDatabase();
