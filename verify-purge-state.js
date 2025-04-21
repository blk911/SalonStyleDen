/**
 * Purge Verification Script
 * 
 * This script verifies that all client data, invitations, style selections,
 * and related artifacts have been successfully purged, with only the preserved
 * salons remaining in the system.
 * 
 * Usage: node verify-purge-state.js
 */

// ES module format
import { db, pool } from './server/db.js';
import { clients, invitations, styleSelections, activityLogs, salons } from './shared/schema.js';
import { eq, inArray } from 'drizzle-orm';

// Preserved Salon IDs
const PRESERVED_SALON_IDS = [42, 43]; // TIFFANY_5280 and Ven Me, Baby! LTD

async function verifyPurgeState() {
  console.log('🔍 Verifying system purge state...');
  
  try {
    // Check remaining clients
    const remainingClients = await db.select().from(clients);
    console.log(`Clients remaining: ${remainingClients.length} (should be 0)`);
    
    if (remainingClients.length > 0) {
      console.log('❌ WARNING: Some clients were not purged!');
      remainingClients.forEach(client => {
        console.log(`  - ${client.name} (ID: ${client.id})`);
      });
    } else {
      console.log('✅ All clients successfully purged');
    }
    
    // Check remaining invitations
    const remainingInvitations = await db.select().from(invitations);
    console.log(`Invitations remaining: ${remainingInvitations.length} (should be 0)`);
    
    if (remainingInvitations.length > 0) {
      console.log('❌ WARNING: Some invitations were not purged!');
      remainingInvitations.forEach(invitation => {
        console.log(`  - Invitation #${invitation.id} for ${invitation.name}`);
      });
    } else {
      console.log('✅ All invitations successfully purged');
    }
    
    // Check remaining style selections
    const remainingSelections = await db.select().from(styleSelections);
    console.log(`Style selections remaining: ${remainingSelections.length} (should be 0)`);
    
    if (remainingSelections.length > 0) {
      console.log('❌ WARNING: Some style selections were not purged!');
    } else {
      console.log('✅ All style selections successfully purged');
    }
    
    // Check remaining activity logs
    const remainingLogs = await db.select().from(activityLogs);
    console.log(`Activity logs remaining: ${remainingLogs.length} (should be 0)`);
    
    if (remainingLogs.length > 0) {
      console.log('❌ WARNING: Some activity logs were not purged!');
    } else {
      console.log('✅ All activity logs successfully purged');
    }
    
    // Verify preserved salons
    const preservedSalons = await db.select()
      .from(salons)
      .where(inArray(salons.id, PRESERVED_SALON_IDS));
    
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
    await pool.end();
  }
}

// Execute the verification
verifyPurgeState();