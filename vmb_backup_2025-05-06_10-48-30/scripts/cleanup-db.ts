// Database cleanup script to purge all data except Tiffany's salon
import { db } from "../server/db";
import { eq, sql } from "drizzle-orm";
import { clients, invitations, salons, styleSelections, activityLogs, users } from "../shared/schema";

async function cleanupDatabase() {
  console.log("Starting database cleanup...");
  
  try {
    // Preserve only Tiffany's salon (ID 42)
    const tiffanySalonId = 42;
    
    // Delete all activity logs
    console.log("Deleting all activity logs...");
    await db.delete(activityLogs);
    
    // Delete all invitations
    console.log("Deleting all invitations...");
    await db.delete(invitations);
    
    // Delete all style selections
    console.log("Deleting all style selections...");
    await db.delete(styleSelections);
    
    // Delete ALL clients (as per user request)
    console.log("Deleting ALL clients...");
    await db.delete(clients);
    
    // Delete all salons except Tiffany's
    console.log("Deleting all salons except Tiffany's...");
    await db.delete(salons)
      .where(
        sql`${salons.id} != ${tiffanySalonId}`
      );
    
    console.log("Database cleanup completed successfully!");
  } catch (error) {
    console.error("Error during database cleanup:", error);
  } finally {
    process.exit(0);
  }
}

cleanupDatabase();