import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

// Validation schemas
const salonInputSchema = z.object({
  name: z.string().min(2),
  ownerName: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  socialMedia: z.array(z.object({
    platform: z.string(),
    handle: z.string()
  })).optional(),
  type: z.literal("salon")
});

const clientInputSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  isCurrentClient: z.boolean(),
  notes: z.string().optional(),
  favoriteServices: z.array(z.string()).optional(),
  type: z.literal("client")
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoints prefix
  const apiRouter = express.Router();
  
  // Salon routes
  apiRouter.post("/salons", async (req: Request, res: Response) => {
    try {
      const validatedData = salonInputSchema.parse(req.body);
      const salon = await storage.createSalon(validatedData);
      res.status(201).json(salon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create salon" });
      }
    }
  });
  
  apiRouter.get("/salons", async (req: Request, res: Response) => {
    try {
      const salons = await storage.getAllSalons();
      res.json(salons);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve salons" });
    }
  });
  
  apiRouter.get("/salons/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const salon = await storage.getSalon(id);
      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }
      
      res.json(salon);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve salon" });
    }
  });
  
  // Client routes
  apiRouter.post("/clients", async (req: Request, res: Response) => {
    try {
      console.log('Received client registration data:', req.body);
      
      // Validate and parse client input data
      const validatedData = clientInputSchema.parse(req.body);
      console.log('Validated client data:', validatedData);
      
      // Create client in database
      const client = await storage.createClient(validatedData);
      console.log('Created client with ID:', client.id);
      
      // Return the client data
      res.status(201).json(client);
    } catch (error) {
      console.error('Error creating client:', error);
      
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create client" });
      }
    }
  });
  
  apiRouter.get("/clients", async (req: Request, res: Response) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve clients" });
    }
  });
  
  apiRouter.get("/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.error('Invalid client ID format:', req.params.id);
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      console.log('Fetching client with ID:', id);
      const client = await storage.getClient(id);
      
      if (!client) {
        console.error('Client not found with ID:', id);
        return res.status(404).json({ error: "Client not found" });
      }
      
      // Log retrieved client data with favorite services
      console.log('Retrieved client:', {
        id: client.id,
        name: client.name,
        favoriteServices: client.favoriteServices
      });
      
      res.json(client);
    } catch (error) {
      console.error('Error retrieving client:', error);
      res.status(500).json({ error: "Failed to retrieve client" });
    }
  });

  // Register API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
