import { 
  users, type User, type InsertUser,
  salons, type Salon, type InsertSalon,
  clients, type Client, type InsertClient,
  invitations, type Invitation, type InsertInvitation
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Salon methods
  getSalon(id: number): Promise<Salon | undefined>;
  createSalon(salon: InsertSalon): Promise<Salon>;
  getAllSalons(): Promise<Salon[]>;
  updateSalonServices(id: number, services: any[]): Promise<Salon>;
  updateSalonPromos(id: number, promos: any[]): Promise<Salon>;
  
  // Client methods
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  getAllClients(): Promise<Client[]>;
  
  // Invitation methods
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitation(id: number): Promise<Invitation | undefined>;
  getRecentInvitations(limit?: number): Promise<Invitation[]>;
  getSalonInvitations(salonId: number): Promise<Invitation[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results.length > 0 ? results[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  // Salon methods
  async getSalon(id: number): Promise<Salon | undefined> {
    const results = await db.select().from(salons).where(eq(salons.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async createSalon(insertSalon: InsertSalon): Promise<Salon> {
    // Ensure required fields are set
    const salonData = {
      ...insertSalon,
      type: "salon",
      socialMedia: insertSalon.socialMedia || null,
      createdAt: new Date()
    };
    
    const result = await db.insert(salons).values(salonData).returning();
    return result[0];
  }

  async getAllSalons(): Promise<Salon[]> {
    try {
      console.log('DatabaseStorage.getAllSalons - Attempting to fetch all salons');
      const result = await db.select().from(salons);
      console.log(`DatabaseStorage.getAllSalons - Successfully retrieved ${result.length} salons`);
      return result;
    } catch (error) {
      console.error('DatabaseStorage.getAllSalons - Error fetching salons:', error);
      throw error; // Re-throw to let the route handler catch it
    }
  }
  
  async updateSalonServices(id: number, services: any[]): Promise<Salon> {
    // Update salon services
    const result = await db
      .update(salons)
      .set({ services: services })
      .where(eq(salons.id, id))
      .returning();
    
    return result[0];
  }
  
  async updateSalonPromos(id: number, promos: any[]): Promise<Salon> {
    console.log(`DatabaseStorage.updateSalonPromos - Updating promos for salon ID ${id}`);
    console.log('DatabaseStorage.updateSalonPromos - Promos to save:', JSON.stringify(promos));
    
    try {
      // Update salon promos
      const result = await db
        .update(salons)
        .set({ promos: promos })
        .where(eq(salons.id, id))
        .returning();
      
      console.log(`DatabaseStorage.updateSalonPromos - Update successful`);
      console.log('DatabaseStorage.updateSalonPromos - Updated salon has promos:', 
        result[0].promos ? JSON.stringify(result[0].promos) : 'No promos');
      
      return result[0];
    } catch (error) {
      console.error('DatabaseStorage.updateSalonPromos - Error updating promos:', error);
      throw error;
    }
  }
  
  async updateSalon(id: number, salonData: Partial<Salon>): Promise<Salon> {
    console.log(`DatabaseStorage.updateSalon - Updating salon ID ${id}`);
    
    try {
      // Remove id from the update data (can't update primary key)
      const { id: _, ...updateData } = salonData;
      
      const result = await db
        .update(salons)
        .set(updateData)
        .where(eq(salons.id, id))
        .returning();
      
      console.log(`DatabaseStorage.updateSalon - Update successful`);
      return result[0];
    } catch (error) {
      console.error('DatabaseStorage.updateSalon - Error updating salon:', error);
      throw error;
    }
  }

  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    const results = await db.select().from(clients).where(eq(clients.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async isDuplicateContact(phone: string, email: string, sponsor?: string, excludeId?: number): Promise<{isDuplicate: boolean, field: string}> {
    // Check clients table
    const clientPhone = await db.select().from(clients).where(eq(clients.phone, phone));
    const clientEmail = await db.select().from(clients).where(eq(clients.email, email));
    
    // Check invitations table 
    const invitePhone = await db.select().from(invitations).where(eq(invitations.phone, phone));
    const inviteEmail = await db.select().from(invitations).where(eq(invitations.email, email));

    // Check sponsor duplication
    if (sponsor) {
      const sponsorExists = await db.select()
        .from(invitations)
        .where(eq(invitations.sponsor, sponsor))
        .limit(1);
        
      if (sponsorExists.length > 0) {
        return { isDuplicate: true, field: 'sponsor' };
      }
    }

    if ((clientPhone.length > 0 && clientPhone[0].id !== excludeId) || invitePhone.length > 0) {
      return { isDuplicate: true, field: 'phone' };
    }
    if ((clientEmail.length > 0 && clientEmail[0].id !== excludeId) || inviteEmail.length > 0) {
      return { isDuplicate: true, field: 'email' };
    }

    return { isDuplicate: false, field: '' };
}

async createClient(insertClient: InsertClient): Promise<Client> {
    // Check for duplicates
    const duplicateCheck = await this.isDuplicateContact(insertClient.phone, insertClient.email);
    if (duplicateCheck.isDuplicate) {
      throw new Error(`This ${duplicateCheck.field} is already registered`);
    }

    // Ensure required fields are set with proper formatting
    const clientData = {
      ...insertClient,
      type: "client",
      isCurrentClient: insertClient.isCurrentClient ?? false,
      notes: insertClient.notes || null,
      // Make sure favoriteServices is always an array in the database
      favoriteServices: Array.isArray(insertClient.favoriteServices) && insertClient.favoriteServices.length > 0 
        ? insertClient.favoriteServices 
        : [],
      createdAt: new Date()
    };
    
    console.log('Creating client with data:', clientData);
    const result = await db.insert(clients).values(clientData).returning();
    return result[0];
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }
  
  // Invitation methods
  async createInvitation(insertInvitation: InsertInvitation): Promise<Invitation> {
    try {
      // Check for duplicates
      const duplicateCheck = await this.isDuplicateContact(insertInvitation.phone, insertInvitation.email);
      if (duplicateCheck.isDuplicate) {
        throw new Error(`This ${duplicateCheck.field} is already registered`);
      }

      console.log('DatabaseStorage.createInvitation - Creating new invitation');
      
      // Ensure required fields are set
      const invitationData = {
        ...insertInvitation,
        notes: insertInvitation.notes || null,
        // Make sure favoriteServices is always an array in the database
        favoriteServices: Array.isArray(insertInvitation.favoriteServices) && insertInvitation.favoriteServices.length > 0 
          ? insertInvitation.favoriteServices 
          : [],
        // Ensure we have a sponsor field (required by the database schema)
        sponsor: insertInvitation.sponsor || (insertInvitation.salonId ? 'Unknown Salon' : null),
        // Add the first service date
        firstServiceDate: insertInvitation.firstServiceDate || null,
        status: insertInvitation.status || 'pending',
        createdAt: new Date()
      };
      
      const result = await db.insert(invitations).values(invitationData).returning();
      console.log(`DatabaseStorage.createInvitation - Invitation created with ID ${result[0].id}`);
      return result[0];
    } catch (error) {
      console.error('DatabaseStorage.createInvitation - Error creating invitation:', error);
      throw error;
    }
  }

  async getInvitation(id: number): Promise<Invitation | undefined> {
    try {
      const results = await db.select().from(invitations).where(eq(invitations.id, id));
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error(`DatabaseStorage.getInvitation - Error fetching invitation ${id}:`, error);
      throw error;
    }
  }

  async getRecentInvitations(limit: number = 10): Promise<Invitation[]> {
    try {
      console.log(`DatabaseStorage.getRecentInvitations - Fetching ${limit} recent invitations`);
      
      const result = await db.select()
        .from(invitations)
        .orderBy(invitations.createdAt)
        .limit(limit);
        
      console.log(`DatabaseStorage.getRecentInvitations - Retrieved ${result.length} invitations`);
      return result;
    } catch (error) {
      console.error('DatabaseStorage.getRecentInvitations - Error fetching invitations:', error);
      throw error;
    }
  }

  async getSalonInvitations(salonId: number): Promise<Invitation[]> {
    try {
      console.log(`DatabaseStorage.getSalonInvitations - Fetching invitations for salon ${salonId}`);
      
      const result = await db.select()
        .from(invitations)
        .where(eq(invitations.salonId, salonId))
        .orderBy(invitations.createdAt);
        
      console.log(`DatabaseStorage.getSalonInvitations - Retrieved ${result.length} invitations for salon ${salonId}`);
      return result;
    } catch (error) {
      console.error(`DatabaseStorage.getSalonInvitations - Error fetching invitations for salon ${salonId}:`, error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
