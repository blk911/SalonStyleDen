import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { importSalons, importClients } from "./utils/importData";

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
  salonId: z.number().optional(),
  salonName: z.string().optional(),
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
  
  // Update salon services
  apiRouter.post("/salons/:id/services", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Get the services array from request body
      const { services } = req.body;
      if (!Array.isArray(services)) {
        return res.status(400).json({ error: "Services must be an array" });
      }
      
      // Get the salon first
      const salon = await storage.getSalon(id);
      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }
      
      // Update the salon with the new services
      const updatedSalon = await storage.updateSalonServices(id, services);
      
      res.json(updatedSalon);
    } catch (error) {
      console.error('Error updating salon services:', error);
      res.status(500).json({ error: "Failed to update salon services" });
    }
  });
  
  // Update salon promos
  apiRouter.post("/salons/:id/promos", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Get the promos array from request body
      const { promos } = req.body;
      if (!Array.isArray(promos)) {
        return res.status(400).json({ error: "Promos must be an array" });
      }
      
      // Get the salon first
      const salon = await storage.getSalon(id);
      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }
      
      // Update the salon with the new promos
      const updatedSalon = await storage.updateSalonPromos(id, promos);
      
      res.json(updatedSalon);
    } catch (error) {
      console.error('Error updating salon promos:', error);
      res.status(500).json({ error: "Failed to update salon promos" });
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

  // Bulk import routes
  apiRouter.post("/import/salons", async (req: Request, res: Response) => {
    try {
      console.log('Bulk import salons request received');
      
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be an array of salon objects" });
      }
      
      const importedSalons = await importSalons(req.body);
      console.log(`Successfully imported ${importedSalons.length} salons`);
      
      res.status(201).json({ 
        message: `Successfully imported ${importedSalons.length} salons`,
        salons: importedSalons
      });
    } catch (error) {
      console.error('Error importing salons:', error);
      res.status(500).json({ error: "Failed to import salons", details: String(error) });
    }
  });
  
  // Endpoint for handling service images
  apiRouter.post("/images/service", async (req: Request, res: Response) => {
    try {
      // This endpoint accepts base64 encoded images from the frontend
      const { imageData, serviceId, salonId } = req.body;
      
      if (!imageData || !serviceId || !salonId) {
        return res.status(400).json({ error: "Missing required data" });
      }
      
      // In a real implementation, we would:
      // 1. Decode the base64 image
      // 2. Save it to a file or cloud storage (S3, etc.)
      // 3. Store the URL in the database
      
      // For now, we'll just acknowledge receipt of the image
      console.log(`Received image for service ${serviceId} in salon ${salonId}`);
      
      // Return a real image URL for testing purposes
      // In a production application, we would store the actual uploaded image
      // and return its URL. For now, we'll use placeholder images 
      const imageUrl = `https://picsum.photos/400/300?random=${serviceId}_${Date.now()}`;
      
      res.json({ 
        success: true, 
        message: "Image processed successfully",
        imageUrl
      });
    } catch (error) {
      console.error('Error processing image:', error);
      res.status(500).json({ error: "Failed to process image" });
    }
  });

  // Endpoint to ensure a Tiffany salon exists (for demonstration purposes)
  apiRouter.post("/seed/tiffany-salon", async (req: Request, res: Response) => {
    try {
      // Check if a Tiffany salon already exists
      const allSalons = await storage.getAllSalons();
      const tiffanySalon = allSalons.find(
        salon => salon.name.toLowerCase().includes('tiffany') || 
                salon.ownerName.toLowerCase().includes('tiffany')
      );
      
      if (tiffanySalon) {
        return res.json({ 
          message: "Tiffany's salon already exists", 
          salon: tiffanySalon 
        });
      }
      
      // Create a new Tiffany salon
      const newTiffanySalon = await storage.createSalon({
        name: "Tiffany's 5280 Nails Studio",
        ownerName: "Tiffany Nguyen",
        phone: "(720) 555-5280",
        email: "tiffany@5280nails.com",
        type: "salon",
        socialMedia: [
          { platform: "Instagram", handle: "@tiffany5280nails" },
          { platform: "Facebook", handle: "Tiffany5280Nails" }
        ],
        address: "1234 Cherry Creek Mall Dr",
        city: "Denver",
        state: "CO",
        zipCode: "80246"
      });
      
      return res.status(201).json({ 
        message: "Created new Tiffany salon", 
        salon: newTiffanySalon 
      });
    } catch (error) {
      console.error('Error creating Tiffany salon:', error);
      res.status(500).json({ error: "Failed to create Tiffany salon", details: String(error) });
    }
  });

  apiRouter.post("/import/clients", async (req: Request, res: Response) => {
    try {
      console.log('Bulk import clients request received');
      
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be an array of client objects" });
      }
      
      const importedClients = await importClients(req.body);
      console.log(`Successfully imported ${importedClients.length} clients`);
      
      res.status(201).json({ 
        message: `Successfully imported ${importedClients.length} clients`,
        clients: importedClients
      });
    } catch (error) {
      console.error('Error importing clients:', error);
      res.status(500).json({ error: "Failed to import clients", details: String(error) });
    }
  });

  // Register API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}
