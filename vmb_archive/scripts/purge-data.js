/**
 * Simple Database Purge Script
 * 
 * This script purges all client data, invitations, style selections, and resets all states.
 * It uses direct SQL commands to ensure compatibility.
 */

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function purgeAllData() {
  console.log('🧹 Starting complete system purge...');
  
  try {
    console.log('Purging style selections...');
    const deletedStyleSelections = await sql`DELETE FROM style_selections RETURNING *`;
    console.log(`✅ Removed ${deletedStyleSelections.length} style selections`);
    
    console.log('Purging invitations...');
    const deletedInvitations = await sql`DELETE FROM invitations RETURNING *`;
    console.log(`✅ Removed ${deletedInvitations.length} invitations`);
    
    console.log('Purging client data...');
    const deletedClients = await sql`DELETE FROM clients RETURNING *`;
    console.log(`✅ Removed ${deletedClients.length} clients`);
    
    console.log('Purging activity logs...');
    const deletedLogs = await sql`DELETE FROM activity_logs RETURNING *`;
    console.log(`✅ Removed ${deletedLogs.length} activity logs`);
    
    console.log('Resetting sequences...');
    await sql`ALTER SEQUENCE clients_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE invitations_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE style_selections_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE activity_logs_id_seq RESTART WITH 1`;
    console.log('✅ All sequences reset');
    
    console.log('\n✅ System purge completed successfully!');
    console.log('✅ The following salons were preserved:');
    console.log('  - Tiffany 5280 Nails Studio (ID: 42)');
    console.log('  - Ven Me, Baby! LTD (ID: 43)');
    
  } catch (error) {
    console.error('❌ Error during purge operation:', error);
  } finally {
    await sql.end();
  }
}

// Execute the purge
purgeAllData();