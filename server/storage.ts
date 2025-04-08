import { 
  users, type User, type InsertUser,
  salons, type Salon, type InsertSalon,
  clients, type Client, type InsertClient
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private salons: Map<number, Salon>;
  private clients: Map<number, Client>;
  private userCurrentId: number;
  private salonCurrentId: number;
  private clientCurrentId: number;

  constructor() {
    this.users = new Map();
    this.salons = new Map();
    this.clients = new Map();
    this.userCurrentId = 1;
    this.salonCurrentId = 1;
    this.clientCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Salon methods
  async getSalon(id: number): Promise<Salon | undefined> {
    return this.salons.get(id);
  }
  
  async createSalon(insertSalon: InsertSalon): Promise<Salon> {
    const id = this.salonCurrentId++;
    // Ensure type is always set
    const salon: Salon = { 
      ...insertSalon, 
      id,
      type: "salon",
      socialMedia: insertSalon.socialMedia || null
    };
    this.salons.set(id, salon);
    return salon;
  }
  
  async getAllSalons(): Promise<Salon[]> {
    return Array.from(this.salons.values());
  }
  
  // Client methods
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }
  
  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientCurrentId++;
    // Ensure all required fields are set
    const client: Client = { 
      ...insertClient, 
      id,
      type: "client",
      isCurrentClient: insertClient.isCurrentClient ?? false,
      notes: insertClient.notes || null,
      favoriteServices: insertClient.favoriteServices || null
    };
    this.clients.set(id, client);
    return client;
  }
  
  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }
}

export const storage = new MemStorage();
