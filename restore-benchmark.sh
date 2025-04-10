#!/bin/bash

# Benchmark Restoration Script - April 10, 2025
# This script restores the Ven Me Baby application to the benchmark state

echo "===== VEN ME BABY BENCHMARK RESTORATION ====="
echo "Starting restoration process..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
  echo "ERROR: PostgreSQL database is not running!"
  echo "Please ensure the database is properly provisioned before running this script."
  exit 1
fi

# Reinstall dependencies if needed
echo "Reinstalling dependencies..."
npm install

# Apply any needed database migrations
echo "Applying database schema..."
npm run db:push

# Add the default promotions fix
echo "Applying promotion fixes..."
cat > promotion-fix.js << 'EOL'
// Temporary fix to ensure the three standard promotions exist
const { db } = require('./server/db');
const { eq } = require('drizzle-orm');
const { salons } = require('./shared/schema');

async function restorePromotions() {
  try {
    // Get all salons
    const allSalons = await db.select().from(salons);
    
    for (const salon of allSalons) {
      console.log(`Processing salon: ${salon.name} (ID: ${salon.id})`);
      
      // Add the standard promotions
      const standardPromos = [
        {
          id: 1,
          title: "Summer Special",
          description: "20% off all manicures",
          endDate: "2025-07-31"
        },
        {
          id: 2,
          title: "New Client Offer",
          description: "Free nail art with any service",
          endDate: null
        },
        {
          id: 3,
          title: "Bring a Friend",
          description: "25% off for you and a friend",
          endDate: "2025-08-15"
        }
      ];
      
      // Update the salon's promotions
      await db
        .update(salons)
        .set({ promos: standardPromos })
        .where(eq(salons.id, salon.id));
      
      console.log(`  ✓ Restored promotions for salon ${salon.id}`);
    }
    
    console.log("Promotion restoration complete!");
  } catch (error) {
    console.error("Error restoring promotions:", error);
  }
}

restorePromotions().then(() => process.exit(0));
EOL

# Execute the promotion fix
node promotion-fix.js

# Start the application in development mode
echo "Starting the application..."
npm run dev