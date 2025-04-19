import { 
  users, type User, type InsertUser,
  salons, type Salon, type InsertSalon,
  clients, type Client, type InsertClient,
  invitations, type Invitation, type InsertInvitation,
  styleSelections, type StyleSelection, type InsertStyleSelection,
  activityLogs, type ActivityLog, type InsertActivityLog
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

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
  updateSalon(id: number, salonData: Partial<Salon>): Promise<Salon>;
  
  // Client methods
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  getAllClients(): Promise<Client[]>;
  updateClient(id: number, clientData: Partial<Client>): Promise<Client>;
  
  // Invitation methods
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitation(id: number): Promise<Invitation | undefined>;
  getRecentInvitations(limit?: number): Promise<Invitation[]>;
  getSalonInvitations(salonId: number): Promise<Invitation[]>;
  updateInvitationStatus(id: number, status: string): Promise<Invitation>;
  getInvitationsByPhone(phone: string, partialMatch?: boolean): Promise<Invitation[]>;
  getInvitationByHash(hash: string): Promise<Invitation | undefined>;
  
  // Style Selection methods
  createStyleSelection(styleSelection: InsertStyleSelection): Promise<StyleSelection>;
  getStyleSelection(id: number): Promise<StyleSelection | undefined>;
  getSalonStyleSelections(salonId: number): Promise<StyleSelection[]>;
  getClientStyleSelections(clientId: number): Promise<StyleSelection[]>;
  
  // Activity Log methods
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivityLogs(limit?: number): Promise<ActivityLog[]>;
  logVmbInvitationSent(clientId: number, salonId: number, styleId: number): Promise<ActivityLog>;
}

export class DatabaseStorage implements IStorage {
  // Implementation of new methods will be added here
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
      // Remove id and createdAt from the update data (can't update primary key or timestamp in wrong format)
      const { id: _, createdAt, ...updateData } = salonData;
      
      // Debug: Check specifically for the owner photo URL
      console.log(`DatabaseStorage.updateSalon - Photo URL in update:`, 
                 updateData.ownerPhotoUrl || 'No photo URL provided');
      
      console.log(`DatabaseStorage.updateSalon - Full update data fields:`, 
                 Object.keys(updateData).join(', '));
      
      console.log(`DatabaseStorage.updateSalon - Cleaned update data:`, JSON.stringify(updateData));
      
      // Get current salon data to check changes
      const currentSalon = await this.getSalon(id);
      console.log(`DatabaseStorage.updateSalon - Current ownerPhotoUrl:`, 
                 currentSalon?.ownerPhotoUrl || 'None');
      
      const result = await db
        .update(salons)
        .set(updateData)
        .where(eq(salons.id, id))
        .returning();
      
      console.log(`DatabaseStorage.updateSalon - Update successful`);
      console.log(`DatabaseStorage.updateSalon - New ownerPhotoUrl:`, 
                 result[0].ownerPhotoUrl || 'None');
                 
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
    console.log(`DatabaseStorage.isDuplicateContact - Checking: phone='${phone}', email='${email}'`);
    
    // Standardize phone format - get only digits for comparison
    const cleanPhone = phone.replace(/\D/g, '');
    console.log(`DatabaseStorage.isDuplicateContact - Standardized phone (digits only): '${cleanPhone}'`);
    
    // Get all clients, invitations, and salons
    const allClients = await db.select().from(clients);
    const allInvitations = await db.select().from(invitations);
    const allSalons = await db.select().from(salons);
    
    // Filter clients with matching phone (removing formatting)
    const clientPhone = allClients.filter(client => 
      client.phone && client.phone.replace(/\D/g, '') === cleanPhone
    );
    console.log(`DatabaseStorage.isDuplicateContact - Clients found with same phone: ${clientPhone.length}`);
    if (clientPhone.length > 0) {
      console.log(`DatabaseStorage.isDuplicateContact - Matching client record:`, clientPhone[0]);
    }
    
    // Filter invitations with matching phone (removing formatting)
    const invitePhone = allInvitations.filter(invitation => 
      invitation.phone && invitation.phone.replace(/\D/g, '') === cleanPhone
    );
    console.log(`DatabaseStorage.isDuplicateContact - Invitations found with same phone: ${invitePhone.length}`);
    
    // Filter salons with matching phone (removing formatting)
    const salonPhone = allSalons.filter(salon => 
      salon.phone && salon.phone.replace(/\D/g, '') === cleanPhone
    );
    console.log(`DatabaseStorage.isDuplicateContact - Salons found with same phone: ${salonPhone.length}`);
    
    // For email, implement case-insensitive comparison using filter
    // We already have allClients, allInvitations, and allSalons from above
    
    let clientEmail: Client[] = [];
    let inviteEmail: Invitation[] = [];
    let salonEmail: Salon[] = [];
    
    if (email && email.trim() !== '') {
      // Standardize email format (lowercase for comparison)
      const lowercaseEmail = email.toLowerCase();
      console.log(`DatabaseStorage.isDuplicateContact - Standardized email (lowercase): '${lowercaseEmail}'`);
      
      // Filter clients with matching email (case-insensitive)
      clientEmail = allClients.filter(client =>
        client.email && client.email.toLowerCase() === lowercaseEmail
      );
      console.log(`DatabaseStorage.isDuplicateContact - Clients found with same email: ${clientEmail.length}`);
      if (clientEmail.length > 0) {
        console.log(`DatabaseStorage.isDuplicateContact - Matching client record:`, clientEmail[0]);
      }
      
      // Filter invitations with matching email (case-insensitive)
      inviteEmail = allInvitations.filter(invitation =>
        invitation.email && invitation.email.toLowerCase() === lowercaseEmail
      );
      console.log(`DatabaseStorage.isDuplicateContact - Invitations found with same email: ${inviteEmail.length}`);
      
      // Filter salons with matching email (case-insensitive)
      salonEmail = allSalons.filter(salon =>
        salon.email && salon.email.toLowerCase() === lowercaseEmail
      );
      console.log(`DatabaseStorage.isDuplicateContact - Salons found with same email: ${salonEmail.length}`);
    } else {
      console.log(`DatabaseStorage.isDuplicateContact - No email provided, skipping email check`);
    }

    // Check sponsor duplication
    if (sponsor) {
      const sponsorExists = await db.select()
        .from(invitations)
        .where(eq(invitations.sponsor, sponsor))
        .limit(1);
        
      if (sponsorExists.length > 0) {
        console.log(`DatabaseStorage.isDuplicateContact - Duplicate sponsor found: ${sponsor}`);
        return { isDuplicate: true, field: 'sponsor' };
      }
    }

    // Check for duplicate phone in client, invitations, or salons
    // Only check if a non-empty phone is provided
    if (cleanPhone && cleanPhone.length > 0) {
      if ((clientPhone.length > 0 && (excludeId === undefined || clientPhone[0].id !== excludeId)) || 
          invitePhone.length > 0 || 
          salonPhone.length > 0) {
        console.log(`DatabaseStorage.isDuplicateContact - DUPLICATE PHONE DETECTED: ${cleanPhone}`);
        return { isDuplicate: true, field: 'phone' };
      }
    } else {
      console.log('DatabaseStorage.isDuplicateContact - Empty phone provided, skipping phone duplicate check');
    }
    
    // Check for duplicate email in client, invitations, or salons
    if (email && email.trim().length > 0) {
      if ((clientEmail.length > 0 && (excludeId === undefined || clientEmail[0].id !== excludeId)) || 
          inviteEmail.length > 0 || 
          salonEmail.length > 0) {
        console.log(`DatabaseStorage.isDuplicateContact - DUPLICATE EMAIL DETECTED: ${email.toLowerCase()}`);
        return { isDuplicate: true, field: 'email' };
      }
    } else {
      console.log('DatabaseStorage.isDuplicateContact - Empty email provided, skipping email duplicate check');
    }

    return { isDuplicate: false, field: '' };
}

async createClient(insertClient: InsertClient): Promise<Client> {
    // Check for duplicates
    const duplicateCheck = await this.isDuplicateContact(insertClient.phone, insertClient.email);
    if (duplicateCheck.isDuplicate) {
      // Enhance the error with more details by creating a custom error object
      const duplicateError = new Error(`This ${duplicateCheck.field} is already registered`);
      
      // Find the existing client record for this duplicate contact
      const existingClients = await db.select().from(clients);
      
      // Standardize phone format for comparison
      const cleanPhone = insertClient.phone?.replace(/\D/g, '');
      
      // Find matching client based on the duplicate field
      let existingClient: Client | undefined;
      
      if (duplicateCheck.field === 'phone' && cleanPhone) {
        existingClient = existingClients.find(c => 
          c.phone && c.phone.replace(/\D/g, '') === cleanPhone
        );
      } else if (duplicateCheck.field === 'email' && insertClient.email) {
        const lowercaseEmail = insertClient.email.toLowerCase();
        existingClient = existingClients.find(c => 
          c.email && c.email.toLowerCase() === lowercaseEmail
        );
      }
      
      // Add custom properties to the error for better handling in routes
      (duplicateError as any).status = 'duplicate';
      (duplicateError as any).field = duplicateCheck.field;
      (duplicateError as any).client = existingClient;
      
      throw duplicateError;
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
  
  async updateClient(id: number, clientData: Partial<Client>): Promise<Client> {
    console.log(`DatabaseStorage.updateClient - Updating client ID ${id}`);
    
    try {
      // Remove id and createdAt from the update data (can't update primary key or timestamp in wrong format)
      const { id: _, createdAt, ...updateData } = clientData;
      
      // Debug: Check specifically for the photo URL
      console.log(`DatabaseStorage.updateClient - Photo URL in update:`, 
                 updateData.photoUrl || 'No photo URL provided');
      
      console.log(`DatabaseStorage.updateClient - Full update data fields:`, 
                 Object.keys(updateData).join(', '));
      
      console.log(`DatabaseStorage.updateClient - Cleaned update data:`, JSON.stringify(updateData));
      
      // Get current client data to check changes
      const currentClient = await this.getClient(id);
      console.log(`DatabaseStorage.updateClient - Current photoUrl:`, 
                 currentClient?.photoUrl || 'None');
      
      const result = await db
        .update(clients)
        .set(updateData)
        .where(eq(clients.id, id))
        .returning();
      
      console.log(`DatabaseStorage.updateClient - Update successful`);
      console.log(`DatabaseStorage.updateClient - New photoUrl:`, 
                 result[0].photoUrl || 'None');
                 
      return result[0];
    } catch (error) {
      console.error('DatabaseStorage.updateClient - Error updating client:', error);
      throw error;
    }
  }
  
  // Invitation methods
  async createInvitation(insertInvitation: InsertInvitation): Promise<Invitation> {
    try {
      // Check for duplicates
      const duplicateCheck = await this.isDuplicateContact(insertInvitation.phone, insertInvitation.email);
      if (duplicateCheck.isDuplicate) {
        if (duplicateCheck.field === 'phone') {
          throw new Error(`This phone is already registered`);
        } else if (duplicateCheck.field === 'email') {
          throw new Error(`This email is already registered`);
        } else {
          throw new Error(`This ${duplicateCheck.field} is already registered`);
        }
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
  
  async updateInvitationStatus(id: number, status: string): Promise<Invitation> {
    try {
      console.log(`DatabaseStorage.updateInvitationStatus - Updating invitation ${id} status to ${status}`);
      
      const result = await db.update(invitations)
        .set({ status })
        .where(eq(invitations.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error(`Invitation with ID ${id} not found`);
      }
      
      console.log(`DatabaseStorage.updateInvitationStatus - Updated invitation ${id} status to ${status}`);
      return result[0];
    } catch (error) {
      console.error(`DatabaseStorage.updateInvitationStatus - Error updating invitation ${id}:`, error);
      throw error;
    }
  }
  
  async getInvitationsByPhone(phone: string, partialMatch: boolean = false): Promise<Invitation[]> {
    try {
      console.log(`DatabaseStorage.getInvitationsByPhone - Searching for invitations with phone: ${phone} (partial match: ${partialMatch})`);
      
      // Get all invitations first
      const allInvitations = await db.select().from(invitations);
      let matchingInvitations: Invitation[] = [];
      
      // Clean the provided phone number for comparison
      const cleanPhone = phone.replace(/\D/g, '');
      console.log(`DatabaseStorage.getInvitationsByPhone - Cleaned phone for search: ${cleanPhone}`);
      
      // Filter invitations based on matching logic
      if (partialMatch) {
        // Partial match - looking for phones that end with the provided digits
        console.log(`DatabaseStorage.getInvitationsByPhone - Using partial match mode - looking for last digits: ${cleanPhone}`);
        matchingInvitations = allInvitations.filter(invitation => {
          if (!invitation.phone) return false;
          const invitationCleanPhone = invitation.phone.replace(/\D/g, '');
          return invitationCleanPhone.endsWith(cleanPhone);
        });
      } else {
        // Exact match - full phone number must match
        console.log(`DatabaseStorage.getInvitationsByPhone - Using exact match mode`);
        matchingInvitations = allInvitations.filter(invitation => {
          if (!invitation.phone) return false;
          const invitationCleanPhone = invitation.phone.replace(/\D/g, '');
          return invitationCleanPhone === cleanPhone;
        });
      }
      
      console.log(`DatabaseStorage.getInvitationsByPhone - Found ${matchingInvitations.length} matching invitations`);
      
      // Order by creation date
      return matchingInvitations.sort((a, b) => {
        // Handle null dates by treating them as older than any valid date
        if (!a.createdAt) return 1;  // a is older (null date)
        if (!b.createdAt) return -1; // b is older (null date)
        
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });
    } catch (error) {
      console.error(`DatabaseStorage.getInvitationsByPhone - Error fetching invitations by phone:`, error);
      throw error;
    }
  }
  
  async getInvitationByHash(hash: string): Promise<Invitation | undefined> {
    try {
      console.log(`DatabaseStorage.getInvitationByHash - Searching for invitation with hash: ${hash}`);
      
      // Query for invitation with matching hash
      const [invitation] = await db.select()
        .from(invitations)
        .where(eq(invitations.inviteHash, hash));
      
      if (invitation) {
        console.log(`DatabaseStorage.getInvitationByHash - Found invitation with ID ${invitation.id}`);
      } else {
        console.log(`DatabaseStorage.getInvitationByHash - No invitation found with hash ${hash}`);
      }
      
      return invitation;
    } catch (error) {
      console.error(`DatabaseStorage.getInvitationByHash - Error fetching invitation by hash:`, error);
      throw error;
    }
  }
  
  // Style Selection methods
  async createStyleSelection(insertStyleSelection: InsertStyleSelection): Promise<StyleSelection> {
    try {
      console.log(`DatabaseStorage.createStyleSelection - Creating style selection for client ${insertStyleSelection.clientId}`);
      
      const styleSelectionData = {
        ...insertStyleSelection,
        selectedAt: insertStyleSelection.selectedAt || new Date().toISOString()
      };
      
      const result = await db.insert(styleSelections)
        .values(styleSelectionData)
        .returning();
      
      console.log(`DatabaseStorage.createStyleSelection - Created style selection with ID ${result[0].id}`);
      return result[0];
    } catch (error) {
      console.error('DatabaseStorage.createStyleSelection - Error creating style selection:', error);
      throw error;
    }
  }
  
  async getStyleSelection(id: number): Promise<StyleSelection | undefined> {
    try {
      const results = await db.select()
        .from(styleSelections)
        .where(eq(styleSelections.id, id));
      
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error(`DatabaseStorage.getStyleSelection - Error fetching style selection ${id}:`, error);
      throw error;
    }
  }
  
  async getSalonStyleSelections(salonId: number): Promise<StyleSelection[]> {
    try {
      console.log(`DatabaseStorage.getSalonStyleSelections - Fetching style selections for salon ${salonId}`);
      
      const result = await db.select()
        .from(styleSelections)
        .where(eq(styleSelections.salonId, salonId))
        .orderBy(styleSelections.selectedAt);
      
      console.log(`DatabaseStorage.getSalonStyleSelections - Retrieved ${result.length} style selections for salon ${salonId}`);
      return result;
    } catch (error) {
      console.error(`DatabaseStorage.getSalonStyleSelections - Error fetching style selections for salon ${salonId}:`, error);
      throw error;
    }
  }
  
  async getClientStyleSelections(clientId: number): Promise<StyleSelection[]> {
    try {
      console.log(`DatabaseStorage.getClientStyleSelections - Fetching style selections for client ${clientId}`);
      
      const result = await db.select()
        .from(styleSelections)
        .where(eq(styleSelections.clientId, clientId))
        .orderBy(styleSelections.selectedAt);
      
      console.log(`DatabaseStorage.getClientStyleSelections - Retrieved ${result.length} style selections for client ${clientId}`);
      return result;
    } catch (error) {
      console.error(`DatabaseStorage.getClientStyleSelections - Error fetching style selections for client ${clientId}:`, error);
      throw error;
    }
  }
  
  // Activity Log methods
  async createActivityLog(insertActivityLog: InsertActivityLog): Promise<ActivityLog> {
    try {
      console.log(`DatabaseStorage.createActivityLog - Creating activity log of type ${insertActivityLog.type}`);
      
      const activityLogData = {
        ...insertActivityLog,
        timestamp: insertActivityLog.timestamp || new Date().toISOString()
      };
      
      const result = await db.insert(activityLogs)
        .values(activityLogData)
        .returning();
      
      console.log(`DatabaseStorage.createActivityLog - Created activity log with ID ${result[0].id}`);
      return result[0];
    } catch (error) {
      console.error('DatabaseStorage.createActivityLog - Error creating activity log:', error);
      throw error;
    }
  }
  
  async getRecentActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    try {
      console.log(`DatabaseStorage.getRecentActivityLogs - Fetching ${limit} recent activity logs`);
      
      const result = await db.select()
        .from(activityLogs)
        .orderBy(activityLogs.timestamp)
        .limit(limit);
      
      console.log(`DatabaseStorage.getRecentActivityLogs - Retrieved ${result.length} activity logs`);
      return result;
    } catch (error) {
      console.error('DatabaseStorage.getRecentActivityLogs - Error fetching activity logs:', error);
      throw error;
    }
  }
  
  async logVmbInvitationSent(clientId: number, salonId: number, styleId: number): Promise<ActivityLog> {
    try {
      console.log(`DatabaseStorage.logVmbInvitationSent - Logging VMB invitation from client ${clientId} for salon ${salonId} with style ${styleId}`);
      
      // Get client and salon info
      const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
      const [salon] = await db.select().from(salons).where(eq(salons.id, salonId));
      
      if (!client || !salon) {
        throw new Error('Client or salon not found');
      }
      
      // Create activity log
      const logEntry: InsertActivityLog = {
        type: 'vmb_invitation',
        description: `New VMB invitation sent by ${client.name} for ${salon.name} style #${styleId}`,
        clientId: clientId,
        salonId: salonId,
        timestamp: new Date()
      };
      
      const result = await this.createActivityLog(logEntry);
      console.log(`DatabaseStorage.logVmbInvitationSent - Activity log created with ID ${result.id}`);
      return result;
    } catch (error) {
      console.error('DatabaseStorage.logVmbInvitationSent - Error logging VMB invitation:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
