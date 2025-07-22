import { eq, and, desc, count, isNull, isNotNull, sql } from "drizzle-orm";
import { db } from "./db";
import { salons, clients, invitations, gifts } from "../shared/schema";
import { log } from "./vite";
import { createHash } from "crypto";

export interface IStorage {
  // Salon methods
  deleteSalon(id: number): Promise<void>;
  getSalon(id: number): Promise<any | null>;
  getSalonByName(name: string): Promise<any | null>;
  createSalon(insertSalon: any): Promise<any>;
  getAllSalons(): Promise<any[]>;
  updateSalon(id: number, updates: any): Promise<any>;

  // Client methods
  getClient(id: number): Promise<any | null>;
  isDuplicateContact(phone: string, email: string): Promise<boolean>;
  createClient(insertClient: any): Promise<any>;
  getAllClients(): Promise<any[]>;
  updateClient(id: number, updates: any): Promise<any>;
  deleteClient(id: number): Promise<void>;

  // Invitation methods
  createInvitation(insertInvitation: any): Promise<any>;
  getInvitation(id: number): Promise<any | null>;
  getRecentInvitations(limit?: number): Promise<any[]>;
  getSalonInvitations(salonId: number): Promise<any[]>;
  getClientInvitations(clientId: number, limit?: number): Promise<any[]>;
  updateInvitationStatus(id: number, status: string): Promise<any>;

  // Gift methods
  createGift(insertGift: any): Promise<any>;
  getGift(id: number): Promise<any | null>;
  getGiftByHash(giftHash: string): Promise<any | null>;
  getSentGifts(senderPhone: string): Promise<any[]>;
  getReceivedGifts(recipientPhone: string): Promise<any[]>;

  // Validation methods
  validateRegistration(phone: string, email: string): Promise<{ isValid: boolean; message: string }>;
}

export class DatabaseStorage implements IStorage {
  private _salonsCache: any[] | null = null;
  private _clientsCache: any[] | null = null;
  private _invitationsCache: any[] | null = null;
  private _giftsCache: any[] | null = null;

  async deleteSalon(id: number): Promise<void> {
    try {
      log(`DatabaseStorage.deleteSalon - Deleting salon with id: ${id}`, 'db');
      await db.delete(salons).where(eq(salons.id, id));
      this._salonsCache = null;
    } catch (error) {
      log(`DatabaseStorage.deleteSalon - Error deleting salon: ${error}`, 'db');
      throw error;
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

  async isDuplicateContact(phone: string, email: string): Promise<boolean> {
    try {
      log(`DatabaseStorage.isDuplicateContact - Checking for duplicate contact: ${phone}, ${email}`, 'db');
      
      const conditions = [];
      if (phone) {
        conditions.push(eq(clients.phone, phone));
      }
      if (email) {
        conditions.push(eq(clients.email, email));
      }
      
      if (conditions.length === 0) {
        return false;
      }
      
      const result = await db.select({ count: count() })
        .from(clients)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions));
      
      const duplicateCount = result[0]?.count || 0;
      const isDuplicate = duplicateCount > 0;
      
      log(`DatabaseStorage.isDuplicateContact - Found ${duplicateCount} duplicates, isDuplicate: ${isDuplicate}`, 'db');
      return isDuplicate;
    } catch (error) {
      log(`DatabaseStorage.isDuplicateContact - Error checking duplicate contact: ${error}`, 'db');
      return false;
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

  async deleteClient(id: number): Promise<void> {
    try {
      log(`DatabaseStorage.deleteClient - Deleting client with id: ${id}`, 'db');
      await db.delete(clients).where(eq(clients.id, id));
      this._clientsCache = null;
    } catch (error) {
      log(`DatabaseStorage.deleteClient - Error deleting client: ${error}`, 'db');
      throw error;
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
        query = query.limit(limit);
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
      
      const whereConditions = [eq(invitations.clientId, clientId)];
      
      let query = db.select().from(invitations).where(and(...whereConditions)).orderBy(desc(invitations.createdAt));
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const result = await query;
      log(`DatabaseStorage.getClientInvitations - Found ${result.length} invitations for client ${clientId}`, 'db');
      return result;
    } catch (error) {
      log(`DatabaseStorage.getClientInvitations - Error getting client invitations: ${error}`, 'db');
      throw error;
    }
  }

  async updateInvitationStatus(id: number, status: string): Promise<any> {
    try {
      log(`DatabaseStorage.updateInvitationStatus - Updating invitation ${id} status to: ${status}`, 'db');
      const result = await db.update(invitations).set({ status: status as any }).where(eq(invitations.id, id)).returning();
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
      
      if (!insertGift.giftHash) {
        insertGift.giftHash = createHash('sha256')
          .update(`${insertGift.recipientPhone}-${insertGift.amount}-${Date.now()}`)
          .digest('hex')
          .substring(0, 16);
      }
      
      const result = await db.insert(gifts).values(insertGift).returning();
      this._giftsCache = null;
      return result[0];
    } catch (error) {
      log(`DatabaseStorage.createGift - Error creating gift: ${error}`, 'db');
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
      
      const isDuplicate = await this.isDuplicateContact(phone, email);
      
      if (isDuplicate) {
        return {
          isValid: false,
          message: 'A user with this phone number or email already exists'
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
}

export const storage = new DatabaseStorage();
