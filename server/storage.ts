import { 
  users, type User, type InsertUser,
  salons, type Salon, type InsertSalon,
  clients, type Client, type InsertClient
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
  
  // Client methods
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  getAllClients(): Promise<Client[]>;
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
    return await db.select().from(salons);
  }

  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    const results = await db.select().from(clients).where(eq(clients.id, id));
    return results.length > 0 ? results[0] : undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    // Ensure required fields are set
    const clientData = {
      ...insertClient,
      type: "client",
      isCurrentClient: insertClient.isCurrentClient ?? false,
      notes: insertClient.notes || null,
      favoriteServices: insertClient.favoriteServices || null,
      createdAt: new Date()
    };
    
    const result = await db.insert(clients).values(clientData).returning();
    return result[0];
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }
}

export const storage = new DatabaseStorage();
