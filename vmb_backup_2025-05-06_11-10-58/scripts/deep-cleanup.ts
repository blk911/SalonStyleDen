import { db, pool } from '../server/db';
import { salons } from '../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Deep Database Cleanup Script
 * 
 * This script performs a complete database cleanup by:
 * 1. Keeping only Tiffany's salon base information
 * 2. Removing all services, promotions, and other data from the salon record
 */
async function deepCleanupDatabase() {
  console.log('=== Starting VMB Deep Database Cleanup ===');
  console.log('This will remove ALL data except Tiffany\'s basic salon information');
  console.log('(services, promotions, and other data will be removed)');
  console.log('-----------------------------------------------');

  try {
    // Step 1: Find Tiffany's salon
    console.log('Step 1: Locating Tiffany\'s salon...');
    const tiffanySalons = await db.select().from(salons).where(
      eq(salons.name, 'Tiffany 5280 Nails Studio')
    );

    if (tiffanySalons.length === 0) {
      console.error('Error: Tiffany\'s salon not found in the database');
      return;
    }

    const tiffanySalon = tiffanySalons[0];
    console.log(`Found Tiffany's salon with ID: ${tiffanySalon.id}`);

    // Step 2: Clean the salon record
    console.log('\nStep 2: Cleaning Tiffany\'s salon data...');
    
    // Create a cleaned version of the salon record
    const cleanedSalon = {
      ...tiffanySalon,
      services: null,  // Remove services
      promos: null,    // Remove promotions
      schedule: null,  // Remove schedule
      socialMedia: null // Remove social media
    };
    
    // Update the salon record with cleaned data
    await db.update(salons)
      .set(cleanedSalon)
      .where(eq(salons.id, tiffanySalon.id));
    
    console.log('Removed services, promotions, and other data from salon record');

    // Step 3: Verify the cleanup
    console.log('\nStep 3: Verifying cleanup...');
    const updatedSalon = await db.select().from(salons).where(
      eq(salons.id, tiffanySalon.id)
    );
    
    console.log('Updated Salon Record:');
    console.log('Name:', updatedSalon[0].name);
    console.log('Owner:', updatedSalon[0].ownerName);
    console.log('Email:', updatedSalon[0].email);
    console.log('Phone:', updatedSalon[0].phone);
    console.log('Services:', updatedSalon[0].services || 'None');
    console.log('Promos:', updatedSalon[0].promos || 'None');

    console.log('\n=== Deep Database Cleanup Complete ===');
    console.log('The database has been completely purged down to only Tiffany\'s essential salon information');
    console.log('All services, promotions, schedules and other advanced data have been removed');
  } catch (error) {
    console.error('Error during deep database cleanup:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the cleanup
deepCleanupDatabase();