import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { importSalons, importClients } from "./utils/importData";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { clients, invitations, type Invitation } from "../shared/schema";
import { eq } from "drizzle-orm";
import { registerVisualizationRoutes } from "./visualization";
import { registerMadgeRoutes } from "./madge-api";
import { errorMonitor } from './error-monitor';
import licenseRoutes from './routes/license';

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
  email: z.string().email().optional().or(z.literal('')),
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
  email: z.union([
    z.string().email(),
    z.string().length(0),  // Allow empty string
    z.null()  // Also allow null
  ]).optional(),
  message: z.string().optional(), // Optional message for client-to-client invitations
  notes: z.string().optional(),
  favoriteServices: z.array(z.string()).optional(),
  salonId: z.number().optional(),
  salonName: z.string().optional(),
  sponsor: z.string().optional(), // Add sponsor field
  inviteHash: z.string().optional(), // Unique hash identifier
  firstServiceDate: z.string().optional(), // Add firstServiceDate field
  status: z.string().optional(),
  senderId: z.number().optional(), // Add senderId for client-to-client invitations
  type: z.string().optional() // Type of invitation (e.g., "client_invitation")
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'client/public/uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // API endpoints prefix
  const apiRouter = express.Router();
  
  // Health check endpoint
  apiRouter.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Status endpoint
  apiRouter.get("/status", (req: Request, res: Response) => {
    res.json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
  });

  // Error logging endpoint for monitoring
  apiRouter.post("/log-error", (req: Request, res: Response) => {
    try {
      const { type, message, stack, timestamp } = req.body;
      
      console.error(`[CLIENT ERROR] ${type} - ${message}`);
      if (stack) {
        console.error(stack);
      }
      
      // Store in error monitor
      errorMonitor.logError(type, { message, stack } as Error);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error logging client error:', error);
      res.status(500).json({ success: false });
    }
  });

  // File upload endpoint for service images
  apiRouter.post("/upload", upload.single('file'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // File was uploaded successfully, return the path that can be accessed publicly
      const relativePath = `/uploads/${req.file.filename}`;

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
      console.error('Error fetching salons:', error);
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

        salon.promos = standardPromos;
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
      
      // Update the salon with the provided data
      const updatedSalon = await storage.updateSalon(id, req.body);
      
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
      
      // Update the salon with the provided data
      const updatedSalon = await storage.updateSalon(id, req.body);
      
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

      // Validate promos array
      if (!Array.isArray(promos)) {
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
      const salon = await storage.getSalon(id);
      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }

      // Update the salon with the new promos
      const updatedSalon = await storage.updateSalonPromos(id, validatedPromos);

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
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Get the schedule array from request body
      const { schedule } = req.body;

      // Validate schedule array
      if (!Array.isArray(schedule)) {
        return res.status(400).json({ error: "Schedule must be an array" });
      }

      // Get the salon first
      const salon = await storage.getSalon(id);
      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }

      // Use updateSalon to add/update the schedule field
      const updatedSalon = await storage.updateSalon(id, { schedule });
      
      res.json(updatedSalon);
    } catch (error) {
      console.error('Error updating salon schedule:', error);
      res.status(500).json({ error: "Failed to update salon schedule" });
    }
  });

  // Contact validation endpoint - handles both email and phone validation
  apiRouter.post("/validate-contact", async (req: Request, res: Response) => {
    try {
      const { phone, email, type, senderId, context } = req.body;
      
      if (!phone && !email) {
        return res.status(400).json({
          exists: false,
          error: "At least one contact method (phone or email) must be provided"
        });
      }
      
      // If senderId is provided and context is 'invitation', use the context-aware validation
      if (senderId && context === 'invitation') {
        // Use the enhanced context-aware validation for invitations
        const validation = await storage.validateInvitation(
          phone || '',
          email || '',
          Number(senderId)
        );
        
        if (!validation.isValid) {
          return res.json({
            exists: true,
            field: phone ? 'phone' : 'email',
            message: validation.message
          });
        }
        
        return res.json({
          exists: false,
          field: ''
        });
      }
      
      // For all other cases, use the standard duplicate check
      const result = await storage.isDuplicateContact(
        phone || "", 
        email || ""
      );
      
      return res.json({
        exists: result.isDuplicate,
        field: result.field
      });
    } catch (error) {
      console.error("Error validating contact:", error);
      return res.status(500).json({
        exists: false,
        error: "Server error during validation"
      });
    }
  });

  // Client routes
  apiRouter.post("/clients", async (req: Request, res: Response) => {
    try {
      // Validate and parse client input data
      const validatedData = clientInputSchema.parse(req.body);

      try {
        // Check for existing client first
        if (validatedData.phone || validatedData.email) {
          try {
            // First directly check if a client already exists with this phone
            let existingClient = null;
            const allClients = await storage.getAllClients();
            
            if (validatedData.phone) {
              // Standardize phone format for comparison
              const cleanPhone = validatedData.phone.replace(/\D/g, '');
              
              existingClient = allClients.find(c => 
                c.phone && c.phone.replace(/\D/g, '') === cleanPhone
              );
            } else if (validatedData.email && validatedData.email.trim()) {
              const lowercaseEmail = validatedData.email.toLowerCase();
              existingClient = allClients.find(c => 
                c.email && c.email.toLowerCase() === lowercaseEmail
              );
            }

            if (existingClient) {
              // Return the existing client data with a 200 status (not an error)
              return res.status(200).json({
                ...existingClient,
                message: 'Existing client found with this contact information',
                matchFound: true
              });
            }
            
            // Use our context-aware validation specifically for registration
            const validationResult = await storage.validateRegistration(
              validatedData.phone || "", 
              validatedData.email || ""
            );
            
            if (!validationResult.isValid) {
              // Return a more user-friendly response with form pre-fill data
              return res.status(409).json({ 
                status: 'duplicate',
                message: validationResult.message || 'This contact information is already registered',
                // Return submitted data to pre-fill the registration form
                name: validatedData.name,
                phone: validatedData.phone,
                email: validatedData.email,
                salonId: validatedData.salonId
              });
            }
          } catch (error) {
            console.error('Error checking for duplicates:', error);
            // Continue to client creation if error in duplicate check
          }
        }
        
        // Handle sponsor logic before creating client
        // Default sponsor if none is provided
        let sponsorName = req.body.sponsor || "Ven Me, Baby! LTD";
        let sponsorSalonId = null;

        // 1. If salonId is provided, use that salon as sponsor
        if (validatedData.salonId) {
          // Get the selected salon to use as sponsor
          const sponsorSalon = await storage.getSalon(validatedData.salonId);
          if (sponsorSalon) {
            sponsorName = sponsorSalon.name;
            sponsorSalonId = sponsorSalon.id;
          }
        } 
        // 2. Default is Ven Me, Baby! LTD (ID: 12) if no salon selected
        else if (sponsorName === "Ven Me, Baby! LTD") {
          sponsorSalonId = 12; // VMB Ltd ID
        }

        // Add sponsor info to validatedData
        const clientData = {
          ...validatedData,
          sponsor: sponsorName,
          sponsorSalonId: sponsorSalonId
        };

        // Create client with sponsor information
        const client = await storage.createClient(clientData);
        
        // Check if this client was created from an invitation by checking invitationId in the request
        if (req.body.invitationId) {
          const invitationId = parseInt(req.body.invitationId);
          if (!isNaN(invitationId)) {
            try {
              // Update invitation status to completed
              await storage.updateInvitationStatus(invitationId, 'completed');
            } catch (invitationError) {
              // Log error but don't fail the client creation
              console.error(`Failed to update invitation ${invitationId} status:`, invitationError);
            }
          }
        }
        
        // Also check if there are any invitations with matching phone number
        if (validatedData.phone) {
          try {
            const matchingInvitations = await storage.getInvitationsByPhone(validatedData.phone);
            
            if (matchingInvitations.length > 0) {
              // Update all matching invitations to completed
              for (const invitation of matchingInvitations) {
                if (invitation.status !== 'completed') {
                  await storage.updateInvitationStatus(invitation.id, 'completed');
                }
              }
            }
          } catch (invitationError) {
            // Log error but don't fail the client creation
            console.error('Failed to update matching invitations:', invitationError);
          }
        }

        // Return the client data
        res.status(201).json(client);
      } catch (storageError) {
        console.error('Error in storage layer:', storageError);
        
        // Check if it's a duplicate error
        if (storageError instanceof Error && 
            storageError.message && 
            (storageError.message.includes('already registered') || 
             storageError.message.includes('duplicate'))) {
          
          // Enhanced error object from storage layer
          if ((storageError as any).client && (storageError as any).status === 'duplicate') {
            // Return the existing client data with a 200 status (not an error)
            return res.status(200).json({
              ...(storageError as any).client,
              message: 'Existing client found with this contact information',
              matchFound: true
            });
          }
          
          // Extract which field is duplicate (fallback for old error format)
          const errorMessage = storageError.message;
          const isDuplicatePhone = errorMessage.includes('phone');
          const isDuplicateEmail = errorMessage.includes('email');
          
          // For duplicates, we'll return a specific error status and data
          return res.status(409).json({ 
            status: 'duplicate',
            field: isDuplicatePhone ? 'phone' : (isDuplicateEmail ? 'email' : 'contact'),
            message: 'This contact information already exists. Complete your registration to continue.',
            // Return submitted data to pre-fill the registration form
            name: validatedData.name,
            phone: validatedData.phone,
            email: validatedData.email,
            salonId: validatedData.salonId
          });
        } else {
          // Other storage errors
          throw storageError;
        }
      }
    } catch (error) {
      console.error('Error creating client:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create client" });
      }
    }
  });

  apiRouter.get("/clients", async (req: Request, res: Response) => {
    try {
      // Check if we're filtering by phone
      const phoneFilter = req.query.phone as string;
      let clients = await storage.getAllClients();
      
      // Apply phone filter if provided
      if (phoneFilter) {
        // Clean the phone number for comparison
        const cleanPhoneFilter = phoneFilter.replace(/\D/g, '');
        const isPartialPhone = cleanPhoneFilter.length <= 4;
        
        // Filter clients based on phone number (full or partial)
        clients = clients.filter(client => {
          if (!client.phone) return false;
          
          const clientPhone = client.phone.replace(/\D/g, '');
          
          // If it's a short partial number (4 or fewer digits), match by last digits
          if (isPartialPhone) {
            return clientPhone.endsWith(cleanPhoneFilter);
          }
          
          // For longer numbers, require exact match
          return clientPhone === cleanPhoneFilter;
        });
      }
      
      res.json(clients);
    } catch (error) {
      console.error('Error retrieving clients:', error);
      res.status(500).json({ error: "Failed to retrieve clients" });
    }
  });

  apiRouter.get("/clients/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      const client = await storage.getClient(id);

      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

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
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // First, check if the client exists
      const client = await storage.getClient(id);
      if (!client) {
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
      const result = await storage.updateClient(id, updatedData);
      
      res.json(result);
    } catch (error) {
      console.error('Error updating client:', error);
      res.status(500).json({ error: "Failed to update client" });
    }
  });
  
  // Endpoint to update profilePromptShown status
  apiRouter.post("/clients/:id/profile-prompt-shown", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // First, check if the client exists
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      // Update only the profilePromptShown field
      const updatedData = { 
        ...client,
        profilePromptShown: true 
      };
      
      // Update the client
      const result = await storage.updateClient(id, updatedData);
      
      res.json({ success: true, message: "Profile prompt shown status updated" });
    } catch (error) {
      console.error('[FLOW] Error updating profile prompt status:', error);
      res.status(500).json({ error: "Failed to update profile prompt status" });
    }
  });

  // Bulk import routes
  apiRouter.post("/import/salons", async (req: Request, res: Response) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be an array of salon objects" });
      }

      const importedSalons = await importSalons(req.body);

      res.status(201).json({ 
        message: `Successfully imported ${importedSalons.length} salons`,
        salons: importedSalons
      });
    } catch (error) {
      console.error('Error importing salons:', error);
      res.status(500).json({ error: "Failed to import salons", details: String(error) });
    }
  });

  
  app.post("/api/migrate/service-images", async (req: Request, res: Response) => {
    try {
      // Get all salons
      const allSalons = await storage.getAllSalons();
      let totalUpdated = 0;

      // Process each salon
      for (const salon of allSalons) {
        if (!salon.services || !Array.isArray(salon.services) || salon.services.length === 0) {
          continue;
        }

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

          totalUpdated++;

          return {
            ...service,
            gifUrl: localUrl
          };
        });

        // Save the updated services
        await storage.updateSalonServices(salon.id, updatedServices);
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
        name: "Tiffany 5280 Nails Studio",
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
      if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Request body must be an array of client objects" });
      }

      const importedClients = await importClients(req.body);

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
      // Extract the validation flag if present
      const isValidationOnly = req.body._validateOnly === true;
      if (isValidationOnly) {
        // For validation-only requests, we'll do a contextual validation for invitations
        try {
          const { phone, email, senderId } = req.body;
          
          if (!senderId) {
            return res.status(400).json({ error: 'Missing sender ID for validation' });
          }
          
          // Use our new context-aware validation method for invitations
          const validation = await storage.validateInvitation(
            phone || '', 
            email || '', 
            Number(senderId)
          );
          
          if (!validation.isValid) {
            return res.status(400).json({ error: validation.message });
          }
          
          return res.status(200).json({ valid: true });
        } catch (error) {
          console.error('Validation error:', error);
          return res.status(500).json({ error: 'Validation failed' });
        }
      }
      
      // For regular requests, proceed as normal
      try {
        // Validate input data
        try {
          const validatedData = invitationInputSchema.parse(req.body);
          
          // Generate a unique hash for this invitation if not provided
          if (!validatedData.inviteHash) {
            // Import the generateInviteHash function from client utils
            const { generateInviteHash } = await import('../client/src/lib/utils');
            validatedData.inviteHash = generateInviteHash();
          }
          
          // For client-to-client invitations, we don't require salonId upfront
          // The storage.createInvitation method will handle assigning appropriate salon
          if (!validatedData.salonId && !validatedData.senderId) {
            throw new Error("Either Salon ID or Sender ID is required for invitations");
          }
          
          // Check for salon invitation limits if this is a salon-created invitation
          if (validatedData.salonId && !validatedData.senderId) {
            // This is a salon-created invitation
            console.log(`[API] POST /invitations - Checking invitation limits for salon ${validatedData.salonId}`);
            
            // Check if salon has reached its invitation limit
            const limitCheck = await storage.hasSalonReachedInvitationLimit(validatedData.salonId);
            
            if (limitCheck.hasReachedLimit) {
              console.log(`[API] POST /invitations - Salon ${validatedData.salonId} has reached invitation limit`);
              console.log(`[API] Current count: ${limitCheck.currentCount}, Limit: ${limitCheck.limit}`);
              
              return res.status(403).json({
                error: 'Invitation limit reached',
                message: 'Your salon has reached the maximum number of client invitations allowed.',
                details: 'Salon license verification is required to send more invitations.',
                currentCount: limitCheck.currentCount,
                limit: limitCheck.limit
              });
            }
            
            console.log(`[API] POST /invitations - Salon ${validatedData.salonId} has not reached invitation limit`);
            console.log(`[API] Current count: ${limitCheck.currentCount}, Limit: ${limitCheck.limit}`);
          }
          
          // Validate that the senderId (clientId) exists in the database
          if (validatedData.senderId) {
            const senderClient = await storage.getClient(validatedData.senderId);
            if (!senderClient) {
              console.log(`[API] POST /invitations - Invalid senderId: ${validatedData.senderId} - Client does not exist`);
              throw new Error("Invalid sender ID. Client does not exist in the database.");
            }
            console.log(`[API] POST /invitations - Valid senderId: ${validatedData.senderId} - Client exists: ${senderClient.name}`);
          }
          
          // Create the invitation in database
          const createdInvitation = await storage.createInvitation(validatedData);
        
          // Log activity with the invitation hash
          if (createdInvitation && createdInvitation.inviteHash) {
            try {
              await storage.createActivityLog({
                type: "invitation_created",
                description: `Invitation #${createdInvitation.inviteHash} created for ${createdInvitation.name}`,
                salonId: Number(createdInvitation.salonId) || 0,
                timestamp: new Date()
              });
            } catch (logError) {
              // Just log the error but don't fail the request if activity logging fails
              console.error('Failed to log invitation activity:', logError);
            }
          }
          
          // Return the invitation data
          res.status(201).json(createdInvitation);
        } catch (parseError) {
          throw parseError;
        }
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          res.status(400).json({ error: validationError.errors });
        } else {
          const errorMessage = validationError instanceof Error 
            ? validationError.message 
            : "Failed to create invitation";
          res.status(400).json({ error: errorMessage });
        }
      }
    } catch (error) {
      console.error('Unexpected error creating invitation:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        const errorMessage = error instanceof Error 
          ? error.message 
          : "Failed to create invitation due to server error";
        res.status(500).json({ error: errorMessage });
      }
    }
  });
  
  apiRouter.get("/invitations", async (req: Request, res: Response) => {
    try {
      // Get query parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const salonId = req.query.salonId ? parseInt(req.query.salonId as string) : undefined;
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const status = req.query.status as string | undefined;
      
      let invitations;
      
      console.log(`[API] GET /invitations - Params: salonId=${salonId}, clientId=${clientId}, status=${status}, limit=${limit}`);
      
      // Check if salonId is provided
      if (salonId) {
        // Get invitations for a specific salon
        invitations = await storage.getSalonInvitations(salonId);
        console.log(`[API] GET /invitations - Got ${invitations.length} invitations for salon ${salonId}`);
      } else if (clientId) {
        // Get invitations specific to this client
        invitations = await storage.getClientInvitations(clientId, status, limit);
        console.log(`[API] GET /invitations - Got ${invitations.length} invitations for client ${clientId}`);
      } else {
        // Default: get recent invitations with limit
        invitations = await storage.getRecentInvitations(limit);
        console.log(`[API] GET /invitations - Got ${invitations.length} recent invitations (default)`);
      }
      
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

  // Get invitation by hash
  apiRouter.get("/invitations/by-hash/:hash", async (req: Request, res: Response) => {
    try {
      const { hash } = req.params;
      
      if (!hash) {
        return res.status(400).json({ error: "Hash parameter is required" });
      }
      
      const invitation = await storage.getInvitationByHash(hash);
      
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      res.json(invitation);
    } catch (error) {
      console.error('Error fetching invitation by hash:', error);
      res.status(500).json({ error: "Failed to fetch invitation" });
    }
  });
  
  // Update invitation status (PATCH endpoint kept for backward compatibility)
  apiRouter.patch("/invitations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Get status from request body
      const { status, clientId } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      
      // Get the invitation to make sure it exists
      const invitation = await storage.getInvitation(id);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      // Update invitation status
      const updatedInvitation = await storage.updateInvitationStatus(id, status);
      
      res.json(updatedInvitation);
    } catch (error) {
      console.error('Error updating invitation status:', error);
      res.status(500).json({ error: "Failed to update invitation status" });
    }
  });
  
  // Dedicated endpoint for updating invitation status - follows RESTful conventions
  apiRouter.put("/invitations/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Get status from request body
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }
      
      // Get the invitation to make sure it exists
      const invitation = await storage.getInvitation(id);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      // Update invitation status
      const updatedInvitation = await storage.updateInvitationStatus(id, status);
      
      // Log the status change as an activity
      try {
        await storage.createActivityLog({
          type: "invitation_status_updated",
          description: `Invitation #${invitation.inviteHash} status changed from ${invitation.status} to ${status}`,
          salonId: Number(invitation.salonId),
          timestamp: new Date()
        });
      } catch (logError) {
        console.error('Failed to log invitation status update activity:', logError);
      }
      
      res.json(updatedInvitation);
    } catch (error) {
      console.error('Error updating invitation status:', error);
      res.status(500).json({ error: "Failed to update invitation status" });
    }
  });
  
  // Complete the invitation sequence by posting to dashboards and tracking
  apiRouter.post("/invitations/:id/complete", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Get the selected style ID if provided in the request body
      const { styleId } = req.body;
      
      // Get the invitation to make sure it exists
      const invitation = await storage.getInvitation(id);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      // If status is not already "sent", update it with the styleId if available
      if (invitation.status !== "sent") {
        await storage.updateGiftStatus(id, "sent", styleId ? Number(styleId) : undefined);
      }
      
      // Post to client dashboard if there's a sender
      const clientResult = await storage.postToClientDashboard(id);
      
      // Post to salon dashboard if there's a salon
      const salonResult = await storage.postToSalonDashboard(id);
      
      // Create a comprehensive activity log entry for this completed invitation
      const activityLog = await storage.createActivityLog({
        type: "invitation_completed",
        description: `Gift invitation #${invitation.inviteHash} for ${invitation.name} has been completed and posted to dashboards`,
        salonId: invitation.salonId || undefined,
        clientId: invitation.senderId || undefined,
        timestamp: new Date()
      });
      
      // Return success with information about where the invitation was posted
      res.status(200).json({
        id: invitation.id,
        inviteHash: invitation.inviteHash,
        status: "sent",
        postedToClient: clientResult,
        postedToSalon: salonResult,
        message: "Invitation has been completed and posted to dashboards",
        logId: activityLog.id
      });
    } catch (error) {
      console.error("Error completing invitation:", error);
      res.status(500).json({ error: "Failed to complete invitation process" });
    }
  });
  
  // Admin-only endpoint to delete an invitation
  apiRouter.delete("/invitations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid invitation ID format" });
      }
      
      // First check if the invitation exists
      const invitation = await storage.getInvitation(id);
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      // Delete the invitation
      const success = await storage.deleteInvitation(id);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to delete invitation" });
      }
      
      res.json({ 
        success: true,
        message: `Invitation ${id} successfully deleted`
      });
    } catch (error) {
      console.error('Error deleting invitation:', error);
      res.status(500).json({ error: "Failed to delete invitation" });
    }
  });
  
  // Invitation validation endpoint - Validates promo codes and phone numbers
  apiRouter.post("/invitations/validate", async (req: Request, res: Response) => {
    try {
      const { code, phone, validationMode, salonId } = req.body;
      
      // SIMPLIFIED VALIDATION FLOW:
      // 1. If we find a match (client), return success with client ID for dashboard redirect
      // 2. If no match, return error with redirect to home
      
      // Track if we find a matching client
      let matchingClient = null;
      
      // Get the salon if provided - needed for user ID creation
      let salon = null;
      if (salonId) {
        salon = await storage.getSalon(Number(salonId));
      }

      // PHONE VALIDATION MODE (simplified flow)
      if (validationMode === 'phone' && phone) {
        // Clean and normalize the phone number
        const cleanPhone = phone.replace(/\D/g, '');
        
        // If we have less than 4 digits, we can't validate
        if (cleanPhone.length < 4) {
          return res.status(400).json({ 
            error: "Please enter at least the last 4 digits of your phone number",
            redirect: 'home'
          });
        }
        
        // For security, we only allow validating with at least the last 4 digits
        const last4Digits = cleanPhone.slice(-4);
        
        // Now check if a client already exists with this phone
        const allClients = await db.select().from(clients);
        
        // First try to find exact matches
        const exactMatches = allClients.filter(client => 
          client.phone && client.phone.replace(/\D/g, '') === cleanPhone
        );
        
        if (exactMatches.length > 0) {
          matchingClient = exactMatches[0];
          
          // Return the matching client info
          return res.status(200).json({ 
            success: true,
            message: "Phone validated successfully",
            clientId: matchingClient.id,
            name: matchingClient.name,
            phone: matchingClient.phone,
            email: matchingClient.email
          });
        }
        
        // If no exact match, try last 4 digits
        const partialMatches = allClients.filter(client => 
          client.phone && client.phone.replace(/\D/g, '').slice(-4) === last4Digits
        );
        
        if (partialMatches.length > 0) {
          matchingClient = partialMatches[0];
          
          // Return the matching client info
          return res.status(200).json({ 
            success: true,
            message: "Phone validated successfully (last 4 digits)",
            clientId: matchingClient.id,
            name: matchingClient.name,
            phone: matchingClient.phone,
            email: matchingClient.email
          });
        }
        
        // No client found, return to home page
        return res.status(400).json({ 
          error: "No client found with this phone number. Please try again or register as a new client.", 
          redirect: 'home'
        });
      }
      
      // PROMO CODE VALIDATION MODE (Default/Simplified)
      if (!code) {
        return res.status(400).json({ 
          error: "Missing promo code",
          redirect: 'home'
        });
      }
      
      // DYNAMIC DATABASE VALIDATION APPROACH
      try {
        // 1. Get all data from database for complete validation
        const [allClients, allInvitations, allSalons] = await Promise.all([
          db.select().from(clients),
          db.select().from(invitations),
          db.select().from(storage.getSalonsTable())
        ]);
        
        // 2. Check for direct hash match in invitations
        const invitationByHash = allInvitations.find(inv => inv.inviteHash === code);
        if (invitationByHash) {
          
          // Check if a client already exists with this invitation's phone
          if (invitationByHash.phone) {
            const matchingClients = allClients.filter(client => 
              client.phone && client.phone.replace(/\D/g, '') === invitationByHash.phone.replace(/\D/g, '')
            );
            
            if (matchingClients.length > 0) {
              // Found an existing client, return their ID
              matchingClient = matchingClients[0];
              
              // Get sponsor information from the invitation
              const sponsorName = invitationByHash.sponsor || "Ven Me, Baby! LTD";
              const sponsorSalonId = invitationByHash.salonId || 12;
              
              return res.status(200).json({ 
                success: true,
                message: "Code validated successfully (invitation hash)",
                clientId: matchingClient.id,
                name: matchingClient.name,
                phone: matchingClient.phone,
                email: matchingClient.email,
                sponsor: sponsorName,
                sponsorSalonId: sponsorSalonId
              });
            }
          }
        }
        
        // 3. Check for clients with phone numbers ending with this code
        const clientsWithMatchingPhone = allClients.filter(client => {
          if (!client.phone) return false;
          const clientPhone = client.phone.replace(/\D/g, '');
          return clientPhone.slice(-4) === code;
        });
        
        if (clientsWithMatchingPhone.length > 0) {
          matchingClient = clientsWithMatchingPhone[0];
          
          // Get sponsor information for client
          const sponsorName = matchingClient.sponsor || "Ven Me, Baby! LTD";
          const sponsorSalonId = matchingClient.sponsorSalonId || 12;
          
          return res.status(200).json({ 
            success: true,
            message: "Code validated successfully (last 4 digits of client phone)",
            clientId: matchingClient.id,
            name: matchingClient.name,
            phone: matchingClient.phone,
            email: matchingClient.email,
            sponsor: sponsorName,
            sponsorSalonId: sponsorSalonId
          });
        }
        
        // 4. Check for invitations with phone numbers ending with this code
        const invitationsWithMatchingPhone = allInvitations.filter(invitation => {
          if (!invitation.phone) return false;
          const invitationPhone = invitation.phone.replace(/\D/g, '');
          return invitationPhone.slice(-4) === code;
        });
        
        if (invitationsWithMatchingPhone.length > 0) {
          const invitation = invitationsWithMatchingPhone[0];
          
          // Check if there's already a client with this phone
          const clientsWithInvitationPhone = allClients.filter(client => {
            if (!client.phone || !invitation.phone) return false;
            return client.phone.replace(/\D/g, '') === invitation.phone.replace(/\D/g, '');
          });
          
          if (clientsWithInvitationPhone.length > 0) {
            matchingClient = clientsWithInvitationPhone[0];
            
            // Get sponsor information from the client
            const sponsorName = matchingClient.sponsor || "Ven Me, Baby! LTD";
            const sponsorSalonId = matchingClient.sponsorSalonId || 12;
            
            return res.status(200).json({ 
              success: true,
              message: "Code validated successfully (invitation phone match)",
              clientId: matchingClient.id,
              name: matchingClient.name,
              phone: matchingClient.phone,
              email: matchingClient.email,
              sponsor: sponsorName,
              sponsorSalonId: sponsorSalonId
            });
          } else {
            // No client found, but invitation is valid - return invitation details for registration
            
            // Get sponsor information from the invitation
            const sponsorName = invitation.sponsor || "Ven Me, Baby! LTD";
            const sponsorSalonId = invitation.salonId || 12;
            
            return res.status(200).json({ 
              success: true,
              message: "Code validated successfully (invitation with no client)",
              redirect: 'register',
              name: invitation.name,
              phone: invitation.phone,
              email: invitation.email,
              sponsor: sponsorName,
              sponsorSalonId: sponsorSalonId
            });
          }
        }
        
        // 5. Compare with salons data as fallback
        const salonsWithMatchingPhone = allSalons.filter(salon => {
          if (!salon.phone) return false;
          const salonPhone = salon.phone.replace(/\D/g, '');
          return salonPhone.slice(-4) === code;
        });
        
        if (salonsWithMatchingPhone.length > 0) {
          // Check if any clients have this salon as sponsor
          const clientsWithSponsor = allClients.filter(client => 
            client.sponsorSalonId === salonsWithMatchingPhone[0].id
          );
          
          if (clientsWithSponsor.length > 0) {
            matchingClient = clientsWithSponsor[0];
            
            // Get sponsor information from the client (should match the salon we found)
            const sponsorSalon = salonsWithMatchingPhone[0];
            const sponsorName = sponsorSalon.name || "Ven Me, Baby! LTD";
            const sponsorSalonId = sponsorSalon.id || 12;
            
            return res.status(200).json({
              success: true,
              message: "Code validated successfully (salon sponsor match)",
              clientId: matchingClient.id,
              name: matchingClient.name,
              phone: matchingClient.phone,
              email: matchingClient.email,
              sponsor: sponsorName,
              sponsorSalonId: sponsorSalonId
            });
          }
        }
      } catch (validationError) {
        console.error("Error during dynamic validation:", validationError);
      }
      
      // No client or invitation found - return error and redirect to home
      return res.status(400).json({ 
        error: "Invalid promo code. Please enter the last 4 digits of your phone number (e.g., 1212).",
        redirect: 'home'
      });
    } catch (error) {
      console.error('Error validating invitation:', error);
      res.status(500).json({ 
        error: "Failed to validate invitation",
        redirect: 'home'
      });
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
      res.json(invitations);
    } catch (error) {
      console.error('Error retrieving salon invitations:', error);
      res.status(500).json({ error: "Failed to retrieve salon invitations" });
    }
  });
  
  // New route to check invitation limits for salons based on license verification status
  apiRouter.get("/salons/:id/invitation-limit", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const salonId = parseInt(id);
      
      // Get the salon to check license verification status
      const salon = await storage.getSalon(salonId);
      if (!salon) {
        return res.status(404).json({ error: "Salon not found" });
      }
      
      // Check invitation limit
      const limitInfo = await storage.hasSalonReachedInvitationLimit(salonId);
      
      // Return license and invitation limit information
      res.json({
        licenseVerified: salon.licenseVerified || false,
        licenseStatus: salon.licenseStatus || 'pending',
        currentCount: limitInfo.currentCount,
        limit: limitInfo.limit,
        hasReachedLimit: limitInfo.hasReachedLimit
      });
    } catch (error) {
      console.error('Error checking salon invitation limit:', error);
      res.status(500).json({ error: "Failed to retrieve salon invitation limit information" });
    }
  });

  // Style Selection Endpoints
  apiRouter.post("/clients/:clientId/style-selections", async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const { styleId, salonId, invitationId } = req.body;
      
      // Validate required fields
      if (!styleId || !salonId) {
        return res.status(400).json({ error: "styleId and salonId are required" });
      }
      
      // Fetch client to check sponsorship
      const client = await storage.getClient(Number(clientId));
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      
      // Check sponsorship and update client if needed
      if (!client.sponsorSalonId) {
        // Get the Ven Me, Baby! LTD salon ID
        const vmbSalon = await storage.getSalonByName("Ven Me, Baby! LTD");
        const vmbSalonId = vmbSalon ? vmbSalon.id : 43; // Fallback to ID 43 if not found
        
        // Update client with default sponsor
        try {
          await db.update(clients)
            .set({ 
              sponsor: "Ven Me, Baby! LTD",
              sponsorSalonId: vmbSalonId
            })
            .where(eq(clients.id, Number(clientId)));
          
          // Log the sponsorship assignment
          await storage.createActivityLog({
            type: "sponsor_assignment",
            description: `Default sponsor VMB LTD assigned to client ${clientId}`,
            clientId: Number(clientId),
            salonId: vmbSalonId,
            timestamp: new Date()
          });
        } catch (updateError) {
          console.error(`Failed to update client ${clientId} sponsorship:`, updateError);
          // Continue with style selection even if sponsorship update fails
        }
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
  
  // Log VMB Invitation Sent
  apiRouter.post("/vmb-invitations/log", async (req: Request, res: Response) => {
    try {
      const { clientId, salonId, styleId } = req.body;
      
      // Validate required fields
      if (!clientId || !salonId || !styleId) {
        return res.status(400).json({ error: "clientId, salonId, and styleId are required" });
      }
      
      // Convert to numbers
      const clientIdNum = Number(clientId);
      const salonIdNum = Number(salonId);
      const styleIdNum = Number(styleId);
      
      if (isNaN(clientIdNum) || isNaN(salonIdNum) || isNaN(styleIdNum)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Log the VMB invitation
      const activityLog = await storage.logVmbInvitationSent(clientIdNum, salonIdNum, styleIdNum);
      res.status(201).json({ 
        success: true, 
        message: "VMB invitation logged successfully", 
        logId: activityLog.id 
      });
    } catch (error) {
      console.error("Error logging VMB invitation:", error);
      res.status(500).json({ error: "Failed to log VMB invitation" });
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

  // Register license routes
  apiRouter.use("/license", licenseRoutes);

  // Register API routes
  app.use("/api", apiRouter);
  
  // Register visualization routes
  registerVisualizationRoutes(app);
  
  // Register Madge network visualization routes
  registerMadgeRoutes(app);
  
  // Serve the visualizations directory directly for SVG/PNG files
  app.get('/visualizations/:filename', (req, res) => {
    const visualizationsDir = path.join(process.cwd(), 'visualizations');
    const filePath = path.join(visualizationsDir, req.params.filename);
    
    console.log(`[DEBUG] Serving visualization: ${filePath}`);
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      // Set proper content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.svg') {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (ext === '.png') {
        res.setHeader('Content-Type', 'image/png');
      }
      
      // Stream the file
      fs.createReadStream(filePath).pipe(res);
    } else {
      console.log(`[DEBUG] Visualization file not found: ${filePath}`);
      res.status(404).send('Visualization file not found');
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}