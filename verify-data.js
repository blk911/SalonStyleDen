/**
 * Simple Purge Verification Script
 * 
 * This script verifies that all client data, invitations, style selections,
 * and related artifacts have been successfully purged.
 */

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function verifyPurgeState() {
  console.log('🔍 Verifying system purge state...');
  
  try {
    // Check clients table
    const remainingClients = await sql`SELECT COUNT(*) FROM clients`;
    const clientCount = parseInt(remainingClients[0].count);
    console.log(`Clients remaining: ${clientCount} (should be 0)`);
    
    if (clientCount > 0) {
      const clientDetails = await sql`SELECT id, name FROM clients`;
      console.log('❌ WARNING: Some clients were not purged!');
      clientDetails.forEach(client => {
        console.log(`  - ${client.name} (ID: ${client.id})`);
      });
    } else {
      console.log('✅ All clients successfully purged');
    }
    
    // Check invitations table
    const remainingInvitations = await sql`SELECT COUNT(*) FROM invitations`;
    const invitationCount = parseInt(remainingInvitations[0].count);
    console.log(`Invitations remaining: ${invitationCount} (should be 0)`);
    
    if (invitationCount > 0) {
      const invitationDetails = await sql`SELECT id, name FROM invitations`;
      console.log('❌ WARNING: Some invitations were not purged!');
      invitationDetails.forEach(invitation => {
        console.log(`  - Invitation #${invitation.id} for ${invitation.name}`);
      });
    } else {
      console.log('✅ All invitations successfully purged');
    }
    
    // Check style selections table
    const remainingSelections = await sql`SELECT COUNT(*) FROM style_selections`;
    const selectionCount = parseInt(remainingSelections[0].count);
    console.log(`Style selections remaining: ${selectionCount} (should be 0)`);
    
    if (selectionCount > 0) {
      console.log('❌ WARNING: Some style selections were not purged!');
    } else {
      console.log('✅ All style selections successfully purged');
    }
    
    // Check activity logs table
    const remainingLogs = await sql`SELECT COUNT(*) FROM activity_logs`;
    const logCount = parseInt(remainingLogs[0].count);
    console.log(`Activity logs remaining: ${logCount} (should be 0)`);
    
    if (logCount > 0) {
      console.log('❌ WARNING: Some activity logs were not purged!');
    } else {
      console.log('✅ All activity logs successfully purged');
    }
    
    // Verify preserved salons
    const preservedSalons = await sql`SELECT * FROM salons WHERE id IN (42, 43)`;
    console.log(`Preserved salons: ${preservedSalons.length} (should be 2)`);
    
    if (preservedSalons.length === 2) {
      console.log('✅ Both essential salons preserved:');
      preservedSalons.forEach(salon => {
        console.log(`  - ${salon.name} (ID: ${salon.id})`);
      });
    } else {
      console.log('❌ WARNING: Essential salons may have been affected!');
      preservedSalons.forEach(salon => {
        console.log(`  - ${salon.name} (ID: ${salon.id})`);
      });
    }
    
    console.log('\n🏁 Verification complete!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await sql.end();
  }
}

// Execute the verification
verifyPurgeState();