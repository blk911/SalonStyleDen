/**
 * List All Salons
 * 
 * This script will list all salons in the database and highlight
 * the ones that should be kept during a purge operation.
 */

import { db } from './server/db.js';
import { salons } from './shared/schema.js';

async function listAllSalons() {
  console.log("Listing all salons in the database...");
  
  try {
    const allSalons = await db.select().from(salons).orderBy(salons.id);
    
    console.log(`\nFound ${allSalons.length} total salons:`);
    allSalons.forEach(salon => {
      console.log(`ID: ${salon.id} | Name: ${salon.name} | Owner: ${salon.ownerName}`);
    });
    
    // Highlight the ones to keep
    console.log('\nSalons to KEEP during purge:');
    const toKeep = [];
    allSalons.forEach(salon => {
      if (
        salon.name.toLowerCase().includes('tiffany') ||
        salon.name.toLowerCase().includes('deb dazzle') ||
        salon.name.toLowerCase().includes('jenna') ||
        salon.name.toLowerCase().includes('ven me')
      ) {
        console.log(`* ID: ${salon.id} | Name: ${salon.name} | Owner: ${salon.ownerName} *`);
        toKeep.push(salon);
      }
    });
    
    if (toKeep.length !== 4) {
      console.warn(`\nWARNING: Expected to find exactly 4 salons to keep, but found ${toKeep.length}.`);
      console.warn("The purge operation might not work as expected.");
    }
    
  } catch (error) {
    console.error("Error listing salons:", error);
  } finally {
    process.exit(0);
  }
}

// Execute the function
await listAllSalons();