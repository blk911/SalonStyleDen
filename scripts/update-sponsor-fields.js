/**
 * Data Migration Script to Update Sponsor Fields
 * 
 * This script updates all existing records to ensure proper sponsor fields
 * are set before adding database constraints.
 */

import { db } from '../server/db.js';
import { clients, salons, invitations } from '../shared/schema.js';
import { eq, isNull } from 'drizzle-orm';

async function main() {
  console.log('Starting data migration for sponsor fields...');
  
  try {
    // Get default salon ID
    console.log('Looking for a default sponsor salon...');
    const defaultSalon = await db.query.salons.findFirst({
      where: eq(salons.name, 'Tiffany 5280 Nails Studio')
    });
    
    if (!defaultSalon) {
      console.error('Error: Default salon not found. Cannot continue.');
      process.exit(1);
    }
    
    const defaultSalonId = defaultSalon.id;
    console.log(`Using salon ID ${defaultSalonId} as default sponsor.`);
    
    // Update clients with null sponsorSalonId
    console.log('Updating client records with missing sponsor information...');
    const clientsToUpdate = await db.query.clients.findMany({
      where: isNull(clients.sponsorSalonId)
    });
    
    console.log(`Found ${clientsToUpdate.length} clients needing update.`);
    
    for (const client of clientsToUpdate) {
      console.log(`Updating client ID ${client.id}: ${client.name}`);
      
      await db.update(clients).set({
        sponsorSalonId: defaultSalonId,
        sponsorName: defaultSalon.name,
        sponsor: 'VMB LTD'
      }).where(eq(clients.id, client.id));
    }
    
    // Update invitations with null salonId or sponsor fields
    console.log('Updating invitation records with missing sponsor information...');
    const invitationsToUpdate = await db.query.invitations.findMany({
      where: isNull(invitations.salonId)
    });
    
    console.log(`Found ${invitationsToUpdate.length} invitations needing update.`);
    
    for (const invitation of invitationsToUpdate) {
      console.log(`Updating invitation ID ${invitation.id}`);
      
      await db.update(invitations).set({
        salonId: defaultSalonId,
        sponsorName: defaultSalon.name,
        sponsor: 'VMB LTD'
      }).where(eq(invitations.id, invitation.id));
    }
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

main();