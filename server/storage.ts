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
  getSalonByName(name: string): Promise<Salon | undefined>;
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
  
  // Validation methods
  isDuplicateContact(phone: string, email: string, sponsor?: string, excludeId?: number): Promise<{isDuplicate: boolean, field: string}>;
  validateInvitation(phone: string, email: string, senderId: number): Promise<{isValid: boolean, message?: string}>;
  validateRegistration(phone: string, email: string, excludeId?: number): Promise<{isValid: boolean, message?: string}>;
  
  // Style Selection methods
  createStyleSelection(styleSelection: InsertStyleSelection): Promise<StyleSelection>;
  getStyleSelection(id: number): Promise<StyleSelection | undefined>;
  getSalonStyleSelections(salonId: number): Promise<StyleSelection[]>;
  getClientStyleSelections(clientId: number): Promise<StyleSelection[]>;
  
  // Activity Log methods
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;
  getRecentActivityLogs(limit?: number): Promise<ActivityLog[]>;
  logVmbInvitationSent(clientId: number, salonId: number, styleId: number): Promise<ActivityLog>;
  
  // Schema access methods (for dynamic validation)
  getSalonsTable(): typeof salons;
}

// Copy over all the implementation from old storage.ts then add getSalonsTable method at the end
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
  
  async getSalonByName(name: string): Promise<Salon | undefined> {
    const results = await db.select().from(salons).where(eq(salons.name, name));
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
    
    // Add special debugging for 5125551213
    if (cleanPhone === '5125551213') {
      console.log(`DEBUG: Special check for phone 5125551213`);
      console.log(`DEBUG: Found ${clientPhone.length} matching clients`);
      console.log(`DEBUG: Found ${invitePhone.length} matching invitations`);
      if (invitePhone.length > 0) {
        console.log(`DEBUG: First matching invitation:`, invitePhone[0]);
      }
    }
    
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
    if (sponsor && sponsor.trim() !== '') {
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
    // First check if this is a phone in invitations but not in clients
    if (insertClient.phone) {
      const invitations = await this.getInvitationsByPhone(insertClient.phone);
      const allClients = await db.select().from(clients);
      
      // Standardize phone format for comparison
      const cleanPhone = insertClient.phone.replace(/\D/g, '');
      
      // Check if phone exists in clients
      const clientExists = allClients.some(c => 
        c.phone && c.phone.replace(/\D/g, '') === cleanPhone
      );
      
      // If phone exists in invitations but not in clients, this is a valid registration
      if (invitations.length > 0 && !clientExists) {
        console.log('DatabaseStorage.createClient - Phone exists in invitations but not clients, proceeding with registration');
        // Continue with client creation below
      } else {
        // Check for duplicates using the normal flow
        // Ensure we have strings for the isDuplicateContact function
        const phoneToCheck = insertClient.phone || '';
        const emailToCheck = insertClient.email || '';
        
        const duplicateCheck = await this.isDuplicateContact(phoneToCheck, emailToCheck);
        if (duplicateCheck.isDuplicate) {
          // Enhance the error with more details by creating a custom error object
          const duplicateError = new Error(`This ${duplicateCheck.field} is already registered`);
          
          // Find the existing client record for this duplicate contact
          const existingClients = await db.select().from(clients);
          
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
      }
    }
    
    // Proceed with creating the client
    const result = await db.insert(clients).values({
      ...insertClient,
      createdAt: new Date()
    }).returning();
    
    return result[0];
  }

  async getAllClients(): Promise<Client[]> {
    try {
      console.log('DatabaseStorage.getAllClients - Fetching all clients');
      const result = await db.select().from(clients);
      console.log(`DatabaseStorage.getAllClients - Retrieved ${result.length} clients`);
      return result;
    } catch (error) {
      console.error('DatabaseStorage.getAllClients - Error fetching clients:', error);
      throw error;
    }
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client> {
    console.log(`DatabaseStorage.updateClient - Updating client ID ${id}`);
    
    try {
      // Remove id and createdAt from the update data
      const { id: _, createdAt, ...updateData } = clientData;
      
      const result = await db
        .update(clients)
        .set(updateData)
        .where(eq(clients.id, id))
        .returning();
      
      console.log(`DatabaseStorage.updateClient - Update successful`);
      return result[0];
    } catch (error) {
      console.error('DatabaseStorage.updateClient - Error updating client:', error);
      throw error;
    }
  }

  // Invitation methods
  async createInvitation(insertInvitation: InsertInvitation): Promise<Invitation> {
    console.log(`DatabaseStorage.createInvitation - Creating invitation for ${insertInvitation.name || 'unnamed client'}`);
    
    // Set default values for any missing fields
    const invitationData = {
      ...insertInvitation,
      status: insertInvitation.status || 'pending',
      createdAt: new Date()
    };
    
    try {
      const result = await db.insert(invitations).values(invitationData).returning();
      console.log(`DatabaseStorage.createInvitation - Created invitation with ID ${result[0].id}`);
      
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
      console.error(`DatabaseStorage.getInvitation - Error getting invitation ${id}:`, error);
      throw error;
    }
  }

  async getRecentInvitations(limit: number = 10): Promise<Invitation[]> {
    try {
      console.log(`DatabaseStorage.getRecentInvitations - Fetching ${limit} recent invitations`);
      
      const result = await db.select()
        .from(invitations)
        .orderBy(sql`${invitations.createdAt} DESC`)
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
        .orderBy(sql`${invitations.createdAt} DESC`);
      
      console.log(`DatabaseStorage.getSalonInvitations - Retrieved ${result.length} invitations`);
      return result;
    } catch (error) {
      console.error(`DatabaseStorage.getSalonInvitations - Error fetching invitations for salon ${salonId}:`, error);
      throw error;
    }
  }

  async updateInvitationStatus(id: number, status: string): Promise<Invitation> {
    try {
      console.log(`DatabaseStorage.updateInvitationStatus - Updating invitation ${id} status to ${status}`);
      
      const result = await db
        .update(invitations)
        .set({ status })
        .where(eq(invitations.id, id))
        .returning();
      
      console.log(`DatabaseStorage.updateInvitationStatus - Update successful`);
      return result[0];
    } catch (error) {
      console.error(`DatabaseStorage.updateInvitationStatus - Error updating invitation ${id}:`, error);
      throw error;
    }
  }

  async getInvitationByHash(hash: string): Promise<Invitation | undefined> {
    try {
      console.log(`DatabaseStorage.getInvitationByHash - Searching for invitation with hash: ${hash}`);
      
      // Get invitation with matching hash
      const [invitation] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.inviteHash, hash));
      
      if (invitation) {
        console.log(`DatabaseStorage.getInvitationByHash - Found invitation with ID: ${invitation.id}`);
      } else {
        console.log(`DatabaseStorage.getInvitationByHash - No invitation found with hash ${hash}`);
      }
      
      return invitation;
    } catch (error) {
      console.error(`DatabaseStorage.getInvitationByHash - Error fetching invitation by hash:`, error);
      throw error;
    }
  }

  async getInvitationsByPhone(phone: string | null | undefined, partialMatch: boolean = false): Promise<Invitation[]> {
    try {
      console.log(`DatabaseStorage.getInvitationsByPhone - Fetching invitations with phone ${phone || 'null'} (partialMatch: ${partialMatch})`);
      
      // Handle empty phone cases
      if (!phone) {
        console.log(`DatabaseStorage.getInvitationsByPhone - No phone provided, returning empty array`);
        return [];
      }
      
      // Clean phone number to digits only for comparison
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Get all invitations
      const allInvitations = await db.select().from(invitations);
      
      // Filter based on matching criteria
      let result: Invitation[] = [];
      
      if (partialMatch) {
        // For partial match, check if invitation phone ends with the given digits
        result = allInvitations.filter(invitation => {
          if (!invitation.phone) return false;
          const invitePhone = invitation.phone.replace(/\D/g, '');
          
          // Match if the last N digits match our search
          if (cleanPhone.length <= invitePhone.length) {
            const lastDigits = invitePhone.slice(-cleanPhone.length);
            return lastDigits === cleanPhone;
          }
          return false;
        });
      } else {
        // For exact match, require full phone number match
        result = allInvitations.filter(invitation => 
          invitation.phone && invitation.phone.replace(/\D/g, '') === cleanPhone
        );
      }
      
      console.log(`DatabaseStorage.getInvitationsByPhone - Found ${result.length} matching invitations`);
      return result;
    } catch (error) {
      console.error(`DatabaseStorage.getInvitationsByPhone - Error fetching invitations by phone:`, error);
      throw error;
    }
  }

  // Context-aware validation methods
  
  async validateInvitation(phone: string, email: string, senderId: number): Promise<{isValid: boolean, message?: string}> {
    console.log(`DatabaseStorage.validateInvitation - Validating invitation: phone='${phone}', email='${email}', senderId=${senderId}`);
    
    // Clean the phone number for comparison
    const cleanPhone = phone.replace(/\D/g, '');
    
    try {
      // 1. Get the sender's information (could be client or salon)
      const sender = await this.getClient(senderId);
      if (!sender) {
        console.log(`DatabaseStorage.validateInvitation - Sender ID ${senderId} not found`);
        return { isValid: false, message: "Invalid sender" };
      }
      
      // 2. Check if the sender is trying to invite themselves
      if (sender.phone && sender.phone.replace(/\D/g, '') === cleanPhone) {
        console.log(`DatabaseStorage.validateInvitation - Sender trying to invite themselves`);
        return { isValid: false, message: "You cannot invite yourself" };
      }
      
      if (email && sender.email && sender.email.toLowerCase() === email.toLowerCase()) {
        console.log(`DatabaseStorage.validateInvitation - Sender trying to invite their own email`);
        return { isValid: false, message: "You cannot invite yourself" };
      }
      
      // 3. Get all clients and salons for checking duplicates
      const allClients = await db.select().from(clients);
      const allSalons = await db.select().from(salons);
      
      // 4. Check if the phone number is already registered as a client
      // Exception: We DO allow sending invitations to people who have pending invitations
      if (cleanPhone) {
        const existingClient = allClients.find(client => 
          client.phone && client.phone.replace(/\D/g, '') === cleanPhone
        );
        
        if (existingClient) {
          console.log(`DatabaseStorage.validateInvitation - Phone already registered as client: ${cleanPhone}`);
          return { isValid: false, message: "This phone is already registered as a client" };
        }
        
        // Check if phone belongs to a salon
        const existingSalon = allSalons.find(salon => 
          salon.phone && salon.phone.replace(/\D/g, '') === cleanPhone
        );
        
        if (existingSalon) {
          console.log(`DatabaseStorage.validateInvitation - Phone already registered as salon: ${cleanPhone}`);
          return { isValid: false, message: "This phone is already registered as a salon" };
        }
      }
      
      // 5. Check if the email is already registered
      if (email && email.trim() !== '') {
        const normalizedEmail = email.toLowerCase();
        
        const existingClientEmail = allClients.find(client => 
          client.email && client.email.toLowerCase() === normalizedEmail
        );
        
        if (existingClientEmail) {
          console.log(`DatabaseStorage.validateInvitation - Email already registered as client: ${email}`);
          return { isValid: false, message: "This email is already registered as a client" };
        }
        
        const existingSalonEmail = allSalons.find(salon => 
          salon.email && salon.email.toLowerCase() === normalizedEmail
        );
        
        if (existingSalonEmail) {
          console.log(`DatabaseStorage.validateInvitation - Email already registered as salon: ${email}`);
          return { isValid: false, message: "This email is already registered as a salon" };
        }
      }
      
      // If we made it here, the invitation is valid
      console.log(`DatabaseStorage.validateInvitation - Invitation is valid`);
      return { isValid: true };
    } catch (error) {
      console.error('DatabaseStorage.validateInvitation - Error validating invitation:', error);
      return { isValid: false, message: "Error validating invitation" };
    }
  }
  
  async validateRegistration(phone: string, email: string, excludeId?: number): Promise<{isValid: boolean, message?: string}> {
    console.log(`DatabaseStorage.validateRegistration - Validating registration: phone='${phone}', email='${email}'`);
    
    try {
      // For registration, we want to be strict about duplicates
      const duplicateCheck = await this.isDuplicateContact(phone, email, undefined, excludeId);
      
      if (duplicateCheck.isDuplicate) {
        console.log(`DatabaseStorage.validateRegistration - Duplicate ${duplicateCheck.field} detected`);
        return { 
          isValid: false, 
          message: `This ${duplicateCheck.field} is already registered` 
        };
      }
      
      // If we made it here, the registration is valid
      console.log(`DatabaseStorage.validateRegistration - Registration is valid`);
      return { isValid: true };
    } catch (error) {
      console.error('DatabaseStorage.validateRegistration - Error validating registration:', error);
      return { isValid: false, message: "Error validating registration" };
    }
  }

  // Style Selection methods
  async createStyleSelection(insertStyleSelection: InsertStyleSelection): Promise<StyleSelection> {
    try {
      console.log(`DatabaseStorage.createStyleSelection - Creating style selection for client ${insertStyleSelection.clientId}`);
      
      // Set default values if needed
      const styleSelectionData = {
        ...insertStyleSelection,
        status: insertStyleSelection.status || "selected",
        selectedAt: insertStyleSelection.selectedAt || new Date()
      };
      
      const result = await db.insert(styleSelections).values(styleSelectionData).returning();
      console.log(`DatabaseStorage.createStyleSelection - Created style selection with ID ${result[0].id}`);
      
      return result[0];
    } catch (error) {
      console.error('DatabaseStorage.createStyleSelection - Error creating style selection:', error);
      throw error;
    }
  }

  async getStyleSelection(id: number): Promise<StyleSelection | undefined> {
    try {
      const results = await db.select().from(styleSelections).where(eq(styleSelections.id, id));
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error(`DatabaseStorage.getStyleSelection - Error getting style selection ${id}:`, error);
      throw error;
    }
  }

  async getSalonStyleSelections(salonId: number): Promise<StyleSelection[]> {
    try {
      console.log(`DatabaseStorage.getSalonStyleSelections - Fetching style selections for salon ${salonId}`);
      
      const result = await db.select()
        .from(styleSelections)
        .where(eq(styleSelections.salonId, salonId))
        .orderBy(sql`${styleSelections.selectedAt} DESC`);
      
      console.log(`DatabaseStorage.getSalonStyleSelections - Retrieved ${result.length} style selections`);
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
        .orderBy(sql`${styleSelections.selectedAt} DESC`);
      
      console.log(`DatabaseStorage.getClientStyleSelections - Retrieved ${result.length} style selections`);
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
      
      // Set default timestamp if not provided
      const logData = {
        ...insertActivityLog,
        timestamp: insertActivityLog.timestamp || new Date()
      };
      
      const result = await db.insert(activityLogs).values(logData).returning();
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
        .orderBy(sql`${activityLogs.timestamp} DESC`)
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
      
      // Get client and salon for better description
      const [client, salon] = await Promise.all([
        this.getClient(clientId),
        this.getSalon(salonId)
      ]);
      
      if (!client || !salon) {
        throw new Error(`Client or salon not found: clientId=${clientId}, salonId=${salonId}`);
      }
      
      // Create detailed activity log
      const log = {
        type: "vmb_invitation_sent",
        description: `New VMB invitation sent by ${client.name} for ${salon.name} style #${styleId}`,
        clientId,
        salonId,
        timestamp: new Date()
      };
      
      const result = await this.createActivityLog(log);
      console.log(`DatabaseStorage.logVmbInvitationSent - Activity log created with ID ${result.id}`);
      
      return result;
    } catch (error) {
      console.error('DatabaseStorage.logVmbInvitationSent - Error logging VMB invitation:', error);
      throw error;
    }
  }
  
  // Schema access method for dynamic validation
  getSalonsTable(): typeof salons {
    return salons;
  }
}

export const storage = new DatabaseStorage();