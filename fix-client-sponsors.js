/**
 * Fix Client Sponsors Script
 * 
 * This script updates all clients that have null/undefined sponsor field 
 * to set a default value of "Unknown".
 */

import { db } from './server/db.js';
import { clients } from './shared/schema.js';
import { isNull, sql } from 'drizzle-orm';

async function fixClientSponsors() {
  console.log('Starting client sponsor fix...');
  
  try {
    // First, find all clients with missing sponsor information
    const clientsWithMissingSponsors = await db.select()
      .from(clients)
      .where(sql`(sponsor IS NULL OR sponsor = '') AND (sponsor_name IS NULL OR sponsor_name = '')`);
    
    console.log(`Found ${clientsWithMissingSponsors.length} clients with missing sponsor information`);
    
    // Update each client's sponsor field to "Unknown"
    for (const client of clientsWithMissingSponsors) {
      console.log(`Updating client ID ${client.id} (${client.name}) with default sponsor value`);
      
      await db.update(clients)
        .set({ 
          sponsor: 'Unknown'
        })
        .where(sql`id = ${client.id}`);
    }
    
    console.log('Client sponsor update complete!');
    
    // Verify the update was successful
    const remainingClientsWithMissingSponsors = await db.select()
      .from(clients)
      .where(sql`(sponsor IS NULL OR sponsor = '') AND (sponsor_name IS NULL OR sponsor_name = '')`);
    
    console.log(`Verification: ${remainingClientsWithMissingSponsors.length} clients still have missing sponsor information`);
    
  } catch (error) {
    console.error('Error updating client sponsors:', error);
  } finally {
    console.log('Script execution complete');
    process.exit(0);
  }
}

// Run the migration
fixClientSponsors();