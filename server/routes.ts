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

const invitationInputSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  notes: z.string().optional(),
  favoriteServices: z.array(z.string()).optional(),
  salonId: z.number().optional(),
  salonName: z.string().optional(),
  sponsor: z.string().optional(), // Add sponsor field
  inviteHash: z.string().optional(), // Unique hash identifier
  firstServiceDate: z.string().optional(), // Add firstServiceDate field
  status: z.string().optional()
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
      console.log('GET /salons - Attempting to fetch all salons');
      const salons = await storage.getAllSalons();
      console.log(`GET /salons - Successfully retrieved ${salons.length} salons`);
      res.json(salons);
    } catch (error) {
      console.error('GET /salons - Error:', error);
      res.status(500).json({ error: 'Failed to fetch salons' });
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

      // Debug data in salon
      console.log(`DEBUG - GET salon/${id} - Retrieved salon:`, salon.name);

      // Debug services data in salon
      if (salon.services && Array.isArray(salon.services)) {
        console.log(`DEBUG - GET salon/${id} - Salon has ${salon.services.length} services`);
        salon.services.forEach((service: any, idx: number) => {
          console.log(`DEBUG - Service ${idx} (${service.name}) has gifUrl:`, service.gifUrl);
        });
      } else {
        console.log(`DEBUG - GET salon/${id} - Salon has no services array`);
      }

      // Only use standard promos if salon doesn't have any custom promos
      if (!salon.promos || !Array.isArray(salon.promos) || salon.promos.length === 0) {
        const standardPromos = [
          {
            id: 1,
            title: "Summer Special",
            description: "20% off all manicures",
            endDate: "2025-07-31"
          },
          {
            id: 2,
            title: "New Client Offer",
            description: "Free nail art with any service",
            endDate: null
          },
          {
            id: 3,
            title: "Bring a Friend",
            description: "25% off for you and a friend",
            endDate: "2025-08-15"
          }
        ];

        console.log(`DEBUG - GET salon/${id} - Using standard promotions (salon had none)`);
        salon.promos = standardPromos;
      } else {
        console.log(`DEBUG - GET salon/${id} - Using salon's custom promotions`);
      }

      console.log(`DEBUG - GET salon/${id} - Current promos:`, JSON.stringify(salon.promos));
      // Ensure we have an array before accessing length property
      if (Array.isArray(salon.promos)) {
        console.log(`DEBUG - GET salon/${id} - Salon has ${salon.promos.length} promotions:`, JSON.stringify(salon.promos));
      } else {
        console.log(`DEBUG - GET salon/${id} - Salon has 0 promotions (promos property is not an array)`);
      }

      res.json(salon);
    } catch (error) {
      console.error('Error retrieving salon:', error);
      res.status(500).json({ error: "Failed to retrieve salon" });
    }
  });
  
  // Update salon general information (including owner photo)
  apiRouter.put("/salons/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Get the salon to update
      const salon = await storage.getSalon(id);
      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }

      console.log(`DEBUG - PUT salon/${id} - Updating salon`, req.body);
      
      // Update the salon with the provided data
      const updatedSalon = await storage.updateSalon(id, req.body);
      console.log(`DEBUG - PUT salon/${id} - Salon updated successfully`);
      
      res.json(updatedSalon);
    } catch (error) {
      console.error('Error updating salon:', error);
      res.status(500).json({ error: "Failed to update salon" });
    }
  });
  
  // PATCH handler for salon updates (needed for tests)
  apiRouter.patch("/salons/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Get the salon to update
      const salon = await storage.getSalon(id);
      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }

      console.log(`DEBUG - PATCH salon/${id} - Updating salon`, req.body);
      
      // Update the salon with the provided data
      const updatedSalon = await storage.updateSalon(id, req.body);
      console.log(`DEBUG - PATCH salon/${id} - Salon updated successfully`);
      
      res.json(updatedSalon);
    } catch (error) {
      console.error('Error updating salon:', error);
      res.status(500).json({ error: "Failed to update salon" });
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
      console.log(`DEBUG - POST /salons/${id}/promos - Starting update request`);

      if (isNaN(id)) {
        console.log(`DEBUG - POST /salons/${id}/promos - Invalid ID format`);
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Get the promos array from request body
      const { promos } = req.body;
      console.log(`DEBUG - POST /salons/${id}/promos - Received promos:`, JSON.stringify(promos));

      // Validate promos array
      if (!Array.isArray(promos)) {
        console.log(`DEBUG - POST /salons/${id}/promos - Error: Promos is not an array`, typeof promos);
        return res.status(400).json({ error: "Promos must be an array" });
      }

      // Validate each promo object
      const validatedPromos = promos.map(promo => ({
        id: promo.id,
        title: promo.title,
        description: promo.description,
        endDate: promo.endDate || null
      }));

      // Get the salon first
      console.log(`DEBUG - POST /salons/${id}/promos - Retrieving salon`);
      const salon = await storage.getSalon(id);

      if (!salon) {
        console.log(`DEBUG - POST /salons/${id}/promos - Salon not found`);
        return res.status(404).json({ error: "Salon not found" });
      }

      console.log(`DEBUG - POST /salons/${id}/promos - Found salon:`, salon.name);
      if (salon.promos) {
        console.log(`DEBUG - POST /salons/${id}/promos - Current promos:`, JSON.stringify(salon.promos));
      } else {
        console.log(`DEBUG - POST /salons/${id}/promos - No existing promos`);
      }

      // Update the salon with the new promos
      console.log(`DEBUG - POST /salons/${id}/promos - Updating promos in database`);
      const updatedSalon = await storage.updateSalonPromos(id, validatedPromos); // Use validatedPromos here

      console.log(`DEBUG - POST /salons/${id}/promos - Update successful, returning updated salon`);
      if (updatedSalon.promos) {
        console.log(`DEBUG - POST /salons/${id}/promos - New promos:`, JSON.stringify(updatedSalon.promos));
      } else {
        console.log(`DEBUG - POST /salons/${id}/promos - Warning: Updated salon has no promos`);
      }

      res.json(updatedSalon);
    } catch (error) {
      console.error('Error updating salon promos:', error);
      res.status(500).json({ error: "Failed to update salon promos" });
    }
  });

  // Update salon schedule
  apiRouter.post("/salons/:id/schedule", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`DEBUG - POST /salons/${id}/schedule - Starting update request`);

      if (isNaN(id)) {
        console.log(`DEBUG - POST /salons/${id}/schedule - Invalid ID format`);
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Get the schedule array from request body
      const { schedule } = req.body;
      console.log(`DEBUG - POST /salons/${id}/schedule - Received schedule:`, JSON.stringify(schedule));

      // Validate schedule array
      if (!Array.isArray(schedule)) {
        console.log(`DEBUG - POST /salons/${id}/schedule - Error: Schedule is not an array`, typeof schedule);
        return res.status(400).json({ error: "Schedule must be an array" });
      }

      // Get the salon first
      const salon = await storage.getSalon(id);
      if (!salon) {
        console.log(`DEBUG - POST /salons/${id}/schedule - Salon not found with ID ${id}`);
        return res.status(404).json({ error: "Salon not found" });
      }

      // Update the salon with the schedule
      console.log(`DEBUG - POST /salons/${id}/schedule - Updating schedule in database`);
      
      // Use updateSalon to add/update the schedule field
      const updatedSalon = await storage.updateSalon(id, { schedule });

      console.log(`DEBUG - POST /salons/${id}/schedule - Update successful, returning updated salon`);
      
      res.json(updatedSalon);
    } catch (error) {
      console.error('Error updating salon schedule:', error);
      res.status(500).json({ error: "Failed to update salon schedule" });
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
  
  // Client update endpoint
  apiRouter.put("/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.error('Invalid client ID format for update:', req.params.id);
        return res.status(400).json({ error: "Invalid ID format" });
      }

      console.log('Updating client with ID:', id);
      console.log('Update data:', req.body);
      
      // First, check if the client exists
      const client = await storage.getClient(id);
      if (!client) {
        console.error('Client not found for update with ID:', id);
        return res.status(404).json({ error: "Client not found" });
      }

      // Update client info by merging the existing data with the new data
      const updatedData = { ...client, ...req.body };
      
      // Make sure we don't accidentally change these fields
      updatedData.id = id;
      updatedData.type = 'client';
      
      // Validate social media array if present
      if (updatedData.socialMedia && !Array.isArray(updatedData.socialMedia)) {
        updatedData.socialMedia = [];
      }
      
      // Update the client
      console.log('Saving updated client data:', updatedData);
      
      // Assuming storage.updateClient is implemented
      const result = await storage.updateClient(id, updatedData);
      console.log('Client updated successfully:', { id: result.id, name: result.name });
      
      res.json(result);
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({ error: "Failed to update client" });
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

  // Data migration endpoint for fixing stored image URLs - used by both API and direct HTML page
  app.post("/api/migrate/service-images", async (req: Request, res: Response) => {
    try {
      console.log('Starting migration of service images to local assets');

      // Get all salons
      const allSalons = await storage.getAllSalons();
      let totalUpdated = 0;

      // Process each salon
      for (const salon of allSalons) {
        if (!salon.services || !Array.isArray(salon.services) || salon.services.length === 0) {
          console.log(`Salon ${salon.id} has no services, skipping`);
          continue;
        }

        console.log(`Processing salon ${salon.id} (${salon.name}) with ${salon.services.length} services`);

        // Update each service to use a local asset
        const updatedServices = salon.services.map(service => {
          // Skip if already a local asset
          if (service.gifUrl && (
              service.gifUrl.startsWith('/assets/') || 
              service.gifUrl.startsWith('/uploads/'))) {
            return service;
          }

          // Create a local URL based on service name
          let localUrl;
          if (service.name.toLowerCase().includes('french') || 
              service.name.toLowerCase().includes('tips')) {
            localUrl = '/assets/french-tips.png';
          } else if (service.name.toLowerCase().includes('gel') || 
                     service.name.toLowerCase().includes('manicure') || 
                     service.name.toLowerCase().includes('lux')) {
            localUrl = '/assets/gel-manicure.png';
          } else if (service.name.toLowerCase().includes('acrylic') || 
                    service.name.toLowerCase().includes('sculpt')) {
            localUrl = '/assets/sculpted-acrylics.png';
          } else if (service.name.toLowerCase().includes('custom') || 
                    service.name.toLowerCase().includes('design') || 
                    service.name.toLowerCase().includes('glam')) {
            localUrl = '/assets/glam-design.png';
          } else {
            localUrl = '/assets/salon-card.png';
          }

          console.log(`Migrating service ${service.id} (${service.name}) image from ${service.gifUrl} to ${localUrl}`);
          totalUpdated++;

          return {
            ...service,
            gifUrl: localUrl
          };
        });

        // Save the updated services
        await storage.updateSalonServices(salon.id, updatedServices);
        console.log(`Updated ${updatedServices.length} services for salon ${salon.id}`);
      }

      res.json({ 
        success: true, 
        message: `Successfully migrated ${totalUpdated} service images to local assets` 
      });
    } catch (error) {
      console.error('Error migrating service images:', error);
      res.status(500).json({ error: "Failed to migrate service images", details: String(error) });
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

  // Endpoint to ensure a Ven Me, Baby! LTD salon exists
  apiRouter.post("/seed/ven-me-ltd", async (req: Request, res: Response) => {
    try {
      // Check if the Ven Me salon already exists
      const allSalons = await storage.getAllSalons();
      const venMeSalon = allSalons.find(
        (salon: any) => salon.name.toLowerCase().includes('ven me') || 
                  salon.name.toLowerCase().includes('vmb')
      );

      if (venMeSalon) {
        return res.json({ 
          message: "Ven Me, Baby! LTD salon already exists", 
          salon: venMeSalon 
        });
      }

      // Create a new Ven Me, Baby! LTD salon
      const newVenMeSalon = await storage.createSalon({
        name: "Ven Me, Baby! LTD",
        ownerName: "Admin",
        phone: "(303) 555-9000",
        email: "contact@venmebaby.com",
        type: "salon",
        socialMedia: [
          { platform: "Instagram", handle: "@venmebaby" },
          { platform: "Website", handle: "https://venmebaby.com" }
        ],
        address: "500 16th Street Mall",
        city: "Denver",
        state: "CO",
        zipCode: "80202"
      });

      // Add default services to the salon
      const services = [
        {
          id: 1,
          name: "French Tips / Touch-Up",
          description: "Classic white-tipped manicure or touch-up service",
          price: 40,
          duration: 30,
          featured: true,
          gifUrl: "/assets/french_tips.jpg"
        },
        {
          id: 2,
          name: "Luxe Gel Manicure",
          description: "Premium gel polish with extended wear and shine",
          price: 55,
          duration: 45,
          featured: true,
          gifUrl: "/assets/Luxe_Gel_Manicure_1744299210155.png"
        },
        {
          id: 3,
          name: "Sculpted Acrylics",
          description: "Beautiful, durable acrylic nails expertly applied",
          price: 70,
          duration: 60,
          featured: false,
          gifUrl: "/assets/Sculpted_Acrylics_1744299183531.png"
        },
        {
          id: 4,
          name: "Glam Me! Custom Design",
          description: "Artistic custom nail designs for any occasion",
          price: 125,
          duration: 90,
          featured: true,
          gifUrl: "/assets/Glam_Me!_Custom_Design_1744299155324.png"
        }
      ];

      // Add default promotions
      const promos = [
        {
          id: 1,
          title: "Welcome to Ven Me, Baby!",
          description: "New clients receive 20% off their first visit!",
          endDate: null
        },
        {
          id: 2,
          title: "Summer Special Package",
          description: "Book our summer package and get a complementary toe polish!",
          endDate: "2025-08-31"
        }
      ];

      // Update the salon with services and promos
      await storage.updateSalonServices(newVenMeSalon.id, services);
      await storage.updateSalonPromos(newVenMeSalon.id, promos);

      return res.status(201).json({ 
        message: "Created Ven Me, Baby! LTD salon with services and promos", 
        salon: newVenMeSalon 
      });
    } catch (error) {
      console.error('Error creating Ven Me, Baby! LTD salon:', error);
      res.status(500).json({ error: "Failed to create Ven Me, Baby! LTD salon", details: String(error) });
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

  // Invitation routes
  apiRouter.post("/invitations", async (req: Request, res: Response) => {
    try {
      console.log('Creating new invitation with data:', req.body);
      
      // Extract the validation flag if present
      const isValidationOnly = req.body._validateOnly === true;
      if (isValidationOnly) {
        // For validation-only requests, we only need to check if phone/email already exists
        // We'll do a simplified check
        try {
          const { phone, email } = req.body;
          
          // Check for duplicate phone/email
          if (phone && phone.length === 10) {
            const phoneExists = await storage.isDuplicateContact(phone, '');
            if (phoneExists.isDuplicate) {
              return res.status(400).json({ error: 'This phone is already registered' });
            }
          }
          
          if (email && email.includes('@')) {
            // Ensure case-insensitive validation for email
            const lowercaseEmail = email.toLowerCase();
            const emailExists = await storage.isDuplicateContact('', lowercaseEmail);
            if (emailExists.isDuplicate) {
              return res.status(400).json({ error: 'This email is already registered' });
            }
          }
          
          // If we got here, validation passed
          return res.status(200).json({ valid: true });
        } catch (error) {
          console.error('Validation error:', error);
          return res.status(500).json({ error: 'Validation failed' });
        }
      }
      
      // For regular requests, proceed as normal
      // Validate input data
      const validatedData = invitationInputSchema.parse(req.body);
      
      // Generate a unique hash for this invitation if not provided
      if (!validatedData.inviteHash) {
        // Import the generateInviteHash function from client utils
        const { generateInviteHash } = await import('../client/src/lib/utils');
        validatedData.inviteHash = generateInviteHash();
        console.log(`Generated unique invitation hash: ${validatedData.inviteHash}`);
      }
      
      console.log('Validated invitation data:', validatedData);
      
      // Create the invitation in database
      const invitation = await storage.createInvitation(validatedData);
      console.log('Created invitation with ID:', invitation.id, 'Hash:', invitation.inviteHash);
      
      // Log activity with the invitation hash
      if (invitation.inviteHash) {
        await storage.createActivityLog({
          type: "invitation_created",
          description: `Invitation #${invitation.inviteHash} created for ${invitation.name}`,
          salonId: Number(invitation.salonId),
          timestamp: new Date()
        });
      }
      
      // Return the invitation data
      res.status(201).json(invitation);
    } catch (error) {
      console.error('Error creating invitation:', error);
      
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create invitation" });
      }
    }
  });
  
  apiRouter.get("/invitations", async (req: Request, res: Response) => {
    try {
      // Get limit from query params, default to 10
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const invitations = await storage.getRecentInvitations(limit);
      console.log(`Retrieved ${invitations.length} recent invitations`);
      
      res.json(invitations);
    } catch (error) {
      console.error('Error retrieving invitations:', error);
      res.status(500).json({ error: "Failed to retrieve invitations" });
    }
  });
  
  apiRouter.get("/invitations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const invitation = await storage.getInvitation(id);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      res.json(invitation);
    } catch (error) {
      console.error('Error retrieving invitation:', error);
      res.status(500).json({ error: "Failed to retrieve invitation" });
    }
  });
  
  // TEMPORARY DEVELOPMENT ENDPOINT: Validate promo code for testing
  apiRouter.post("/invitations/validate", async (req: Request, res: Response) => {
    try {
      console.log('Validating promo code with data:', req.body);
      const { code, phone } = req.body;
      
      if (!code || !phone) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Extract the last 4 digits from the phone number
      const cleanPhone = phone.replace(/\D/g, '');
      const last4Digits = cleanPhone.slice(-4);
      
      // TEMPORARY DEVELOPMENT BYPASS:
      // For simplicity, if the entered code matches the last 4 digits of the phone number,
      // consider it valid for testing purposes
      if (code === last4Digits) {
        // Record this temporary bypass in logs for development tracking
        console.log(`DEVELOPMENT BYPASS: Validated code using last 4 digits for phone ${phone}`);
        
        // In a real implementation, we would fetch the client details
        // For now, return success to allow the temporary flow
        return res.status(200).json({ 
          success: true,
          message: "Development bypass active - last 4 digits match",
          clientId: 1 // Mock client ID for development
        });
      }
      
      return res.status(400).json({ error: "Invalid promo code. For testing, use the last 4 digits of the phone number." });
    } catch (error) {
      console.error('Error validating promo code:', error);
      res.status(500).json({ error: "Failed to validate promo code" });
    }
  });
  
  apiRouter.get("/salons/:id/invitations", async (req: Request, res: Response) => {
    try {
      const salonId = parseInt(req.params.id);
      if (isNaN(salonId)) {
        return res.status(400).json({ error: "Invalid salon ID format" });
      }
      
      // Verify that salon exists
      const salon = await storage.getSalon(salonId);
      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }
      
      const invitations = await storage.getSalonInvitations(salonId);
      console.log(`Retrieved ${invitations.length} invitations for salon ${salonId}`);
      
      res.json(invitations);
    } catch (error) {
      console.error('Error retrieving salon invitations:', error);
      res.status(500).json({ error: "Failed to retrieve salon invitations" });
    }
  });

  // Style Selection Endpoints
  apiRouter.post("/clients/:clientId/style-selections", async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const { styleId, salonId, invitationId } = req.body;
      
      console.log(`Recording style selection: client=${clientId}, style=${styleId}, salon=${salonId}, invitation=${invitationId || 'none'}`);
      
      // Validate required fields
      if (!styleId || !salonId) {
        return res.status(400).json({ error: "styleId and salonId are required" });
      }
      
      // Create style selection
      const styleSelection = await storage.createStyleSelection({
        clientId: Number(clientId),
        styleId: Number(styleId),
        salonId: Number(salonId),
        selectedAt: new Date(),
        status: "selected"
      });
      
      // Log the activity
      await storage.createActivityLog({
        type: "style_selection",
        description: `Client ${clientId} selected style ${styleId} from salon ${salonId}`,
        clientId: Number(clientId),
        salonId: Number(salonId),
        timestamp: new Date()
      });
      
      // Update invitation status if applicable
      if (invitationId) {
        // Get the invitation to access its hash
        const invitation = await storage.getInvitation(Number(invitationId));
        
        if (invitation) {
          // Update the invitation status
          await storage.updateInvitationStatus(Number(invitationId), "style_selected");
          console.log(`Updated invitation ${invitationId} status to style_selected`);
          
          // Log activity with the hash if available
          const hashPrefix = invitation.inviteHash ? `#${invitation.inviteHash} - ` : '';
          await storage.createActivityLog({
            type: "style_selection_invitation",
            description: `${hashPrefix}Client ${clientId} selected style ${styleId} from invitation ${invitationId}`,
            clientId: Number(clientId),
            salonId: Number(salonId),
            timestamp: new Date()
          });
        } else {
          console.warn(`Invitation ${invitationId} not found when trying to update status`);
        }
      }
      
      res.status(201).json(styleSelection);
    } catch (error) {
      console.error("Error creating style selection:", error);
      res.status(500).json({ error: "Failed to create style selection" });
    }
  });
  
  apiRouter.get("/clients/:clientId/style-selections", async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      
      if (isNaN(Number(clientId))) {
        return res.status(400).json({ error: "Invalid client ID" });
      }
      
      const styleSelections = await storage.getClientStyleSelections(Number(clientId));
      res.status(200).json(styleSelections);
    } catch (error) {
      console.error("Error fetching client style selections:", error);
      res.status(500).json({ error: "Failed to fetch client style selections" });
    }
  });
  
  apiRouter.get("/salons/:salonId/style-selections", async (req: Request, res: Response) => {
    try {
      const { salonId } = req.params;
      
      if (isNaN(Number(salonId))) {
        return res.status(400).json({ error: "Invalid salon ID" });
      }
      
      const styleSelections = await storage.getSalonStyleSelections(Number(salonId));
      res.status(200).json(styleSelections);
    } catch (error) {
      console.error("Error fetching salon style selections:", error);
      res.status(500).json({ error: "Failed to fetch salon style selections" });
    }
  });
  
  // Activity Log Endpoints
  apiRouter.post("/activity-logs", async (req: Request, res: Response) => {
    try {
      const { type, description, userId, salonId, clientId } = req.body;
      
      // Validate required fields
      if (!type || !description) {
        return res.status(400).json({ error: "type and description are required" });
      }
      
      // Create activity log
      const activityLog = await storage.createActivityLog({
        type,
        description,
        userId: userId ? Number(userId) : undefined,
        salonId: salonId ? Number(salonId) : undefined,
        clientId: clientId ? Number(clientId) : undefined,
        timestamp: new Date()
      });
      
      res.status(201).json(activityLog);
    } catch (error) {
      console.error("Error creating activity log:", error);
      res.status(500).json({ error: "Failed to create activity log" });
    }
  });
  
  apiRouter.get("/activity-logs", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const activityLogs = await storage.getRecentActivityLogs(limit);
      res.status(200).json(activityLogs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Register API routes
  app.use("/api", apiRouter);

  const httpServer = createServer(app);
  return httpServer;
}