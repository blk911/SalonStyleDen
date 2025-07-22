import { eq, and, desc, count, isNull, isNotNull, sql } from "drizzle-orm";
import { db } from "./db";
import { salons, clients, invitations, gifts, styleSelections, activityLogs, payments, appointmentConfirmations } from "../shared/schema";
import { log } from "./vite";
import { createHash } from "crypto";

export interface IStorage {
  // Salon methods
  deleteSalon(id: number): Promise<boolean>;
  getSalon(id: number): Promise<any | null>;
  getSalonByName(name: string): Promise<any | null>;
  createSalon(insertSalon: any): Promise<any>;
  getAllSalons(): Promise<any[]>;
  updateSalon(id: number, updates: any): Promise<any>;

  // Client methods
  getClient(id: number): Promise<any | null>;
  isDuplicateContact(phone: string, email: string): Promise<{ isDuplicate: boolean; field?: string; existingData?: any }>;
  createClient(insertClient: any): Promise<any>;
  getAllClients(): Promise<any[]>;
  updateClient(id: number, updates: any): Promise<any>;
  deleteClient(id: number): Promise<boolean>;

  // Invitation methods
  createInvitation(insertInvitation: any): Promise<any>;
  getInvitation(id: number): Promise<any | null>;
  getInvitationByHash(hash: string): Promise<any | null>;
  getRecentInvitations(limit?: number): Promise<any[]>;
  getSalonInvitations(salonId: number): Promise<any[]>;
  getClientInvitations(clientId: number, limit?: number): Promise<any[]>;
  updateInvitationStatus(id: number, status: string): Promise<any>;
  updateInvitationGiftStatus(id: number, status: string, styleId?: number): Promise<any>;
  deleteInvitation(id: number): Promise<boolean>;

  // Gift methods
  createGift(insertGift: any): Promise<any>;
  getGift(id: number): Promise<any | null>;
  getGiftByHash(giftHash: string): Promise<any | null>;
  getSentGifts(senderPhone: string): Promise<any[]>;
  getReceivedGifts(recipientPhone: string): Promise<any[]>;
  deleteGift(id: number): Promise<boolean>;

  // Validation methods
  validateRegistration(phone: string, email: string): Promise<{ isValid: boolean; message: string }>;
}

export class DatabaseStorage implements IStorage {
  private _salonsCache: any[] | null = null;
  private _clientsCache: any[] | null = null;
  private _invitationsCache: any[] | null = null;
  private _giftsCache: any[] | null = null;

  async deleteSalon(id: number): Promise<boolean> {
    try {
      log(`DatabaseStorage.deleteSalon - Deleting salon with id: ${id}`, 'db');
      
      await db.delete(clients).where(eq(clients.salonId, id));
      log(`DatabaseStorage.deleteSalon - Deleted clients for salon ${id}`, 'db');
      
      await db.delete(invitations).where(eq(invitations.salonId, id));
      log(`DatabaseStorage.deleteSalon - Deleted invitations for salon ${id}`, 'db');
      
      await db.delete(gifts).where(eq(gifts.salonId, id));
      log(`DatabaseStorage.deleteSalon - Deleted gifts for salon ${id}`, 'db');
      
      const result = await db.delete(salons).where(eq(salons.id, id));
      this._salonsCache = null;
      this._clientsCache = null;
      this._invitationsCache = null;
      this._giftsCache = null;
      
      log(`DatabaseStorage.deleteSalon - Successfully deleted salon ${id}`, 'db');
      return true;
    } catch (error) {
      log(`DatabaseStorage.deleteSalon - Error deleting salon: ${error}`, 'db');
      return false;
    }
  }

  async getSalon(id: number): Promise<any | null> {
    try {
      log(`DatabaseStorage.getSalon - Getting salon with id: ${id}`, 'db');
      const result = await db.select().from(salons).where(eq(salons.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      log(`DatabaseStorage.getSalon - Error getting salon: ${error}`, 'db');
      throw error;
    }
  }

  async getSalonByName(name: string): Promise<any | null> {
    try {
      log(`DatabaseStorage.getSalonByName - Getting salon with name: ${name}`, 'db');
      const result = await db.select().from(salons).where(eq(salons.name, name)).limit(1);
      return result[0] || null;
    } catch (error) {
      log(`DatabaseStorage.getSalonByName - Error getting salon by name: ${error}`, 'db');
      throw error;
    }
  }

  async createSalon(insertSalon: any): Promise<any> {
    try {
      log(`DatabaseStorage.createSalon - Creating salon: ${insertSalon.name}`, 'db');
      const result = await db.insert(salons).values(insertSalon).returning();
      this._salonsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.createSalon - Error creating salon: ${error}`, 'db');
      throw error;
    }
  }

  async getAllSalons(): Promise<any[]> {
    try {
      if (this._salonsCache) {
        log('DatabaseStorage.getAllSalons - Returning cached salons', 'db');
        return this._salonsCache;
      }
      
      log('DatabaseStorage.getAllSalons - Fetching all salons from database', 'db');
      const result = await db.select().from(salons);
      this._salonsCache = result;
      return result;
    } catch (error) {
      log(`DatabaseStorage.getAllSalons - Error getting all salons: ${error}`, 'db');
      throw error;
    }
  }

  async updateSalon(id: number, updates: any): Promise<any> {
    try {
      log(`DatabaseStorage.updateSalon - Updating salon with id: ${id}`, 'db');
      const result = await db.update(salons).set(updates).where(eq(salons.id, id)).returning();
      this._salonsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.updateSalon - Error updating salon: ${error}`, 'db');
      throw error;
    }
  }

  async getClient(id: number): Promise<any | null> {
    try {
      log(`DatabaseStorage.getClient - Getting client with id: ${id}`, 'db');
      const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      log(`DatabaseStorage.getClient - Error getting client: ${error}`, 'db');
      throw error;
    }
  }

  async isDuplicateContact(phone: string, email: string): Promise<{ isDuplicate: boolean; field?: string; existingData?: any }> {
    try {
      log(`DatabaseStorage.isDuplicateContact - Checking for duplicates: phone='${phone}', email='${email}'`, 'db');
      
      const cleanPhone = phone.replace(/\D/g, '');
      log(`DatabaseStorage.isDuplicateContact - Standardized phone (digits only): '${cleanPhone}'`, 'db');
      
      const clientsWithPhone = await db.select().from(clients).where(eq(clients.phone, cleanPhone));
      log(`DatabaseStorage.isDuplicateContact - Clients found with same phone: ${clientsWithPhone.length}`, 'db');
      
      if (clientsWithPhone.length > 0) {
        return { isDuplicate: true, field: 'phone', existingData: clientsWithPhone[0] };
      }
      
      const invitationsWithPhone = await db.select().from(invitations).where(eq(invitations.phone, cleanPhone));
      log(`DatabaseStorage.isDuplicateContact - Invitations found with same phone: ${invitationsWithPhone.length}`, 'db');
      
      if (invitationsWithPhone.length > 0) {
        return { isDuplicate: true, field: 'phone', existingData: invitationsWithPhone[0] };
      }
      
      const salonsWithPhone = await db.select().from(salons).where(eq(salons.phone, cleanPhone));
      log(`DatabaseStorage.isDuplicateContact - Salons found with same phone: ${salonsWithPhone.length}`, 'db');
      
      if (salonsWithPhone.length > 0) {
        return { isDuplicate: true, field: 'phone', existingData: salonsWithPhone[0] };
      }
      
      if (email) {
        const lowerEmail = email.toLowerCase();
        log(`DatabaseStorage.isDuplicateContact - Standardized email (lowercase): '${lowerEmail}'`, 'db');
        
        const clientsWithEmail = await db.select().from(clients).where(eq(clients.email, lowerEmail));
        log(`DatabaseStorage.isDuplicateContact - Clients found with same email: ${clientsWithEmail.length}`, 'db');
        
        if (clientsWithEmail.length > 0) {
          return { isDuplicate: true, field: 'email', existingData: clientsWithEmail[0] };
        }
        
        const invitationsWithEmail = await db.select().from(invitations).where(eq(invitations.email, lowerEmail));
        log(`DatabaseStorage.isDuplicateContact - Invitations found with same email: ${invitationsWithEmail.length}`, 'db');
        
        if (invitationsWithEmail.length > 0) {
          return { isDuplicate: true, field: 'email', existingData: invitationsWithEmail[0] };
        }
        
        const salonsWithEmail = await db.select().from(salons).where(eq(salons.email, lowerEmail));
        log(`DatabaseStorage.isDuplicateContact - Salons found with same email: ${salonsWithEmail.length}`, 'db');
        
        if (salonsWithEmail.length > 0) {
          return { isDuplicate: true, field: 'email', existingData: salonsWithEmail[0] };
        }
      }
      
      log(`DatabaseStorage.isDuplicateContact - No duplicates found`, 'db');
      return { isDuplicate: false };
    } catch (error) {
      log(`DatabaseStorage.isDuplicateContact - Error checking for duplicates: ${error}`, 'db');
      return { isDuplicate: false };
    }
  }

  async createClient(insertClient: any): Promise<any> {
    try {
      log(`DatabaseStorage.createClient - Creating client: ${insertClient.name}`, 'db');
      const result = await db.insert(clients).values(insertClient).returning();
      this._clientsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.createClient - Error creating client: ${error}`, 'db');
      throw error;
    }
  }

  async getAllClients(): Promise<any[]> {
    try {
      if (this._clientsCache) {
        log('DatabaseStorage.getAllClients - Returning cached clients', 'db');
        return this._clientsCache;
      }
      
      log('DatabaseStorage.getAllClients - Fetching all clients from database', 'db');
      const result = await db.select().from(clients);
      this._clientsCache = result;
      return result;
    } catch (error) {
      log(`DatabaseStorage.getAllClients - Error getting all clients: ${error}`, 'db');
      throw error;
    }
  }

  async updateClient(id: number, updates: any): Promise<any> {
    try {
      log(`DatabaseStorage.updateClient - Updating client with id: ${id}`, 'db');
      const result = await db.update(clients).set(updates).where(eq(clients.id, id)).returning();
      this._clientsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.updateClient - Error updating client: ${error}`, 'db');
      throw error;
    }
  }

  async deleteClient(id: number): Promise<boolean> {
    try {
      log(`DatabaseStorage.deleteClient - Deleting client with id: ${id}`, 'db');
      
      await db.delete(gifts).where(eq(gifts.senderId, id));
      log(`DatabaseStorage.deleteClient - Deleted sent gifts for client ${id}`, 'db');
      
      await db.delete(gifts).where(eq(gifts.recipientId, id));
      log(`DatabaseStorage.deleteClient - Deleted received gifts for client ${id}`, 'db');
      
      await db.delete(invitations).where(eq(invitations.senderId, id));
      log(`DatabaseStorage.deleteClient - Deleted sent invitations for client ${id}`, 'db');
      
      // Delete all style selections for this client
      await db.delete(styleSelections).where(eq(styleSelections.clientId, id));
      log(`DatabaseStorage.deleteClient - Deleted style selections for client ${id}`, 'db');
      
      await db.delete(activityLogs).where(eq(activityLogs.clientId, id));
      log(`DatabaseStorage.deleteClient - Deleted activity logs for client ${id}`, 'db');
      
      const result = await db.delete(clients).where(eq(clients.id, id));
      this._clientsCache = null;
      this._invitationsCache = null;
      this._giftsCache = null;
      
      log(`DatabaseStorage.deleteClient - Successfully deleted client ${id}`, 'db');
      return true;
    } catch (error) {
      log(`DatabaseStorage.deleteClient - Error deleting client: ${error}`, 'db');
      return false;
    }
  }

  async createInvitation(insertInvitation: any): Promise<any> {
    try {
      log(`DatabaseStorage.createInvitation - Creating invitation for: ${insertInvitation.name}`, 'db');
      
      if (!insertInvitation.inviteHash) {
        insertInvitation.inviteHash = createHash('sha256')
          .update(`${insertInvitation.phone}-${insertInvitation.email}-${Date.now()}`)
          .digest('hex')
          .substring(0, 16);
      }
      
      const result = await db.insert(invitations).values(insertInvitation).returning();
      this._invitationsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.createInvitation - Error creating invitation: ${error}`, 'db');
      throw error;
    }
  }

  async getInvitation(id: number): Promise<any | null> {
    try {
      log(`DatabaseStorage.getInvitation - Getting invitation with id: ${id}`, 'db');
      const result = await db.select().from(invitations).where(eq(invitations.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      log(`DatabaseStorage.getInvitation - Error getting invitation: ${error}`, 'db');
      throw error;
    }
  }

  async getRecentInvitations(limit?: number): Promise<any[]> {
    try {
      log(`DatabaseStorage.getRecentInvitations - Getting recent invitations with limit: ${limit}`, 'db');
      let query = db.select().from(invitations).orderBy(desc(invitations.createdAt));
      if (limit) {
        query = query.limit(limit) as any;
      }
      return await query;
    } catch (error) {
      log(`DatabaseStorage.getRecentInvitations - Error getting recent invitations: ${error}`, 'db');
      throw error;
    }
  }

  async getSalonInvitations(salonId: number): Promise<any[]> {
    try {
      log(`DatabaseStorage.getSalonInvitations - Getting invitations for salon: ${salonId}`, 'db');
      const result = await db.select().from(invitations).where(eq(invitations.salonId, salonId));
      return result;
    } catch (error) {
      log(`DatabaseStorage.getSalonInvitations - Error getting salon invitations: ${error}`, 'db');
      throw error;
    }
  }

  async getClientInvitations(clientId: number, limit?: number): Promise<any[]> {
    try {
      log(`DatabaseStorage.getClientInvitations - Getting invitations for client: ${clientId}`, 'db');
      
      const whereConditions = [eq(invitations.senderId, clientId)];
      
      let query = db.select().from(invitations).where(and(...whereConditions)).orderBy(desc(invitations.createdAt));
      
      if (limit) {
        query = query.limit(limit) as any;
      }
      
      const result = await query;
      log(`DatabaseStorage.getClientInvitations - Found ${result.length} invitations for client ${clientId}`, 'db');
      return result;
    } catch (error) {
      log(`DatabaseStorage.getClientInvitations - Error getting client invitations: ${error}`, 'db');
      throw error;
    }
  }

  async getInvitationsByPhone(phone: string, partialMatch: boolean = false): Promise<any[]> {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      log(`DatabaseStorage.getInvitationsByPhone - Searching for phone: ${phone} (cleaned: ${cleanPhone}), partialMatch: ${partialMatch}`, 'db');
      
      const result = await db.select().from(invitations).where(eq(invitations.phone, cleanPhone));
      log(`DatabaseStorage.getInvitationsByPhone - Found ${result.length} invitations for phone ${cleanPhone}`, 'db');
      return result;
    } catch (error) {
      log(`DatabaseStorage.getInvitationsByPhone - Error fetching invitations by phone: ${error}`, 'db');
      throw error;
    }
  }

  async updateInvitationStatus(id: number, status: string): Promise<any> {
    try {
      log(`DatabaseStorage.updateInvitationStatus - Updating invitation ${id} status to: ${status}`, 'db');
      const result = await db.update(invitations).set({ status: status }).where(eq(invitations.id, id)).returning();
      this._invitationsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.updateInvitationStatus - Error updating invitation status: ${error}`, 'db');
      throw error;
    }
  }

  async createGift(insertGift: any): Promise<any> {
    try {
      log(`DatabaseStorage.createGift - Creating gift for recipient: ${insertGift.recipientPhone}`, 'db');
      log(`DatabaseStorage.createGift - Input data: ${JSON.stringify(insertGift, null, 2)}`, 'db');
      
      if (!insertGift.giftHash) {
        insertGift.giftHash = createHash('sha256')
          .update(`${insertGift.recipientPhone}-${insertGift.amount}-${Date.now()}`)
          .digest('hex')
          .substring(0, 16);
      }
      
      const now = new Date();
      
      if (!insertGift.createdAt) {
        insertGift.createdAt = now;
      } else if (typeof insertGift.createdAt !== 'object' || insertGift.createdAt.constructor !== Date) {
        insertGift.createdAt = new Date(insertGift.createdAt);
      }
      
      if (!insertGift.updatedAt) {
        insertGift.updatedAt = now;
      } else if (typeof insertGift.updatedAt !== 'object' || insertGift.updatedAt.constructor !== Date) {
        insertGift.updatedAt = new Date(insertGift.updatedAt);
      }
      
      if (insertGift.expiresAt === undefined || insertGift.expiresAt === null) {
        insertGift.expiresAt = null;
      } else if (typeof insertGift.expiresAt !== 'object' || insertGift.expiresAt.constructor !== Date) {
        insertGift.expiresAt = new Date(insertGift.expiresAt);
      }
      
      if (insertGift.redeemedAt === undefined || insertGift.redeemedAt === null) {
        insertGift.redeemedAt = null;
      } else if (typeof insertGift.redeemedAt !== 'object' || insertGift.redeemedAt.constructor !== Date) {
        insertGift.redeemedAt = new Date(insertGift.redeemedAt);
      }
      
      if (!insertGift.recipientName) {
        insertGift.recipientName = 'Unknown Recipient';
      }
      
      log(`DatabaseStorage.createGift - Processed data before insert: ${JSON.stringify({
        ...insertGift,
        createdAt: insertGift.createdAt?.toISOString(),
        updatedAt: insertGift.updatedAt?.toISOString(),
        expiresAt: insertGift.expiresAt?.toISOString() || null,
        redeemedAt: insertGift.redeemedAt?.toISOString() || null
      }, null, 2)}`, 'db');
      
      const result = await db.insert(gifts).values(insertGift).returning();
      this._giftsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.createGift - Error creating gift: ${error}`, 'db');
      log(`DatabaseStorage.createGift - Error stack: ${(error as Error).stack}`, 'db');
      throw error;
    }
  }

  async getGift(id: number): Promise<any | null> {
    try {
      log(`DatabaseStorage.getGift - Getting gift with id: ${id}`, 'db');
      const result = await db.select().from(gifts).where(eq(gifts.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      log(`DatabaseStorage.getGift - Error getting gift: ${error}`, 'db');
      throw error;
    }
  }

  async getGiftByHash(giftHash: string): Promise<any | null> {
    try {
      log(`DatabaseStorage.getGiftByHash - Getting gift with hash: ${giftHash}`, 'db');
      const result = await db.select().from(gifts).where(eq(gifts.giftHash, giftHash)).limit(1);
      return result[0] || null;
    } catch (error) {
      log(`DatabaseStorage.getGiftByHash - Error getting gift by hash: ${error}`, 'db');
      throw error;
    }
  }

  async getSentGifts(senderPhone: string): Promise<any[]> {
    try {
      log(`DatabaseStorage.getSentGifts - Getting sent gifts for: ${senderPhone}`, 'db');
      const result = await db.select().from(gifts).where(eq(gifts.senderPhone, senderPhone));
      return result;
    } catch (error) {
      log(`DatabaseStorage.getSentGifts - Error getting sent gifts: ${error}`, 'db');
      throw error;
    }
  }

  async getReceivedGifts(recipientPhone: string): Promise<any[]> {
    try {
      log(`DatabaseStorage.getReceivedGifts - Getting received gifts for: ${recipientPhone}`, 'db');
      const result = await db.select().from(gifts).where(eq(gifts.recipientPhone, recipientPhone));
      return result;
    } catch (error) {
      log(`DatabaseStorage.getReceivedGifts - Error getting received gifts: ${error}`, 'db');
      throw error;
    }
  }

  async validateRegistration(phone: string, email: string): Promise<{ isValid: boolean; message: string }> {
    try {
      log(`DatabaseStorage.validateRegistration - Validating registration for: ${phone}, ${email}`, 'db');
      
      const duplicateCheck = await this.isDuplicateContact(phone, email);
      
      if (duplicateCheck.isDuplicate) {
        return {
          isValid: false,
          message: `A user with this ${duplicateCheck.field} already exists`
        };
      }
      
      return {
        isValid: true,
        message: 'Registration is valid'
      };
    } catch (error) {
      log(`DatabaseStorage.validateRegistration - Error validating registration: ${error}`, 'db');
      return {
        isValid: false,
        message: 'Error validating registration'
      };
    }
  }

  async updateSalonServices(id: number, services: any[]): Promise<any> {
    try {
      log(`DatabaseStorage.updateSalonServices - Updating services for salon ${id}`, 'db');
      const servicesJson = JSON.stringify(services);
      const result = await db.update(salons).set({ services: servicesJson }).where(eq(salons.id, id)).returning();
      this._salonsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.updateSalonServices - Error updating salon services: ${error}`, 'db');
      throw error;
    }
  }

  async updateSalonPromos(id: number, promos: any[]): Promise<any> {
    try {
      log(`DatabaseStorage.updateSalonPromos - Updating promos for salon ${id}`, 'db');
      const promosJson = JSON.stringify(promos);
      const result = await db.update(salons).set({ promos: promosJson }).where(eq(salons.id, id)).returning();
      this._salonsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.updateSalonPromos - Error updating salon promos: ${error}`, 'db');
      throw error;
    }
  }

  async validateInvitation(phone: string, email: string, senderId: number): Promise<{ isValid: boolean; message: string }> {
    try {
      log(`DatabaseStorage.validateInvitation - Validating invitation for: ${phone}, ${email}, sender: ${senderId}`, 'db');
      
      const duplicateCheck = await this.isDuplicateContact(phone, email);
      
      if (duplicateCheck.isDuplicate) {
        return {
          isValid: false,
          message: `A user with this ${duplicateCheck.field} already exists`
        };
      }
      
      return {
        isValid: true,
        message: 'Invitation is valid'
      };
    } catch (error) {
      log(`DatabaseStorage.validateInvitation - Error validating invitation: ${error}`, 'db');
      return {
        isValid: false,
        message: 'Error validating invitation'
      };
    }
  }

  async checkUnredeemedGiftByPhone(phone: string): Promise<{ hasUnredeemedGift: boolean; giftData?: any }> {
    try {
      log(`DatabaseStorage.checkUnredeemedGiftByPhone - Checking unredeemed gifts for: ${phone}`, 'db');
      const cleanPhone = phone.replace(/\D/g, '');
      
      const unredeemedGifts = await db.select().from(gifts)
        .where(and(eq(gifts.recipientPhone, cleanPhone), isNull(gifts.redeemedAt)));
      
      if (unredeemedGifts.length > 0) {
        return { hasUnredeemedGift: true, giftData: unredeemedGifts[0] };
      }
      
      return { hasUnredeemedGift: false };
    } catch (error) {
      log(`DatabaseStorage.checkUnredeemedGiftByPhone - Error checking unredeemed gifts: ${error}`, 'db');
      return { hasUnredeemedGift: false };
    }
  }

  async createActivityLog(logData: any): Promise<any> {
    try {
      log(`DatabaseStorage.createActivityLog - Creating activity log: ${logData.type}`, 'db');
      log(`Activity: ${logData.type} - ${logData.description}`, 'db');
      return { id: Date.now(), ...logData, createdAt: new Date() };
    } catch (error) {
      log(`DatabaseStorage.createActivityLog - Error creating activity log: ${error}`, 'db');
      throw error;
    }
  }

  async getGiftsByRecipientPhone(phone: string, status?: string): Promise<any[]> {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      log(`DatabaseStorage.getGiftsByRecipientPhone - Getting gifts for phone: ${cleanPhone}, status: ${status}`, 'db');
      
      let whereConditions = eq(gifts.recipientPhone, cleanPhone);
      
      if (status) {
        whereConditions = and(whereConditions, eq(gifts.status, status)) as any;
      }
      
      const result = await db.select().from(gifts).where(whereConditions);
      log(`DatabaseStorage.getGiftsByRecipientPhone - Found ${result.length} gifts for phone ${cleanPhone}`, 'db');
      return result;
    } catch (error) {
      log(`DatabaseStorage.getGiftsByRecipientPhone - Error getting gifts by recipient phone: ${error}`, 'db');
      throw error;
    }
  }

  async updateGift(id: number, updates: any): Promise<any> {
    try {
      log(`DatabaseStorage.updateGift - Updating gift with id: ${id}`, 'db');
      
      if (updates.updatedAt === undefined) {
        updates.updatedAt = new Date();
      }
      if (updates.redeemedAt && typeof updates.redeemedAt !== 'object') {
        updates.redeemedAt = new Date(updates.redeemedAt);
      }
      
      const result = await db.update(gifts).set(updates).where(eq(gifts.id, id)).returning();
      this._giftsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.updateGift - Error updating gift: ${error}`, 'db');
      throw error;
    }
  }

  async suspendClient(id: number): Promise<any> {
    try {
      log(`DatabaseStorage.suspendClient - Suspending client with id: ${id}`, 'db');
      const result = await db.update(clients).set({ suspended: true }).where(eq(clients.id, id)).returning();
      this._clientsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.suspendClient - Error suspending client: ${error}`, 'db');
      throw error;
    }
  }

  async getInvitationByHash(hash: string): Promise<any | null> {
    try {
      log(`DatabaseStorage.getInvitationByHash - Getting invitation with hash: ${hash}`, 'db');
      const result = await db.select().from(invitations).where(eq(invitations.inviteHash, hash)).limit(1);
      return result[0] || null;
    } catch (error) {
      log(`DatabaseStorage.getInvitationByHash - Error getting invitation by hash: ${error}`, 'db');
      throw error;
    }
  }

  async updateInvitationGiftStatus(id: number, status: string, styleId?: number): Promise<any> {
    try {
      log(`DatabaseStorage.updateInvitationGiftStatus - Updating invitation ${id} status to: ${status}, styleId: ${styleId}`, 'db');
      const updates: any = { status: status as any };
      if (styleId !== undefined) {
        updates.styleOption = styleId.toString();
      }
      const result = await db.update(invitations).set(updates).where(eq(invitations.id, id)).returning();
      this._invitationsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.updateInvitationGiftStatus - Error updating invitation gift status: ${error}`, 'db');
      throw error;
    }
  }

  async deleteInvitation(id: number): Promise<boolean> {
    try {
      log(`DatabaseStorage.deleteInvitation - Deleting invitation with id: ${id}`, 'db');
      
      // Delete the invitation itself - no related artifacts to clean up based on schema
      const result = await db.delete(invitations).where(eq(invitations.id, id));
      this._invitationsCache = null;
      
      log(`DatabaseStorage.deleteInvitation - Successfully deleted invitation ${id}`, 'db');
      return true;
    } catch (error) {
      log(`DatabaseStorage.deleteInvitation - Error deleting invitation: ${error}`, 'db');
      return false;
    }
  }

  async deleteGift(id: number): Promise<boolean> {
    try {
      log(`DatabaseStorage.deleteGift - Deleting gift with id: ${id}`, 'db');
      
      // Delete related artifacts that have proper foreign key relationships
      await db.delete(payments).where(eq(payments.giftId, id));
      log(`DatabaseStorage.deleteGift - Deleted payments for gift ${id}`, 'db');
      
      await db.delete(appointmentConfirmations).where(eq(appointmentConfirmations.giftId, id));
      log(`DatabaseStorage.deleteGift - Deleted appointment confirmations for gift ${id}`, 'db');
      
      const result = await db.delete(gifts).where(eq(gifts.id, id));
      this._giftsCache = null;
      
      log(`DatabaseStorage.deleteGift - Successfully deleted gift ${id}`, 'db');
      return true;
    } catch (error) {
      log(`DatabaseStorage.deleteGift - Error deleting gift: ${error}`, 'db');
      return false;
    }
  }

  async hasSalonReachedInvitationLimit(salonId: number): Promise<{ hasReachedLimit: boolean; currentCount: number; limit: number }> {
    try {
      log(`DatabaseStorage.hasSalonReachedInvitationLimit - Checking invitation limit for salon: ${salonId}`, 'db');
      
      const invitationCount = await db.select({ count: count() }).from(invitations).where(eq(invitations.salonId, salonId));
      const currentCount = invitationCount[0]?.count || 0;
      
      const limit = 100;
      
      return {
        hasReachedLimit: currentCount >= limit,
        currentCount,
        limit
      };
    } catch (error) {
      log(`DatabaseStorage.hasSalonReachedInvitationLimit - Error checking invitation limit: ${error}`, 'db');
      return { hasReachedLimit: false, currentCount: 0, limit: 100 };
    }
  }

  async updateSalonLicense(id: number, licenseData: any): Promise<any> {
    try {
      log(`DatabaseStorage.updateSalonLicense - Updating license for salon ${id}`, 'db');
      const result = await db.update(salons).set(licenseData).where(eq(salons.id, id)).returning();
      this._salonsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.updateSalonLicense - Error updating salon license: ${error}`, 'db');
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
