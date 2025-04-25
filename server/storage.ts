import { 
  users, type User, type InsertUser,
  salons, type Salon, type InsertSalon,
  clients, type Client, type InsertClient,
  invitations, type Invitation, type InsertInvitation,
  styleSelections, type StyleSelection, type InsertStyleSelection,
  activityLogs, type ActivityLog, type InsertActivityLog
} from "@shared/schema";
import { db, pool } from "./db";
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
  
  // Gift tracking methods for invitation lifecycle
  updateGiftStatus(invitationId: number, status: string, styleId?: number): Promise<Invitation>;
  trackGiftRedemption(invitationId: number, clientId: number, salonId: number): Promise<ActivityLog>;
  postToClientDashboard(invitationId: number): Promise<boolean>;
  postToSalonDashboard(invitationId: number): Promise<boolean>;
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
      // For clients, we only care about existing clients or salons with the same phone
      // We don't consider invitations as duplicates for client registration
      if ((clientPhone.length > 0 && (excludeId === undefined || clientPhone[0].id !== excludeId)) || 
          salonPhone.length > 0) {
        console.log(`DatabaseStorage.isDuplicateContact - DUPLICATE PHONE DETECTED: ${cleanPhone}`);
        return { isDuplicate: true, field: 'phone' };
      }
      
      // Log invitation info but don't treat as duplicate for registration
      if (invitePhone.length > 0) {
        console.log(`DatabaseStorage.isDuplicateContact - Phone exists in invitations but NOT treating as duplicate for registration: ${cleanPhone}`);
      }
    } else {
      console.log('DatabaseStorage.isDuplicateContact - Empty phone provided, skipping phone duplicate check');
    }
    
    // Check for duplicate email in client, invitations, or salons
    if (email && email.trim().length > 0) {
      // For clients, we only care about existing clients or salons with the same email
      // We don't consider invitations as duplicates for client registration
      if ((clientEmail.length > 0 && (excludeId === undefined || clientEmail[0].id !== excludeId)) || 
          salonEmail.length > 0) {
        console.log(`DatabaseStorage.isDuplicateContact - DUPLICATE EMAIL DETECTED: ${email.toLowerCase()}`);
        return { isDuplicate: true, field: 'email' };
      }
      
      // Log invitation info but don't treat as duplicate for registration
      if (inviteEmail.length > 0) {
        console.log(`DatabaseStorage.isDuplicateContact - Email exists in invitations but NOT treating as duplicate for registration: ${email.toLowerCase()}`);
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
      
      // If phone exists in invitations but not in clients, this is a valid registration from an invitation
      if (invitations.length > 0 && !clientExists) {
        console.log('DatabaseStorage.createClient - Phone exists in invitations but not clients, proceeding with registration from invitation');
        
        // Set sponsorship info from the invitation
        // Get the most recent invitation for this phone
        const mostRecentInvitation = invitations.reduce((latest, current) => {
          if (!latest) return current;
          if (!latest.createdAt || !current.createdAt) return latest;
          return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
        }, null as Invitation | null);
        
        if (mostRecentInvitation) {
          console.log(`DatabaseStorage.createClient - Using invitation data for sponsorship: invitation ID ${mostRecentInvitation.id}`);
          
          // If the invitation has a salonId, use it as the sponsorSalonId
          if (mostRecentInvitation.salonId) {
            insertClient.sponsorSalonId = mostRecentInvitation.salonId;
            console.log(`DatabaseStorage.createClient - Setting sponsorSalonId to ${mostRecentInvitation.salonId} from invitation`);
          }
          
          // If the invitation has a senderId (client who sent the invitation), note the sponsor relationship
          if (mostRecentInvitation.senderId) {
            // This client was invited by another client, so we should get the original client's salon
            const senderClient = await this.getClient(mostRecentInvitation.senderId);
            
            if (senderClient) {
              insertClient.sponsorName = senderClient.name;
              console.log(`DatabaseStorage.createClient - Setting sponsorName to ${senderClient.name} from invitation sender`);
              
              // If no salonId is set yet but sender has a salon, use that
              if (!insertClient.salonId && senderClient.salonId) {
                insertClient.salonId = senderClient.salonId;
                console.log(`DatabaseStorage.createClient - Setting salonId to ${senderClient.salonId} from invitation sender's salon`);
              }
            }
          } else if (mostRecentInvitation.sponsor) {
            // Set the sponsor name from the invitation
            insertClient.sponsorName = mostRecentInvitation.sponsor;
            console.log(`DatabaseStorage.createClient - Setting sponsorName to ${mostRecentInvitation.sponsor} from invitation`);
          }
          
          // Update invitation status to accepted
          if (mostRecentInvitation.id) {
            try {
              await this.updateInvitationStatus(mostRecentInvitation.id, 'accepted');
              console.log(`DatabaseStorage.createClient - Updated invitation ${mostRecentInvitation.id} status to 'accepted'`);
            } catch (error) {
              console.error(`DatabaseStorage.createClient - Error updating invitation status: ${error}`);
              // Continue with client creation even if updating invitation fails
            }
          }
        }
        
        // Continue with client creation below, with updated sponsorship info
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
    
    // Log client creation with sponsor information
    if (result[0].sponsorName || result[0].sponsorSalonId) {
      console.log(`DatabaseStorage.createClient - Created client with ID ${result[0].id} and sponsor: ${result[0].sponsorName || 'none'}, sponsorSalonId: ${result[0].sponsorSalonId || 'none'}`);
    } else {
      console.log(`DatabaseStorage.createClient - Created client with ID ${result[0].id} (no sponsor information)`);
    }
    
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
    
    // Get information about the sender if senderId is provided
    let senderInfo: Client | undefined = undefined;
    if (insertInvitation.senderId) {
      try {
        senderInfo = await this.getClient(insertInvitation.senderId);
        if (senderInfo) {
          console.log(`DatabaseStorage.createInvitation - Sender is client ${senderInfo.name} (ID: ${senderInfo.id})`);
        } else {
          console.log(`DatabaseStorage.createInvitation - Sender client with ID ${insertInvitation.senderId} not found`);
        }
      } catch (error) {
        console.error(`DatabaseStorage.createInvitation - Error getting sender info:`, error);
        // Continue without sender info if we can't get it
      }
    }
    
    // Determine sponsor based on context
    // If this is a client-sent invitation (senderId is set), the sender is the sponsor
    let sponsorName = insertInvitation.sponsor || 'Ven Me, Baby! LTD';
    
    if (senderInfo) {
      // Client is sending invitation, they become the sponsor
      sponsorName = senderInfo.name;
      
      // If salonId is not explicitly provided, use the sender's salon if available
      if (!insertInvitation.salonId && senderInfo.salonId) {
        insertInvitation.salonId = senderInfo.salonId;
        console.log(`DatabaseStorage.createInvitation - Using sender's salon ID: ${senderInfo.salonId}`);
      } else if (!insertInvitation.salonId && senderInfo.sponsorSalonId) {
        // If no direct salon ID, use the client's sponsor salon ID
        insertInvitation.salonId = senderInfo.sponsorSalonId;
        console.log(`DatabaseStorage.createInvitation - Using sender's sponsor salon ID: ${senderInfo.sponsorSalonId}`);
      } else if (!insertInvitation.salonId) {
        // Default to VMB LTD (ID 43 - assuming this is the VMB LTD salon ID based on your comments)
        insertInvitation.salonId = 43; // VMB LTD salon ID
        console.log(`DatabaseStorage.createInvitation - Using default VMB LTD salon ID: 43`);
      }
    }
    
    // Generate a unique invite hash if not provided
    if (!insertInvitation.inviteHash) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      insertInvitation.inviteHash = `VMB-INV-${random}-${timestamp}`;
      console.log(`DatabaseStorage.createInvitation - Generated invite hash: ${insertInvitation.inviteHash}`);
    }
    
    // Set default values for any missing fields
    const invitationData = {
      ...insertInvitation,
      sponsor: sponsorName || 'Ven Me, Baby! LTD',
      status: insertInvitation.status || 'pending',
      createdAt: new Date()
    };
    
    try {
      // Use a safe approach with raw SQL to handle potential missing columns
      const client = await pool.connect();
      
      try {
        // First, check if the sender_id column exists
        const columnCheckResult = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'invitations' 
          AND column_name = 'sender_id'
        `);
        
        const senderIdColumnExists = columnCheckResult.rowCount ? columnCheckResult.rowCount > 0 : false;
        console.log(`DatabaseStorage.createInvitation - sender_id column exists: ${senderIdColumnExists}`);
        
        // Prepare basic columns that we know exist
        let columns = [
          'name', 'phone', 'email', 'notes', 
          'salon_id', 'sponsor', 'invite_hash', 
          'status', 'first_service_date', 'created_at'
        ];
        
        // Prepare values array
        let values = [
          invitationData.name, 
          invitationData.phone, 
          invitationData.email, 
          invitationData.notes, 
          invitationData.salonId, 
          invitationData.sponsor, 
          invitationData.inviteHash,
          invitationData.status, 
          invitationData.firstServiceDate, 
          invitationData.createdAt
        ];
        
        // Add message if provided
        if (invitationData.message) {
          columns.push('message');
          values.push(invitationData.message);
          console.log(`DatabaseStorage.createInvitation - Including message: "${invitationData.message.substring(0, 30)}..."`);
        }
        
        // Add type if provided
        if (invitationData.type) {
          columns.push('type');
          values.push(invitationData.type);
          console.log(`DatabaseStorage.createInvitation - Setting invitation type: ${invitationData.type}`);
        }
        
        // Add favorite_services if provided
        if (invitationData.favoriteServices) {
          columns.push('favorite_services');
          values.push(JSON.stringify(invitationData.favoriteServices));
        }
        
        // Add sender_id if the column exists and senderId is provided
        if (senderIdColumnExists && invitationData.senderId) {
          columns.push('sender_id');
          values.push(invitationData.senderId);
        }
        
        // Create placeholders for the query ($1, $2, etc.)
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
        
        // Build and execute the insert query
        const sqlQuery = `
          INSERT INTO invitations (${columns.join(', ')})
          VALUES (${placeholders})
          RETURNING *
        `;
        
        const result = await client.query(sqlQuery, values);
        
        if (result.rowCount === 0) {
          throw new Error("Failed to create invitation, no rows returned");
        }
        
        const row = result.rows[0];
        console.log(`DatabaseStorage.createInvitation - Created invitation with ID ${row.id}`);
        
        // Convert DB result to Invitation type with senderId
        const invitation: Invitation = {
          id: row.id,
          name: row.name,
          phone: row.phone,
          email: row.email,
          notes: row.notes,
          message: row.message || null,
          type: row.type || null,
          salonId: row.salon_id,
          sponsor: row.sponsor,
          inviteHash: row.invite_hash,
          status: row.status,
          firstServiceDate: row.first_service_date,
          createdAt: row.created_at,
          favoriteServices: row.favorite_services,
          // Add the senderId property, using row value if column exists or provided value
          senderId: (senderIdColumnExists && row.sender_id) ? row.sender_id : invitationData.senderId || null
        };
        
        return invitation;
      } finally {
        // Make sure to release the client back to the pool
        client.release();
      }
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
      
      // Use a raw SQL query that only selects columns we know exist
      // This is safer than using the Drizzle model which may include fields not yet in DB
      const sqlQuery = `
        SELECT 
            id, name, phone, email, notes, message, type,
            salon_id, sponsor, invite_hash, status, 
            first_service_date, created_at, 
            favorite_services, sender_id
        FROM invitations 
        WHERE salon_id = $1
        ORDER BY created_at DESC
      `;
      
      const client = await pool.connect();
      try {
        const result = await client.query(sqlQuery, [salonId]);
        const rows = result.rows;
        console.log(`DatabaseStorage.getSalonInvitations - Retrieved ${rows.length} invitations`);
        
        // Map the result to our expected format with all fields
        const invitationList: Invitation[] = rows.map(row => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          email: row.email,
          notes: row.notes,
          message: row.message || null,
          type: row.type || null,
          salonId: row.salon_id,
          sponsor: row.sponsor,
          inviteHash: row.invite_hash,
          status: row.status,
          firstServiceDate: row.first_service_date,
          createdAt: row.created_at,
          favoriteServices: row.favorite_services,
          // Use sender_id from query if available, otherwise null
          senderId: row.sender_id || null
        }));
        
        return invitationList;
      } finally {
        client.release();
      }
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
      // Get invitation with matching hash
      const [invitation] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.inviteHash, hash));
      
      return invitation;
    } catch (error) {
      console.error(`Error fetching invitation by hash:`, error);
      throw error;
    }
  }

  async getInvitationsByPhone(phone: string | null | undefined, partialMatch: boolean = false): Promise<Invitation[]> {
    try {
      // Handle empty phone cases
      if (!phone) {
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
      
      return result;
    } catch (error) {
      console.error(`Error fetching invitations by phone:`, error);
      throw error;
    }
  }

  // Context-aware validation methods
  
  async validateInvitation(phone: string, email: string, senderId: number): Promise<{isValid: boolean, message?: string}> {
    // Clean the phone number for comparison
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    
    try {
      // 1. Determine the context (client sending or salon sending)
      const sender = await this.getClient(senderId);
      const isSenderClient = !!sender;
      
      // Get all clients and salons for checking duplicates
      const allClients = await db.select().from(clients);
      const allSalons = await db.select().from(salons);
      
      if (isSenderClient) {
        // CLIENT SENDING INVITATION CONTEXT
        
        // 2. Check if the client is trying to invite themselves
        if (sender.phone && sender.phone.replace(/\D/g, '') === cleanPhone) {
          return { isValid: false, message: "You cannot invite yourself" };
        }
        
        if (email && sender.email && sender.email.toLowerCase() === email.toLowerCase()) {
          return { isValid: false, message: "You cannot invite yourself" };
        }
        
        // Client can send invitations to existing invitees (to remind them)
        // So we don't block invitations to phone numbers that already have pending invitations
      } else {
        // SALON SENDING INVITATION CONTEXT - More strict validation
        
        // If no sender client is found, try to get the salon
        const salon = await this.getSalon(senderId);
        if (!salon) {
          return { isValid: false, message: "Invalid sender" };
        }
        
        // Check if the salon is trying to invite themselves
        if (salon.phone && salon.phone.replace(/\D/g, '') === cleanPhone) {
          return { isValid: false, message: "You cannot invite yourself" };
        }
        
        if (email && salon.email && salon.email.toLowerCase() === email.toLowerCase()) {
          return { isValid: false, message: "You cannot invite yourself" };
        }
        
        // ADDITIONAL SALON CONTEXT VALIDATIONS
        
        // 1. Check if the phone belongs to an existing client of THIS salon
        if (cleanPhone) {
          const existingClientOfThisSalon = allClients.find(client => 
            client.phone && 
            client.phone.replace(/\D/g, '') === cleanPhone && 
            client.sponsorSalonId === salon.id
          );
          
          if (existingClientOfThisSalon) {
            // Allow salon to send invites to their own clients - no validation error
            return { isValid: true };
          }
          
          // 2. Check if client exists but has a different sponsor salon
          const existingClientWithDifferentSponsor = allClients.find(client => 
            client.phone && 
            client.phone.replace(/\D/g, '') === cleanPhone && 
            client.sponsorSalonId !== null && 
            client.sponsorSalonId !== salon.id
          );
          
          if (existingClientWithDifferentSponsor) {
            return { 
              isValid: false, 
              message: "This client is already registered with another salon" 
            };
          }
          
          // 3. Check if there's a client with this phone but no sponsor (can invite)
          const existingClientWithNoSponsor = allClients.find(client => 
            client.phone && 
            client.phone.replace(/\D/g, '') === cleanPhone && 
            (client.sponsorSalonId === null || client.sponsorSalonId === undefined)
          );
          
          // This is valid - we allow salons to invite clients who don't have a sponsor yet
          // Do nothing here, continue validation
        }
        
        // Do the same checks for email if provided
        if (email && email.trim() !== '') {
          const normalizedEmail = email.toLowerCase();
          
          const existingClientEmailOfThisSalon = allClients.find(client => 
            client.email && 
            client.email.toLowerCase() === normalizedEmail && 
            client.sponsorSalonId === salon.id
          );
          
          if (existingClientEmailOfThisSalon) {
            // Allow salon to send invites to their own clients - no validation error
            return { isValid: true };
          }
          
          const existingClientEmailWithDifferentSponsor = allClients.find(client => 
            client.email && 
            client.email.toLowerCase() === normalizedEmail && 
            client.sponsorSalonId !== null && 
            client.sponsorSalonId !== salon.id
          );
          
          if (existingClientEmailWithDifferentSponsor) {
            return { 
              isValid: false, 
              message: "This client email is already registered with another salon" 
            };
          }
        }
      }
      
      // 3. Common validations regardless of sender type
      
      // 4. Check if the phone number is already registered as a salon (not a client)
      if (cleanPhone) {
        // Check if phone belongs to a salon
        const existingSalon = allSalons.find(salon => 
          salon.phone && salon.phone.replace(/\D/g, '') === cleanPhone
        );
        
        if (existingSalon) {
          return { isValid: false, message: "This phone is already registered as a salon" };
        }
      }
      
      // 5. Check if the email is already registered as a salon (not a client)
      if (email && email.trim() !== '') {
        const normalizedEmail = email.toLowerCase();
        
        const existingSalonEmail = allSalons.find(salon => 
          salon.email && salon.email.toLowerCase() === normalizedEmail
        );
        
        if (existingSalonEmail) {
          return { isValid: false, message: "This email is already registered as a salon" };
        }
      }
      
      // If we made it here, the invitation is valid
      return { isValid: true };
    } catch (error) {
      console.error('Error validating invitation:', error);
      return { isValid: false, message: "Error validating invitation" };
    }
  }
  
  async validateRegistration(phone: string, email: string, excludeId?: number): Promise<{isValid: boolean, message?: string}> {
    try {
      // For registration, we want to be strict about duplicates
      const duplicateCheck = await this.isDuplicateContact(phone, email, undefined, excludeId);
      
      if (duplicateCheck.isDuplicate) {
        return { 
          isValid: false, 
          message: `This ${duplicateCheck.field} is already registered` 
        };
      }
      
      // If we made it here, the registration is valid
      return { isValid: true };
    } catch (error) {
      console.error('Error validating registration:', error);
      return { isValid: false, message: "Error validating registration" };
    }
  }

  // Style Selection methods
  async createStyleSelection(insertStyleSelection: InsertStyleSelection): Promise<StyleSelection> {
    try {
      // Set default values if needed
      const styleSelectionData = {
        ...insertStyleSelection,
        status: insertStyleSelection.status || "selected",
        selectedAt: insertStyleSelection.selectedAt || new Date()
      };
      
      const result = await db.insert(styleSelections).values(styleSelectionData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating style selection:', error);
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
  

  
  // Gift tracking methods for invitation lifecycle
  async updateGiftStatus(invitationId: number, status: string, styleId?: number): Promise<Invitation> {
    try {
      // Get the current invitation
      const invitation = await this.getInvitation(invitationId);
      if (!invitation) {
        throw new Error(`Invitation with ID ${invitationId} not found`);
      }
      
      // Prepare update data with the new status
      const updateData: Partial<Invitation> = {
        status: status
      };
      
      // Update the invitation status in the database
      const result = await db
        .update(invitations)
        .set(updateData)
        .where(eq(invitations.id, invitationId))
        .returning();
      
      if (result.length === 0) {
        throw new Error(`Failed to update invitation status for ID ${invitationId}`);
      }
      
      // Log the status change as an activity
      await this.createActivityLog({
        type: "gift_status_updated",
        description: `Gift invitation #${invitation.inviteHash} status updated to ${status}`,
        salonId: invitation.salonId || undefined,
        clientId: invitation.senderId || undefined,
        timestamp: new Date()
      });
      
      return result[0];
    } catch (error) {
      console.error(`Error updating gift status:`, error);
      throw error;
    }
  }

  async trackGiftRedemption(invitationId: number, clientId: number, salonId: number): Promise<ActivityLog> {
    try {
      console.log(`DatabaseStorage.trackGiftRedemption - Tracking redemption for invitation ${invitationId}`);
      
      // Get the invitation details
      const invitation = await this.getInvitation(invitationId);
      if (!invitation) {
        throw new Error(`Invitation with ID ${invitationId} not found`);
      }
      
      // Update the invitation status to redeemed
      await this.updateGiftStatus(invitationId, 'redeemed');
      
      // Create a detailed activity log for the redemption
      const log = {
        type: "gift_redeemed",
        description: `Gift invitation #${invitation.inviteHash} redeemed by client ID ${clientId} at salon ID ${salonId}`,
        clientId,
        salonId,
        timestamp: new Date()
      };
      
      const result = await this.createActivityLog(log);
      console.log(`DatabaseStorage.trackGiftRedemption - Activity log created with ID ${result.id}`);
      
      return result;
    } catch (error) {
      console.error('DatabaseStorage.trackGiftRedemption - Error tracking gift redemption:', error);
      throw error;
    }
  }

  async postToClientDashboard(invitationId: number): Promise<boolean> {
    try {
      console.log(`DatabaseStorage.postToClientDashboard - Posting invitation ${invitationId} to client dashboard`);
      
      // Get the invitation details
      const invitation = await this.getInvitation(invitationId);
      if (!invitation) {
        throw new Error(`Invitation with ID ${invitationId} not found`);
      }
      
      // Check if we have a sender (client) for this invitation
      if (!invitation.senderId) {
        console.log(`DatabaseStorage.postToClientDashboard - No sender ID for invitation ${invitationId}, skipping client dashboard post`);
        return false;
      }
      
      // Get the sender client info
      const client = await this.getClient(invitation.senderId);
      if (!client) {
        console.log(`DatabaseStorage.postToClientDashboard - Sender client ${invitation.senderId} not found, skipping client dashboard post`);
        return false;
      }
      
      // Create an activity log entry for the client dashboard
      await this.createActivityLog({
        type: "invitation_posted_to_client",
        description: `Gift invitation #${invitation.inviteHash} for ${invitation.name} posted to ${client.name}'s dashboard`,
        clientId: invitation.senderId,
        salonId: invitation.salonId || undefined,
        timestamp: new Date()
      });
      
      console.log(`DatabaseStorage.postToClientDashboard - Successfully posted invitation ${invitationId} to client ${invitation.senderId} dashboard`);
      
      return true;
    } catch (error) {
      console.error('DatabaseStorage.postToClientDashboard - Error posting to client dashboard:', error);
      return false;
    }
  }

  async postToSalonDashboard(invitationId: number): Promise<boolean> {
    try {
      console.log(`DatabaseStorage.postToSalonDashboard - Posting invitation ${invitationId} to salon dashboard`);
      
      // Get the invitation details
      const invitation = await this.getInvitation(invitationId);
      if (!invitation) {
        throw new Error(`Invitation with ID ${invitationId} not found`);
      }
      
      // Check if we have a salon ID for this invitation
      if (!invitation.salonId) {
        console.log(`DatabaseStorage.postToSalonDashboard - No salon ID for invitation ${invitationId}, skipping salon dashboard post`);
        return false;
      }
      
      // Get the salon info
      const salon = await this.getSalon(invitation.salonId);
      if (!salon) {
        console.log(`DatabaseStorage.postToSalonDashboard - Salon ${invitation.salonId} not found, skipping salon dashboard post`);
        return false;
      }
      
      // Create an activity log entry for the salon dashboard
      await this.createActivityLog({
        type: "invitation_posted_to_salon",
        description: `Gift invitation #${invitation.inviteHash} for ${invitation.name} posted to ${salon.name}'s VMB Gifts section`,
        salonId: invitation.salonId,
        clientId: invitation.senderId || undefined,
        timestamp: new Date()
      });
      
      console.log(`DatabaseStorage.postToSalonDashboard - Successfully posted invitation ${invitationId} to salon ${invitation.salonId} dashboard`);
      
      return true;
    } catch (error) {
      console.error('DatabaseStorage.postToSalonDashboard - Error posting to salon dashboard:', error);
      return false;
    }
  }

  // Schema access method for dynamic validation
  getSalonsTable(): typeof salons {
    return salons;
  }
}

export const storage = new DatabaseStorage();