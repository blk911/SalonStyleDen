import { 
  users, type User, type InsertUser,
  salons, type Salon, type InsertSalon,
  clients, type Client, type InsertClient,
  invitations, type Invitation, type InsertInvitation,
  styleSelections, type StyleSelection, type InsertStyleSelection,
  activityLogs, type ActivityLog, type InsertActivityLog,
  appointments, type Appointment, type InsertAppointment,
  gifts, type Gift, type InsertGift
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, sql, and, or } from "drizzle-orm";

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
  updateSalonLicense(id: number, licenseData: { 
    licenseName?: string, 
    licenseNumber?: string, 
    licenseState?: string, 
    licenseStatus?: string, 
    licenseVerified?: boolean 
  }): Promise<Salon>;
  
  // Client methods
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  getAllClients(): Promise<Client[]>;
  updateClient(id: number, clientData: Partial<Client>): Promise<Client>;
  suspendClient(id: number): Promise<Client>;
  deleteClient(id: number): Promise<boolean>;
  
  // Invitation methods
  createInvitation(invitation: InsertInvitation): Promise<Invitation>;
  getInvitation(id: number): Promise<Invitation | undefined>;
  getRecentInvitations(limit?: number): Promise<Invitation[]>;
  getSalonInvitations(salonId: number): Promise<Invitation[]>;
  getClientInvitations(clientId: number, status?: string, limit?: number): Promise<Invitation[]>;
  updateInvitationStatus(id: number, status: string): Promise<Invitation>;
  getInvitationsByPhone(phone: string, partialMatch?: boolean): Promise<Invitation[]>;
  getInvitationByHash(hash: string): Promise<Invitation | undefined>;
  deleteInvitation(id: number): Promise<boolean>;
  
  // Invitation limit methods
  countSalonInvitations(salonId: number): Promise<number>;
  hasSalonReachedInvitationLimit(salonId: number): Promise<{hasReachedLimit: boolean, currentCount: number, limit: number}>;
  
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
  updateInvitationGiftStatus(invitationId: number, status: string, styleId?: number): Promise<Invitation>;
  trackGiftRedemption(invitationId: number, clientId: number, salonId: number): Promise<ActivityLog>;
  postToClientDashboard(invitationId: number): Promise<boolean>;
  postToSalonDashboard(invitationId: number): Promise<boolean>;
  
  // Appointment methods
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getClientAppointments(clientId: number): Promise<Appointment[]>;
  getSalonAppointments(salonId: number): Promise<Appointment[]>;
  getInvitationAppointments(invitationId: number): Promise<Appointment[]>;
  updateAppointmentStatus(id: number, status: string): Promise<Appointment>;
  
  // Gift methods
  createGift(gift: InsertGift): Promise<Gift>;
  getGift(id: number): Promise<Gift | undefined>;
  getGiftByRecipientPhone(phone: string): Promise<Gift | undefined>;
  getSentGifts(senderId: number): Promise<Gift[]>;
  getReceivedGifts(recipientId: number): Promise<Gift[]>;
  updateGiftStatus(id: number, status: string): Promise<Gift>;
  checkUnredeemedGiftByPhone(phone: string): Promise<{hasUnredeemedGift: boolean, gift?: Gift}>;
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
    let retries = 3; // Maximum number of retry attempts
    let delayMs = 500; // Starting delay in milliseconds (will increase exponentially)
    
    const performQuery = async (): Promise<Salon[]> => {
      try {
        console.log('DatabaseStorage.getAllSalons - Attempting to fetch all salons');
        const result = await db.select().from(salons);
        console.log(`DatabaseStorage.getAllSalons - Successfully retrieved ${result.length} salons`);
        return result;
      } catch (error) {
        console.error('DatabaseStorage.getAllSalons - Error fetching salons:', error);
        
        if (retries > 0) {
          retries--;
          console.log(`DatabaseStorage.getAllSalons - Retrying... (${retries} attempts left)`);
          
          // Wait using exponential backoff before retrying
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2; // Double the delay for the next retry (exponential backoff)
          
          return performQuery(); // Recursively retry
        }
        
        throw error; // If no more retries, re-throw to let the route handler catch it
      }
    };
    
    return performQuery();
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
  
  async updateSalonLicense(id: number, licenseData: { 
    licenseName?: string, 
    licenseNumber?: string, 
    licenseState?: string, 
    licenseStatus?: string, 
    licenseVerified?: boolean 
  }): Promise<Salon> {
    console.log(`DatabaseStorage.updateSalonLicense - Updating license for salon ID ${id}`);
    
    try {
      // Get current salon data to ensure it exists
      const currentSalon = await this.getSalon(id);
      if (!currentSalon) {
        throw new Error(`Salon with ID ${id} not found`);
      }
      
      console.log(`DatabaseStorage.updateSalonLicense - License data:`, JSON.stringify(licenseData));
      
      const result = await db
        .update(salons)
        .set(licenseData)
        .where(eq(salons.id, id))
        .returning();
      
      console.log(`DatabaseStorage.updateSalonLicense - Update successful`);
      
      return result[0];
    } catch (error) {
      console.error('DatabaseStorage.updateSalonLicense - Error updating salon license:', error);
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
  
  async suspendClient(id: number): Promise<Client> {
    console.log(`DatabaseStorage.suspendClient - Suspending client ID ${id}`);
    
    try {
      // First check if client exists
      const client = await this.getClient(id);
      if (!client) {
        throw new Error(`Client with ID ${id} not found`);
      }
      
      // Use raw SQL to update the status field safely
      const client_pool = await pool.connect();
      try {
        const result = await client_pool.query(`
          UPDATE clients
          SET status = 'suspended'
          WHERE id = $1
          RETURNING *
        `, [id]);
        
        if (result.rowCount === 0) {
          throw new Error(`Failed to suspend client with ID ${id}`);
        }
        
        // Log the action to activity logs
        await this.createActivityLog({
          type: 'client_suspended',
          description: `Client ${client.name} (ID: ${id}) was suspended`,
          clientId: id,
          timestamp: new Date()
        });
        
        console.log(`DatabaseStorage.suspendClient - Client ${id} suspended successfully`);
        
        // Convert row to Client object with all required fields
        const updatedClient: Client = {
          id: result.rows[0].id,
          name: result.rows[0].name,
          phone: result.rows[0].phone,
          email: result.rows[0].email,
          address: result.rows[0].address,
          city: result.rows[0].city,
          state: result.rows[0].state,
          zipCode: result.rows[0].zip_code,
          // Required fields from schema
          sponsor: result.rows[0].sponsor || 'VMB LTD',
          isCurrentClient: result.rows[0].is_current_client || false,
          acceptedTerms: result.rows[0].accepted_terms || false,
          salonName: result.rows[0].salon_name || '',
          type: result.rows[0].type,
          salonId: result.rows[0].salon_id,
          // Sponsor data is already included as sponsor field
          sponsorName: result.rows[0].sponsor_name,
          sponsorSalonId: result.rows[0].sponsor_salon_id,
          notes: result.rows[0].notes,
          socialMedia: result.rows[0].social_media,
          favoriteServices: result.rows[0].favorite_services,
          // profileComplete field is not in the schema
          profilePromptShown: result.rows[0].profile_prompt_shown,
          photoUrl: result.rows[0].photo_url,
          // status field is not in the schema
          createdAt: result.rows[0].created_at
        };
        
        return updatedClient;
      } finally {
        client_pool.release();
      }
    } catch (error) {
      console.error('DatabaseStorage.suspendClient - Error suspending client:', error);
      throw error;
    }
  }
  
  async deleteClient(id: number): Promise<boolean> {
    console.log(`DatabaseStorage.deleteClient - Deleting client ID ${id}`);
    
    try {
      // First check if client exists and get their info for the log
      const client = await this.getClient(id);
      if (!client) {
        throw new Error(`Client with ID ${id} not found`);
      }
      
      // Create a record of this action but set clientId to null to avoid the circular dependency
      await this.createActivityLog({
        type: 'client_deleted',
        description: `Client ${client.name} (ID: ${id}) was permanently deleted`,
        timestamp: new Date(),
        // Explicitly set clientId to null for this log to avoid circular reference
        clientId: null
      });
      
      // Get all appointments for this client
      const clientAppointments = await this.getClientAppointments(id);
      console.log(`DatabaseStorage.deleteClient - Found ${clientAppointments.length} appointments to delete first`);
      
      // Delete all appointments for this client
      for (const appointment of clientAppointments) {
        try {
          await db.delete(appointments).where(eq(appointments.id, appointment.id));
          console.log(`DatabaseStorage.deleteClient - Deleted appointment ID ${appointment.id}`);
        } catch (appointmentError) {
          console.error(`DatabaseStorage.deleteClient - Error deleting appointment ${appointment.id}:`, appointmentError);
          // Continue with deletion of other appointments
        }
      }
      
      // Get all style selections for this client
      const clientStyleSelections = await this.getClientStyleSelections(id);
      console.log(`DatabaseStorage.deleteClient - Found ${clientStyleSelections.length} style selections to delete first`);
      
      // Delete all style selections for this client
      for (const styleSelection of clientStyleSelections) {
        try {
          await db.delete(styleSelections).where(eq(styleSelections.id, styleSelection.id));
          console.log(`DatabaseStorage.deleteClient - Deleted style selection ID ${styleSelection.id}`);
        } catch (styleSelectionError) {
          console.error(`DatabaseStorage.deleteClient - Error deleting style selection ${styleSelection.id}:`, styleSelectionError);
          // Continue with deletion of other style selections
        }
      }
      
      // Clear clientId from any activity logs referencing this client
      try {
        await db.update(activityLogs)
          .set({ clientId: null })
          .where(eq(activityLogs.clientId, id));
        console.log(`DatabaseStorage.deleteClient - Cleared client ID from associated activity logs`);
      } catch (activityLogError) {
        console.error(`DatabaseStorage.deleteClient - Error clearing client ID from activity logs:`, activityLogError);
        // Continue with client deletion anyway
      }
      
      // Delete or handle gifts where client is the sender or recipient
      try {
        // First, check if there are any gifts sent by this client
        const sentGifts = await this.getSentGifts(id);
        console.log(`DatabaseStorage.deleteClient - Found ${sentGifts.length} gifts sent by this client to handle`);
        
        // Delete each gift sent by this client
        for (const gift of sentGifts) {
          await db.delete(gifts).where(eq(gifts.id, gift.id));
          console.log(`DatabaseStorage.deleteClient - Deleted gift ID ${gift.id} (client was sender)`);
        }
        
        // Also check for gifts received by this client
        const receivedGifts = await this.getReceivedGifts(id);
        console.log(`DatabaseStorage.deleteClient - Found ${receivedGifts.length} gifts received by this client to handle`);
        
        // For received gifts, we have options:
        // 1. Delete them (if we want to completely remove all trace of the client)
        // 2. Set recipientId to null (if we want to preserve gift history)
        // We'll go with option 1 for consistency
        for (const gift of receivedGifts) {
          await db.delete(gifts).where(eq(gifts.id, gift.id));
          console.log(`DatabaseStorage.deleteClient - Deleted gift ID ${gift.id} (client was recipient)`);
        }
      } catch (giftError) {
        console.error(`DatabaseStorage.deleteClient - Error handling gifts related to client:`, giftError);
        throw giftError; // This is important as we can't proceed if gifts can't be handled
      }
      
      // Delete or handle gifts where client is the recipient
      try {
        // First, check if there are any gifts received by this client
        const receivedGifts = await this.getReceivedGifts(id);
        console.log(`DatabaseStorage.deleteClient - Found ${receivedGifts.length} gifts received by this client to handle`);
        
        // Update each gift received by this client to clear the recipientId
        for (const gift of receivedGifts) {
          await db.update(gifts)
            .set({ recipientId: null })
            .where(eq(gifts.id, gift.id));
          console.log(`DatabaseStorage.deleteClient - Updated gift ID ${gift.id} to clear recipient reference`);
        }
      } catch (giftError) {
        console.error(`DatabaseStorage.deleteClient - Error handling gifts received by client:`, giftError);
        throw giftError; // This is important as we can't proceed if gifts can't be handled
      }
      
      // Delete the client
      const result = await db
        .delete(clients)
        .where(eq(clients.id, id))
        .returning();
      
      const success = result.length > 0;
      console.log(`DatabaseStorage.deleteClient - Client ${id} deletion ${success ? 'successful' : 'failed'}`);
      return success;
    } catch (error) {
      console.error('DatabaseStorage.deleteClient - Error deleting client:', error);
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
    let sponsorName = insertInvitation.sponsor || 'VMB LTD';
    
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
      sponsor: sponsorName || 'VMB LTD',
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
          sponsorName: row.sponsor_name || row.sponsor || 'VMB LTD', // [FIX] Ensure sponsorName is always set
          inviteHash: row.invite_hash,
          status: row.status,
          firstServiceDate: row.first_service_date,
          createdAt: row.created_at,
          favoriteServices: row.favorite_services,
          // Required fields from schema
          styleOption: row.style_option || null,
          stylePrice: row.style_price || null,
          styleDuration: row.style_duration || null,
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
      // Use raw SQL to get the invitation by ID to avoid schema mismatch issues
      const sqlQuery = `
        SELECT 
            id, name, phone, email, notes, message, type,
            salon_id, sponsor, invite_hash, status, 
            first_service_date, created_at, 
            favorite_services, sender_id,
            style_option, style_price, style_duration
        FROM invitations 
        WHERE id = $1
      `;
      
      const client = await pool.connect();
      try {
        const result = await client.query(sqlQuery, [id]);
        
        if (result.rows.length === 0) {
          return undefined;
        }
        
        const row = result.rows[0];
        
        // Map to our expected format
        return {
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
          styleOption: row.style_option || null,
          stylePrice: row.style_price || null,
          styleDuration: row.style_duration || null,
          sponsorName: row.salon_id ? row.sponsor : null, // Fixed FROM display for salon invitations
          senderId: row.sender_id || null
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`DatabaseStorage.getInvitation - Error getting invitation ${id}:`, error);
      throw error;
    }
  }

  async getRecentInvitations(limit: number = 10): Promise<Invitation[]> {
    try {
      console.log(`DatabaseStorage.getRecentInvitations - Fetching ${limit} recent invitations`);
      
      // Use a raw SQL query that only selects columns we know exist
      const sqlQuery = `
        SELECT 
            id, name, phone, email, notes, message, type,
            salon_id, sponsor, invite_hash, status, 
            first_service_date, created_at, 
            favorite_services, sender_id,
            style_option, style_price, style_duration
        FROM invitations 
        ORDER BY created_at DESC
        LIMIT $1
      `;
      
      const client = await pool.connect();
      try {
        const result = await client.query(sqlQuery, [limit]);
        const rows = result.rows;
        console.log(`DatabaseStorage.getRecentInvitations - Retrieved ${rows.length} invitations`);
        
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
          // Required fields from schema
          styleOption: row.style_option || null,
          stylePrice: row.style_price || null,
          styleDuration: row.style_duration || null,
          // Set sponsorName to null (it's a new field)
          sponsorName: row.salon_id ? row.sponsor : null, // Fixed FROM display for salon invitations
          // Use sender_id from query if available, otherwise null
          senderId: row.sender_id || null
        }));
        
        return invitationList;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('DatabaseStorage.getRecentInvitations - Error fetching invitations:', error);
      throw error;
    }
  }

  async getSalonInvitations(salonId: number): Promise<Invitation[]> {
    try {
      console.log(`DatabaseStorage.getSalonInvitations - Fetching invitations for salon ${salonId}`);
      
      // Use a raw SQL query that only selects columns we know exist, including style fields
      // This is safer than using the Drizzle model which may include fields not yet in DB
      const sqlQuery = `
        SELECT 
            id, name, phone, email, notes, message, type,
            salon_id, sponsor, invite_hash, status, 
            first_service_date, created_at, 
            favorite_services, sender_id,
            style_option, style_price, style_duration
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
          // Required fields from schema
          styleOption: row.style_option || null,
          stylePrice: row.style_price || null,
          styleDuration: row.style_duration || null,
          // Set sponsorName to null (it's a new field)
          sponsorName: row.salon_id ? row.sponsor : null, // Fixed FROM display for salon invitations
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
  
  async getClientInvitations(clientId: number, status?: string, limit?: number): Promise<Invitation[]> {
    try {
      console.log(`DatabaseStorage.getClientInvitations - Fetching invitations for client ${clientId}${status ? ` with status ${status}` : ''}`);
      
      // First get the client's phone number
      const clientData = await this.getClient(clientId);
      if (!clientData) {
        console.error(`DatabaseStorage.getClientInvitations - Client ${clientId} not found`);
        return [];
      }
      
      // Normalize the phone number for comparison (strip non-digits)
      const clientPhone = clientData.phone.replace(/\D/g, '');
      
      // Build the query parameters list and values array
      const queryParams: string[] = [];
      const values: any[] = [];
      
      // Get invitations where the client is the sender OR the recipient (by phone)
      // Use parentheses for proper boolean logic
      queryParams.push(`(sender_id = $${values.length + 1} OR phone LIKE $${values.length + 2})`);
      values.push(clientId);
      values.push(`%${clientPhone}%`); // Use LIKE with wildcards for flexible matching
      
      // Add status filter if provided
      if (status) {
        queryParams.push(`status = $${values.length + 1}`);
        values.push(status);
      }
      
      // Build the WHERE clause
      const whereClause = queryParams.length > 0 ? `WHERE ${queryParams.join(' AND ')}` : '';
      
      // Build the LIMIT clause
      const limitClause = limit ? `LIMIT $${values.length + 1}` : '';
      if (limit) values.push(limit);
      
      // Use a raw SQL query that only selects columns we know exist, including style fields
      const sqlQuery = `
        SELECT 
            id, name, phone, email, notes, message, type,
            salon_id, sponsor, invite_hash, status, 
            first_service_date, created_at, 
            favorite_services, sender_id,
            style_option, style_price, style_duration
        FROM invitations 
        ${whereClause}
        ORDER BY created_at DESC
        ${limitClause}
      `;
      
      const client = await pool.connect();
      try {
        const result = await client.query(sqlQuery, values);
        const rows = result.rows;
        console.log(`DatabaseStorage.getClientInvitations - Retrieved ${rows.length} invitations for client ${clientId}`);
        
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
          // Required fields from schema
          styleOption: row.style_option || null,
          stylePrice: row.style_price || null,
          styleDuration: row.style_duration || null,
          // Set sponsorName to null (it's a new field)
          sponsorName: row.salon_id ? row.sponsor : null, // Fixed FROM display for salon invitations
          senderId: row.sender_id || null
        }));
        
        return invitationList;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`DatabaseStorage.getClientInvitations - Error fetching invitations for client ${clientId}:`, error);
      throw error;
    }
  }

  async updateInvitationStatus(id: number, status: string): Promise<Invitation> {
    try {
      console.log(`DatabaseStorage.updateInvitationStatus - Updating invitation ${id} status to ${status}`);
      
      // Update using raw SQL to avoid schema mismatch issues
      const updateQuery = `
        UPDATE invitations 
        SET status = $1 
        WHERE id = $2
        RETURNING 
            id, name, phone, email, notes, message, type,
            salon_id, sponsor, invite_hash, status, 
            first_service_date, created_at, 
            favorite_services, sender_id,
            style_option, style_price, style_duration
      `;
      
      const client = await pool.connect();
      try {
        const result = await client.query(updateQuery, [status, id]);
        
        if (result.rows.length === 0) {
          throw new Error(`Invitation with ID ${id} not found`);
        }
        
        const row = result.rows[0];
        
        // Map to our expected format
        const updatedInvitation = {
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
          styleOption: row.style_option || null,
          stylePrice: row.style_price || null,
          styleDuration: row.style_duration || null,
          sponsorName: row.salon_id ? row.sponsor : null, // Fixed FROM display for salon invitations
          senderId: row.sender_id || null
        };
        
        console.log(`DatabaseStorage.updateInvitationStatus - Update successful`);
        return updatedInvitation;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`DatabaseStorage.updateInvitationStatus - Error updating invitation ${id}:`, error);
      throw error;
    }
  }

  async getInvitationByHash(hash: string): Promise<Invitation | undefined> {
    try {
      // Use raw SQL to get the invitation by hash to avoid schema mismatch issues
      const sqlQuery = `
        SELECT 
            id, name, phone, email, notes, message, type,
            salon_id, sponsor, invite_hash, status, 
            first_service_date, created_at, 
            favorite_services, sender_id,
            style_option, style_price, style_duration
        FROM invitations 
        WHERE invite_hash = $1
      `;
      
      const client = await pool.connect();
      try {
        const result = await client.query(sqlQuery, [hash]);
        
        if (result.rows.length === 0) {
          return undefined;
        }
        
        const row = result.rows[0];
        
        // Map to our expected format
        return {
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
          styleOption: row.style_option || null,
          stylePrice: row.style_price || null,
          styleDuration: row.style_duration || null,
          sponsorName: row.salon_id ? row.sponsor : null, // Fixed FROM display for salon invitations
          senderId: row.sender_id || null
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Error fetching invitation by hash:`, error);
      throw error;
    }
  }
  
  // Invitation limit methods
  async countSalonInvitations(salonId: number): Promise<number> {
    try {
      console.log(`DatabaseStorage.countSalonInvitations - Counting invitations for salon ${salonId}`);
      
      // Count invitations for the specified salon
      const result = await db
        .select({ count: sql`count(*)` })
        .from(invitations)
        .where(eq(invitations.salonId, salonId));
      
      // Extract count as number
      const count = Number(result[0]?.count || 0);
      console.log(`DatabaseStorage.countSalonInvitations - Found ${count} invitations for salon ${salonId}`);
      
      return count;
    } catch (error) {
      console.error(`DatabaseStorage.countSalonInvitations - Error counting invitations for salon ${salonId}:`, error);
      throw error;
    }
  }
  
  async hasSalonReachedInvitationLimit(salonId: number): Promise<{hasReachedLimit: boolean, currentCount: number, limit: number}> {
    try {
      console.log(`DatabaseStorage.hasSalonReachedInvitationLimit - Checking limit for salon ${salonId}`);
      
      // Get salon to check license verification status
      const salon = await this.getSalon(salonId);
      if (!salon) {
        throw new Error(`Salon with ID ${salonId} not found`);
      }
      
      // Count current invitations
      const invitationCount = await this.countSalonInvitations(salonId);
      
      // Determine invitation limit based on license verification status
      // If license is verified, there is no limit (use a high number)
      // If license is not verified, limit is 2
      const invitationLimit = salon.licenseVerified ? Number.MAX_SAFE_INTEGER : 2;
      
      console.log(`DatabaseStorage.hasSalonReachedInvitationLimit - Salon ${salonId}:`);
      console.log(`  - License verified: ${salon.licenseVerified ? 'Yes' : 'No'}`);
      console.log(`  - Current invitation count: ${invitationCount}`);
      console.log(`  - Invitation limit: ${salon.licenseVerified ? 'Unlimited' : invitationLimit}`);
      
      // Check if salon has reached its limit
      const hasReachedLimit = invitationCount >= invitationLimit;
      
      return {
        hasReachedLimit,
        currentCount: invitationCount,
        limit: invitationLimit
      };
    } catch (error) {
      console.error(`DatabaseStorage.hasSalonReachedInvitationLimit - Error checking limit for salon ${salonId}:`, error);
      throw error;
    }
  }

  async getInvitationsByPhone(phone: string | null | undefined, partialMatch: boolean = false): Promise<Invitation[]> {
    try {
      // Handle empty phone cases
      if (!phone) {
        console.log(`[PHONE MATCH] getInvitationsByPhone - Empty phone provided, returning empty array`);
        return [];
      }
      
      // Clean phone number to digits only for comparison
      const cleanPhone = phone.replace(/\D/g, '');
      console.log(`[PHONE MATCH] getInvitationsByPhone - Searching for phone: ${cleanPhone} (original: ${phone})`);
      
      // Use raw SQL to get all invitations - this ensures we don't have schema mismatch issues
      const sqlQuery = `
        SELECT 
            id, name, phone, email, notes, message, type,
            salon_id, sponsor, invite_hash, status, 
            first_service_date, created_at, 
            favorite_services, sender_id,
            style_option, style_price, style_duration
        FROM invitations
      `;
      
      console.log(`[PHONE MATCH] Running SQL query to get all invitations`);
      const client = await pool.connect();
      try {
        const queryResult = await client.query(sqlQuery);
        const rows = queryResult.rows;
        console.log(`[PHONE MATCH] Found ${rows.length} total invitations in database`);
        
        // Debug log the first few rows to check structure
        if (rows.length > 0) {
          console.log(`[PHONE MATCH] First invitation in DB:`, JSON.stringify({
            id: rows[0].id,
            name: rows[0].name,
            phone: rows[0].phone,
            status: rows[0].status,
            hash: rows[0].invite_hash
          }));
        }
        
        // Map results to our expected format
        const allInvitations = rows.map(row => ({
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
          styleOption: row.style_option || null,
          stylePrice: row.style_price || null,
          styleDuration: row.style_duration || null,
          sponsorName: row.salon_id ? row.sponsor : null, // Fixed FROM display for salon invitations
          senderId: row.sender_id || null
        }));
        
        // Filter based on matching criteria
        let filteredInvitations: Invitation[] = [];
        
        // Debug log
        console.log(`[PHONE MATCH] Starting phone matching with ${allInvitations.length} invitations for phone ${cleanPhone}`);
        
        if (partialMatch) {
          // For partial match, check if invitation phone ends with the given digits
          filteredInvitations = allInvitations.filter(invitation => {
            if (!invitation.phone) return false;
            const invitePhone = invitation.phone.replace(/\D/g, '');
            
            // Debug log
            console.log(`[PHONE PARTIAL MATCH] Comparing DB=${invitePhone} with search=${cleanPhone}`);
            
            // Match if the last N digits match our search
            if (cleanPhone.length <= invitePhone.length) {
              const lastDigits = invitePhone.slice(-cleanPhone.length);
              const matches = lastDigits === cleanPhone;
              
              console.log(`[PHONE PARTIAL MATCH] Last ${cleanPhone.length} digits: ${lastDigits}, match=${matches}`);
              
              return matches;
            }
            return false;
          });
        } else {
          // For exact match, require full phone number match
          filteredInvitations = allInvitations.filter(invitation => {
            if (!invitation.phone) return false;
            const invitePhone = invitation.phone.replace(/\D/g, '');
            const matches = invitePhone === cleanPhone;
            
            // Debug log each comparison
            console.log(`[PHONE EXACT MATCH] Comparing DB=${invitePhone} (${invitation.id}: ${invitation.name}) with search=${cleanPhone}, match=${matches}`);
            
            return matches;
          });
        }
        
        // Debug log results
        console.log(`[PHONE MATCH] Found ${filteredInvitations.length} matching invitations`);
        filteredInvitations.forEach((inv, i) => {
          console.log(`[PHONE MATCH] Match #${i+1}: id=${inv.id}, name=${inv.name}, phone=${inv.phone}, status=${inv.status}`);
        });
        
        return filteredInvitations;
      } finally {
        client.release();
      }
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
  
  async validateRegistration(phone: string, email: string, excludeId?: number): Promise<{isValid: boolean, message?: string, hasUnredeemedGift?: boolean, requiresAddress?: boolean}> {
    try {
      // For registration, we want to be strict about duplicates
      const duplicateCheck = await this.isDuplicateContact(phone, email, undefined, excludeId);
      
      if (duplicateCheck.isDuplicate) {
        return { 
          isValid: false, 
          message: `This ${duplicateCheck.field} is already registered` 
        };
      }
      
      // Check if phone number has an unredeemed gift
      const giftCheck = await this.checkUnredeemedGiftByPhone(phone);
      
      if (giftCheck.hasUnredeemedGift) {
        console.log(`DatabaseStorage.validateRegistration - Found unredeemed gift for phone ${phone}`);
        return { 
          isValid: true,
          hasUnredeemedGift: true,
          requiresAddress: true  // Require address for gift redemption
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
      console.error(`Error getting style selection ${id}:`, error);
      throw error;
    }
  }

  async getSalonStyleSelections(salonId: number): Promise<StyleSelection[]> {
    try {
      const result = await db.select()
        .from(styleSelections)
        .where(eq(styleSelections.salonId, salonId))
        .orderBy(sql`${styleSelections.selectedAt} DESC`);
      
      return result;
    } catch (error) {
      console.error(`Error fetching style selections for salon ${salonId}:`, error);
      throw error;
    }
  }

  async getClientStyleSelections(clientId: number): Promise<StyleSelection[]> {
    try {
      const result = await db.select()
        .from(styleSelections)
        .where(eq(styleSelections.clientId, clientId))
        .orderBy(sql`${styleSelections.selectedAt} DESC`);
      
      return result;
    } catch (error) {
      console.error(`Error fetching style selections for client ${clientId}:`, error);
      throw error;
    }
  }

  // Activity Log methods
  async createActivityLog(insertActivityLog: InsertActivityLog): Promise<ActivityLog> {
    try {
      // Set default timestamp if not provided
      const logData = {
        ...insertActivityLog,
        timestamp: insertActivityLog.timestamp || new Date()
      };
      
      const result = await db.insert(activityLogs).values(logData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }
  }

  async getRecentActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    try {
      const result = await db.select()
        .from(activityLogs)
        .orderBy(sql`${activityLogs.timestamp} DESC`)
        .limit(limit);
      
      return result;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  }

  async logVmbInvitationSent(clientId: number, salonId: number, styleId: number): Promise<ActivityLog> {
    try {
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
      return result;
    } catch (error) {
      console.error('Error logging VMB invitation:', error);
      throw error;
    }
  }
  

  
  // Gift tracking methods for invitation lifecycle
  async updateInvitationGiftStatus(invitationId: number, status: string, styleId?: number): Promise<Invitation> {
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
      // Get the invitation details
      const invitation = await this.getInvitation(invitationId);
      if (!invitation) {
        throw new Error(`Invitation with ID ${invitationId} not found`);
      }
      
      // Update the invitation status to redeemed
      await this.updateInvitationGiftStatus(invitationId, 'redeemed');
      
      // Create a detailed activity log for the redemption
      const log = {
        type: "gift_redeemed",
        description: `Gift invitation #${invitation.inviteHash} redeemed by client ID ${clientId} at salon ID ${salonId}`,
        clientId,
        salonId,
        timestamp: new Date()
      };
      
      const result = await this.createActivityLog(log);
      return result;
    } catch (error) {
      console.error('Error tracking gift redemption:', error);
      throw error;
    }
  }

  async postToClientDashboard(invitationId: number): Promise<boolean> {
    try {
      // Get the invitation details
      const invitation = await this.getInvitation(invitationId);
      if (!invitation) {
        throw new Error(`Invitation with ID ${invitationId} not found`);
      }
      
      // Check if we have a sender (client) for this invitation
      if (!invitation.senderId) {
        return false;
      }
      
      // Get the sender client info
      const client = await this.getClient(invitation.senderId);
      if (!client) {
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
      
      return true;
    } catch (error) {
      console.error('Error posting to client dashboard:', error);
      return false;
    }
  }

  async postToSalonDashboard(invitationId: number): Promise<boolean> {
    try {
      // Get the invitation details
      const invitation = await this.getInvitation(invitationId);
      if (!invitation) {
        throw new Error(`Invitation with ID ${invitationId} not found`);
      }
      
      // Check if we have a salon ID for this invitation
      if (!invitation.salonId) {
        return false;
      }
      
      // Get the salon info
      const salon = await this.getSalon(invitation.salonId);
      if (!salon) {
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
      
      return true;
    } catch (error) {
      console.error('Error posting to salon dashboard:', error);
      return false;
    }
  }

  // Schema access method for dynamic validation
  getSalonsTable(): typeof salons {
    return salons;
  }
  
  async deleteInvitation(id: number): Promise<boolean> {
    try {
      console.log(`DatabaseStorage.deleteInvitation - Deleting invitation with ID ${id}`);
      
      // Check if invitation exists first
      const invitation = await this.getInvitation(id);
      if (!invitation) {
        console.log(`DatabaseStorage.deleteInvitation - No invitation found with ID ${id}`);
        return false;
      }
      
      // First check for any related appointments
      const relatedAppointments = await this.getInvitationAppointments(id);
      console.log(`DatabaseStorage.deleteInvitation - Found ${relatedAppointments.length} appointments to delete first`);
      
      // Delete all related appointments
      for (const appointment of relatedAppointments) {
        try {
          await db.delete(appointments).where(eq(appointments.id, appointment.id));
          console.log(`DatabaseStorage.deleteInvitation - Deleted appointment ID ${appointment.id}`);
        } catch (appointmentError) {
          console.error(`DatabaseStorage.deleteInvitation - Error deleting appointment ${appointment.id}:`, appointmentError);
          // Continue with deletion of other appointments
        }
      }
      
      // Check if there are associated style selections through the client
      // First try to find a client with the same phone number
      const clientsWithSamePhone = await db
        .select()
        .from(clients)
        .where(sql`regexp_replace(${clients.phone}, '[^0-9]', '', 'g') = regexp_replace(${invitation.phone}, '[^0-9]', '', 'g')`);
      
      if (clientsWithSamePhone.length > 0) {
        console.log(`DatabaseStorage.deleteInvitation - Found ${clientsWithSamePhone.length} clients with the same phone number`);
        
        // For each matched client, delete their style selections
        for (const matchedClient of clientsWithSamePhone) {
          const clientStyleSelections = await this.getClientStyleSelections(matchedClient.id);
          console.log(`DatabaseStorage.deleteInvitation - Found ${clientStyleSelections.length} style selections for client ${matchedClient.id}`);
          
          // Delete all style selections for this client
          for (const styleSelection of clientStyleSelections) {
            try {
              await db.delete(styleSelections).where(eq(styleSelections.id, styleSelection.id));
              console.log(`DatabaseStorage.deleteInvitation - Deleted style selection ID ${styleSelection.id}`);
            } catch (styleSelectionError) {
              console.error(`DatabaseStorage.deleteInvitation - Error deleting style selection ${styleSelection.id}:`, styleSelectionError);
              // Continue with deletion of other style selections
            }
          }
        }
      }
      
      // Clear any activity logs that reference this invitation  
      try {
        // We need to use a different approach since there's no invitationId in activityLogs
        // Instead, filter for logs that might mention this invitation (based on description)
        await db.update(activityLogs)
          .set({ 
            description: sql`REPLACE(description, ${`invitation for ${invitation.name}`}, ${`deleted invitation (ID ${id})`})` 
          })
          .where(sql`description LIKE ${`%invitation for ${invitation.name}%`}`);
        console.log(`DatabaseStorage.deleteInvitation - Updated activity logs mentioning this invitation`);
      } catch (activityLogError) {
        console.error(`DatabaseStorage.deleteInvitation - Error updating activity logs:`, activityLogError);
        // Continue with invitation deletion anyway
      }
      
      // Delete the invitation
      const result = await db.delete(invitations).where(eq(invitations.id, id)).returning();
      
      if (result.length === 0) {
        console.log(`DatabaseStorage.deleteInvitation - Delete operation didn't return any records`);
        return false;
      }
      
      console.log(`DatabaseStorage.deleteInvitation - Successfully deleted invitation ID ${id}`);
      
      // Log this action with null for related entities that were just deleted
      await this.createActivityLog({
        type: 'invitation_deleted',
        description: `Admin deleted invitation for ${invitation.name} (ID: ${id})`,
        timestamp: new Date(),
        // No specific related entities to reference
        clientId: null,
        salonId: null
      });
      
      return true;
    } catch (error) {
      console.error(`DatabaseStorage.deleteInvitation - Error:`, error);
      return false;
    }
  }

  // Appointment methods
  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    console.log(`DatabaseStorage.createAppointment - Creating new appointment for client ${insertAppointment.clientId} at salon ${insertAppointment.salonId}`);
    
    try {
      const result = await db.insert(appointments).values({
        ...insertAppointment,
        createdAt: new Date()
      }).returning();
      
      console.log(`DatabaseStorage.createAppointment - Successfully created appointment with ID ${result[0].id}`);
      return result[0];
    } catch (error) {
      console.error('DatabaseStorage.createAppointment - Error creating appointment:', error);
      throw error;
    }
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    console.log(`DatabaseStorage.getAppointment - Fetching appointment ID ${id}`);
    
    try {
      const results = await db.select().from(appointments).where(eq(appointments.id, id));
      
      if (results.length > 0) {
        console.log(`DatabaseStorage.getAppointment - Found appointment ID ${id}`);
        return results[0];
      } else {
        console.log(`DatabaseStorage.getAppointment - Appointment ID ${id} not found`);
        return undefined;
      }
    } catch (error) {
      console.error('DatabaseStorage.getAppointment - Error fetching appointment:', error);
      throw error;
    }
  }

  async getClientAppointments(clientId: number): Promise<Appointment[]> {
    console.log(`DatabaseStorage.getClientAppointments - Fetching appointments for client ${clientId}`);
    
    try {
      const results = await db.select().from(appointments).where(eq(appointments.clientId, clientId));
      
      console.log(`DatabaseStorage.getClientAppointments - Retrieved ${results.length} appointments for client ${clientId}`);
      return results;
    } catch (error) {
      console.error('DatabaseStorage.getClientAppointments - Error fetching client appointments:', error);
      throw error;
    }
  }
  
  async getInvitationAppointments(invitationId: number): Promise<Appointment[]> {
    console.log(`DatabaseStorage.getInvitationAppointments - Fetching appointments for invitation ${invitationId}`);
    
    try {
      const results = await db.select().from(appointments).where(eq(appointments.invitationId, invitationId));
      
      console.log(`DatabaseStorage.getInvitationAppointments - Retrieved ${results.length} appointments for invitation ${invitationId}`);
      return results;
    } catch (error) {
      console.error('DatabaseStorage.getInvitationAppointments - Error fetching invitation appointments:', error);
      throw error;
    }
  }

  async getSalonAppointments(salonId: number): Promise<Appointment[]> {
    console.log(`DatabaseStorage.getSalonAppointments - Fetching appointments for salon ${salonId}`);
    
    try {
      const results = await db.select().from(appointments).where(eq(appointments.salonId, salonId));
      
      console.log(`DatabaseStorage.getSalonAppointments - Retrieved ${results.length} appointments for salon ${salonId}`);
      return results;
    } catch (error) {
      console.error('DatabaseStorage.getSalonAppointments - Error fetching salon appointments:', error);
      throw error;
    }
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment> {
    console.log(`DatabaseStorage.updateAppointmentStatus - Updating appointment ${id} status to ${status}`);
    
    try {
      // Update appointment status
      const result = await db
        .update(appointments)
        .set({ status })
        .where(eq(appointments.id, id))
        .returning();
      
      console.log(`DatabaseStorage.updateAppointmentStatus - Successfully updated appointment ${id} status`);
      return result[0];
    } catch (error) {
      console.error('DatabaseStorage.updateAppointmentStatus - Error updating appointment status:', error);
      throw error;
    }
  }
  // Gift methods implementation
  async createGift(insertGift: InsertGift): Promise<Gift> {
    try {
      console.log(`DatabaseStorage.createGift - Creating new gift`);
      
      // CRITICAL DATA INTEGRITY CHECK: Ensure a client cannot send a gift to themselves
      // This is a fundamental business rule - a gift must be from one person to another
      if (insertGift.senderId) {
        // Check if recipientId matches sender (if both are specified)
        if (insertGift.recipientId && insertGift.recipientId === insertGift.senderId) {
          const error = new Error("DATA INTEGRITY VIOLATION: Cannot create gift where sender is the same as recipient (by ID)");
          console.error(error.message);
          throw error;
        }
        
        // If we have a recipient phone, check if it matches the sender's phone
        if (insertGift.recipientPhone) {
          // Get the sender's info to check phone
          const sender = await this.getClient(insertGift.senderId);
          if (sender && sender.phone === insertGift.recipientPhone) {
            const error = new Error("DATA INTEGRITY VIOLATION: Cannot create gift where sender's phone matches recipient phone");
            console.error(error.message);
            throw error;
          }
        }
      }
      
      const giftData = {
        ...insertGift,
        createdAt: new Date()
      };

      const result = await db.insert(gifts).values(giftData).returning();
      
      console.log(`DatabaseStorage.createGift - Gift created with ID ${result[0].id}`);
      return result[0];
    } catch (error) {
      console.error('Error creating gift:', error);
      throw error;
    }
  }

  async getGift(id: number): Promise<Gift | undefined> {
    try {
      console.log(`DatabaseStorage.getGift - Fetching gift with ID ${id}`);
      const results = await db.select().from(gifts).where(eq(gifts.id, id));
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error(`Error getting gift ${id}:`, error);
      throw error;
    }
  }

  async getGiftByRecipientPhone(phone: string): Promise<Gift | undefined> {
    try {
      // Standardize phone format - get only digits for comparison
      const cleanPhone = phone.replace(/\D/g, '');
      console.log(`DatabaseStorage.getGiftByRecipientPhone - Looking for gift with recipient phone ${cleanPhone} (digits only)`);
      
      // Query using regex to match phone numbers regardless of format
      const results = await db
        .select()
        .from(gifts)
        .where(sql`regexp_replace(${gifts.recipientPhone}, '[^0-9]', '', 'g') = ${cleanPhone}`);
      
      console.log(`DatabaseStorage.getGiftByRecipientPhone - Found ${results.length} matching gifts`);
      
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error(`Error getting gift by recipient phone:`, error);
      throw error;
    }
  }

  async getSentGifts(senderId: number): Promise<Gift[]> {
    try {
      console.log(`DatabaseStorage.getSentGifts - Fetching gifts sent by client ID ${senderId}`);
      
      // Get client info to ensure phone matching for gifts sent by phone
      const client = await this.getClient(senderId);
      
      if (!client) {
        console.error(`DatabaseStorage.getSentGifts - Client with ID ${senderId} not found`);
        return [];
      }
      
      // Query by sender ID
      const results = await db
        .select()
        .from(gifts)
        .where(eq(gifts.senderId, senderId))
        .orderBy(sql`${gifts.createdAt} DESC`);
      
      console.log(`DatabaseStorage.getSentGifts - Found ${results.length} gifts`);
      return results;
    } catch (error) {
      console.error(`Error getting sent gifts:`, error);
      throw error;
    }
  }

  async getReceivedGifts(recipientId: number): Promise<Gift[]> {
    try {
      console.log(`DatabaseStorage.getReceivedGifts - Fetching gifts received by client ID ${recipientId}`);
      
      // Get client info to ensure phone matching for gifts received by phone
      const client = await this.getClient(recipientId);
      
      if (!client) {
        console.error(`DatabaseStorage.getReceivedGifts - Client with ID ${recipientId} not found`);
        return [];
      }
      
      // DEBUG: Log client details to verify phone number format
      console.log(`DatabaseStorage.getReceivedGifts - Client phone for matching: "${client.phone}"`);
      
      // Make sure we include gifts sent to this client's phone number, even if recipient_id is null
      // Use regexp_replace to standardize phone number formats for consistent comparison
      const phoneReceivedGiftsPromise = client.phone ? db
        .select()
        .from(gifts)
        .where(
          sql`regexp_replace(${gifts.recipientPhone}, '[^0-9]', '', 'g') = regexp_replace(${client.phone}, '[^0-9]', '', 'g')`
        )
        .orderBy(sql`${gifts.createdAt} DESC`) : Promise.resolve([]);
      
      // Also include gifts explicitly sent to this client ID
      const idReceivedGiftsPromise = db
        .select()
        .from(gifts)
        .where(eq(gifts.recipientId, recipientId))
        .orderBy(sql`${gifts.createdAt} DESC`);
      
      // Fetch both in parallel
      const [phoneReceivedGifts, idReceivedGifts] = await Promise.all([
        phoneReceivedGiftsPromise,
        idReceivedGiftsPromise
      ]);
      
      // DEBUG: Log matching results
      console.log(`DatabaseStorage.getReceivedGifts - Found by phone (${client.phone}): ${phoneReceivedGifts.length}`);
      console.log(`DatabaseStorage.getReceivedGifts - Found by ID (${recipientId}): ${idReceivedGifts.length}`);
      
      // Combine and deduplicate results based on gift ID
      const allGifts = [...idReceivedGifts];
      const giftIds = new Set(allGifts.map(gift => gift.id));
      
      for (const gift of phoneReceivedGifts) {
        if (!giftIds.has(gift.id)) {
          allGifts.push(gift);
          giftIds.add(gift.id);
        }
      }
      
      // DEBUG: Log final combined results
      console.log(`DatabaseStorage.getReceivedGifts - Found ${allGifts.length} total gifts after combination`);
      if (allGifts.length > 0) {
        console.log(`DatabaseStorage.getReceivedGifts - First gift details:`, {
          id: allGifts[0].id,
          sender: allGifts[0].senderId,
          phone: allGifts[0].recipientPhone,
          recipientId: allGifts[0].recipientId
        });
      }
      
      console.log(`DatabaseStorage.getReceivedGifts - Found ${allGifts.length} gifts (${idReceivedGifts.length} by ID, ${phoneReceivedGifts.length} by phone)`);
      return allGifts;
    } catch (error) {
      console.error(`Error getting received gifts:`, error);
      throw error;
    }
  }

  async updateGiftStatus(id: number, status: string): Promise<Gift> {
    try {
      console.log(`DatabaseStorage.updateGiftStatus - Updating gift ID ${id} status to ${status}`);
      
      // Get current gift to ensure it exists
      const currentGift = await this.getGift(id);
      if (!currentGift) {
        throw new Error(`Gift with ID ${id} not found`);
      }
      
      // Prepare update data
      const updateData: Partial<Gift> = {
        status: status
      };
      
      // Add redeemedAt timestamp if status is being set to 'redeemed'
      if (status === 'redeemed') {
        updateData.redeemedAt = new Date();
      }
      
      // Update the gift status in the database
      const result = await db
        .update(gifts)
        .set(updateData)
        .where(eq(gifts.id, id))
        .returning();
      
      if (result.length === 0) {
        throw new Error(`Failed to update gift status for ID ${id}`);
      }
      
      console.log(`DatabaseStorage.updateGiftStatus - Gift status updated successfully`);
      return result[0];
    } catch (error) {
      console.error(`Error updating gift status:`, error);
      throw error;
    }
  }

  async checkUnredeemedGiftByPhone(phone: string): Promise<{hasUnredeemedGift: boolean, gift?: Gift}> {
    try {
      // Standardize phone format - get only digits for comparison
      const cleanPhone = phone.replace(/\D/g, '');
      console.log(`DatabaseStorage.checkUnredeemedGiftByPhone - Checking for unredeemed gift for phone ${cleanPhone}`);
      
      // Query for unredeemed gifts with this phone number
      const results = await db
        .select()
        .from(gifts)
        .where(
          and(
            sql`regexp_replace(${gifts.recipientPhone}, '[^0-9]', '', 'g') = ${cleanPhone}`,
            or(
              eq(gifts.status, 'sent'),
              eq(gifts.status, 'pending')
            )
          )
        ); // Check for both 'sent' and 'pending' gifts that haven't been redeemed yet
      
      const hasUnredeemedGift = results.length > 0;
      
      console.log(`DatabaseStorage.checkUnredeemedGiftByPhone - Found ${results.length} unredeemed gifts`);
      
      return {
        hasUnredeemedGift,
        gift: hasUnredeemedGift ? results[0] : undefined
      };
    } catch (error) {
      console.error(`Error checking unredeemed gift by phone:`, error);
      return { hasUnredeemedGift: false };
    }
  }
  
  /**
   * Check for pending invitations for a phone number and retrieve the most recent one.
   * This is used for the gift/invitation redemption flow.
   * @param phone The recipient's phone number
   * @returns Object containing the pending invitation if found
   */
  async checkPendingInvitationByPhone(phone: string): Promise<{hasPendingInvitation: boolean, invitation?: Invitation}> {
    try {
      // Standardize phone format - get only digits for comparison
      const cleanPhone = phone.replace(/\D/g, '');
      console.log(`DatabaseStorage.checkPendingInvitationByPhone - Checking for pending invitation for phone ${cleanPhone}`);
      
      // Get all invitations
      const allInvitations = await this.getInvitationsByPhone(phone);
      
      // Filter for pending invitations
      const pendingInvitations = allInvitations.filter(invitation => 
        invitation.status === 'pending' || invitation.status === 'sent'
      );
      
      // Sort by created date (newest first)
      pendingInvitations.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      const hasPendingInvitation = pendingInvitations.length > 0;
      
      console.log(`DatabaseStorage.checkPendingInvitationByPhone - Found ${pendingInvitations.length} pending invitations`);
      
      return {
        hasPendingInvitation,
        invitation: hasPendingInvitation ? pendingInvitations[0] : undefined
      };
    } catch (error) {
      console.error(`Error checking pending invitation by phone:`, error);
      return { hasPendingInvitation: false };
    }
  }
}

export const storage = new DatabaseStorage();