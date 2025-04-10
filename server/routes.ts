import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { importSalons, importClients } from "./utils/importData";
import multer from "multer";
import path from "path";
import fs from "fs";

// Set up multer for file uploads
const uploadDir = path.join(process.cwd(), 'client/public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, uploadDir);
  },
  filename: function (req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    // Create a unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: multerStorage });

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
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'client/public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory:', uploadDir);
  }

  // API endpoints prefix
  const apiRouter = express.Router();
  
  // File upload endpoint for service images
  apiRouter.post("/upload", upload.single('file'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // File was uploaded successfully, return the path that can be accessed publicly
      const relativePath = `/uploads/${req.file.filename}`;
      console.log(`Uploaded file saved to ${req.file.path} (public URL: ${relativePath})`);
      
      return res.json({ 
        url: relativePath,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });
  
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
      
      // Debug services data in salon
      console.log(`DEBUG - GET salon/${id} - Retrieved salon:`, salon.name);
      if (salon.services && Array.isArray(salon.services)) {
        console.log(`DEBUG - GET salon/${id} - Salon has ${salon.services.length} services`);
        salon.services.forEach((service: any, idx: number) => {
          console.log(`DEBUG - Service ${idx} (${service.name}) has gifUrl:`, service.gifUrl);
        });
      } else {
        console.log(`DEBUG - GET salon/${id} - Salon has no services array`);
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
      
      // Debug logs for Windows paths in services
      console.log('DEBUG - Processing services before save:');
      services.forEach((service, index) => {
        if (service.gifUrl && (service.gifUrl.includes(':\\') || service.gifUrl.includes('C:'))) {
          console.log(`DEBUG - Service ${index} has Windows path:`, service.gifUrl);
          
          // Extract the filename from the Windows path for logging
          const filename = service.gifUrl.split('\\').pop() || '';
          console.log(`DEBUG - Extracted filename: "${filename}"`);
          
          // Don't modify the path - we'll handle it in the frontend
        }
      });
      
      // Get the salon first
      const salon = await storage.getSalon(id);
      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }
      
      // Update the salon with the new services
      const updatedSalon = await storage.updateSalonServices(id, services);
      
      // Log what's being sent back to client
      console.log('DEBUG - Updated salon services - sending back to client');
      
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
  
  // (Removed unused service image endpoint)

  // Endpoint to ensure a Tiffany salon exists (for demonstration purposes)
  apiRouter.post("/seed/tiffany-salon", async (req: Request, res: Response) => {
    try {
      // Check if a Tiffany salon already exists
      const allSalons = await storage.getAllSalons();
      const tiffanySalon = allSalons.find(
        (salon: any) => salon.name.toLowerCase().includes('tiffany') || 
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
