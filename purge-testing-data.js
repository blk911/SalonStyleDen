/**
 * Complete System Purge Script
 * 
 * This script purges all client data, invitations, style selections, and resets all states.
 * It maintains only the essential salon data for TIFFANY_5280 NAILS STUDIO and Ven Me, Baby! LTD.
 * 
 * Usage: node purge-testing-data.js
 */

// ES module format
import { db, pool } from './server/db.js';
import { clients, invitations, styleSelections, activityLogs } from './shared/schema.js';
import { eq, not, inArray, sql } from 'drizzle-orm';

// Preserved Salon IDs
const PRESERVED_SALON_IDS = [42, 43]; // TIFFANY_5280 and Ven Me, Baby! LTD

async function purgeSystemData() {
  console.log('🧹 Starting complete system purge...');
  
  try {
    // Step 1: Clear all style selections
    console.log('Purging style selections...');
    const deletedStyleSelections = await db.delete(styleSelections).returning();
    console.log(`✅ Removed ${deletedStyleSelections.length} style selections`);
    
    // Step 2: Clear all invitations
    console.log('Purging invitations...');
    const deletedInvitations = await db.delete(invitations).returning();
    console.log(`✅ Removed ${deletedInvitations.length} invitations`);
    
    // Step 3: Clear all clients
    console.log('Purging clients...');
    const deletedClients = await db.delete(clients).returning();
    console.log(`✅ Removed ${deletedClients.length} clients`);
    
    // Step 4: Clear all activity logs
    console.log('Purging activity logs...');
    const deletedLogs = await db.delete(activityLogs).returning();
    console.log(`✅ Removed ${deletedLogs.length} activity logs`);
    
    // Step 5: Reset sequences
    console.log('Resetting database sequences...');
    await db.execute(sql`ALTER SEQUENCE clients_id_seq RESTART WITH 1;`);
    await db.execute(sql`ALTER SEQUENCE invitations_id_seq RESTART WITH 1;`);
    await db.execute(sql`ALTER SEQUENCE style_selections_id_seq RESTART WITH 1;`);
    await db.execute(sql`ALTER SEQUENCE activity_logs_id_seq RESTART WITH 1;`);
    console.log('✅ Reset all sequences');
    
    console.log('✅ System purge completed successfully!');
    console.log('✅ The following salons were preserved:');
    console.log('  - Tiffany 5280 Nails Studio (ID: 42)');
    console.log('  - Ven Me, Baby! LTD (ID: 43)');
    
  } catch (error) {
    console.error('❌ Error during purge operation:', error);
  } finally {
    await pool.end();
  }
}

// Execute the purge
purgeSystemData();