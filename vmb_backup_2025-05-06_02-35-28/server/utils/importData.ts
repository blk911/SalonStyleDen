/**
 * Utility script for importing test data into the database
 */
import { db } from "../db.js";
import { salons, clients, users } from "../../shared/schema.js";

// Import salon data to database
export async function importSalons(salonData: any[]) {
  try {
    // Validate salons have required fields
    salonData.forEach((salon, index) => {
      if (!salon.name || !salon.ownerName || !salon.phone || !salon.email) {
        throw new Error(`Salon at index ${index} is missing required fields (name, ownerName, phone, email)`);
      }
    });

    // Insert salons into database
    const result = await db.insert(salons).values(
      salonData.map(salon => ({
        name: salon.name,
        ownerName: salon.ownerName,
        phone: salon.phone,
        email: salon.email,
        socialMedia: salon.socialMedia || [],
        type: 'salon',
        // Format address fields if available
        address: salon.address || null,
        city: salon.city || null,
        state: salon.state || null,
        zipCode: salon.zipCode || null
      }))
    ).returning();

    console.log(`Successfully imported ${result.length} salons`);
    return result;
  } catch (error) {
    console.error('Error importing salons:', error);
    throw error;
  }
}

// Import client data to database
export async function importClients(clientData: any[]) {
  try {
    // Validate clients have required fields
    clientData.forEach((client, index) => {
      if (!client.name || !client.phone || !client.email) {
        throw new Error(`Client at index ${index} is missing required fields (name, phone, email)`);
      }
    });

    // Insert clients into database
    const result = await db.insert(clients).values(
      clientData.map(client => ({
        name: client.name,
        phone: client.phone,
        email: client.email,
        isCurrentClient: client.isCurrentClient || false,
        notes: client.notes || '',
        favoriteServices: client.favoriteServices || [],
        type: 'client'
      }))
    ).returning();

    console.log(`Successfully imported ${result.length} clients`);
    return result;
  } catch (error) {
    console.error('Error importing clients:', error);
    throw error;
  }
}