import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Schema for license data
const licenseDataSchema = z.object({
  salonId: z.number(),
  licenseName: z.string().min(2),
  licenseNumber: z.string().min(1),
  licenseState: z.string().min(1),
});

// Submit salon license information
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const validationResult = licenseDataSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid license data',
        errors: validationResult.error.flatten().fieldErrors,
      });
    }
    
    const licenseData = validationResult.data;
    const salonId = licenseData.salonId;
    
    // Check if salon exists
    const salon = await storage.getSalon(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }
    
    // Update salon with license information
    const updatedSalon = await storage.updateSalonLicense(
      salonId,
      {
        licenseName: licenseData.licenseName,
        licenseNumber: licenseData.licenseNumber,
        licenseState: licenseData.licenseState,
        licenseStatus: 'pending',  // Always starts as pending
        licenseVerified: false,    // Not verified initially
      }
    );
    
    // Return the updated salon
    res.status(200).json(updatedSalon);
  } catch (error) {
    console.error('Error submitting license:', error);
    res.status(500).json({ 
      message: 'Failed to submit license information',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get license status for a salon
router.get('/:salonId', async (req: Request, res: Response) => {
  try {
    const salonId = parseInt(req.params.salonId);
    
    if (isNaN(salonId)) {
      return res.status(400).json({ message: 'Invalid salon ID' });
    }
    
    // Get salon with license information
    const salon = await storage.getSalon(salonId);
    
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }
    
    // Return license information
    res.status(200).json({
      salonId: salon.id,
      licenseName: salon.licenseName || null,
      licenseNumber: salon.licenseNumber || null,
      licenseState: salon.licenseState || null,
      licenseStatus: salon.licenseStatus || 'not_submitted',
      licenseVerified: salon.licenseVerified || false,
    });
  } catch (error) {
    console.error('Error getting license status:', error);
    res.status(500).json({ 
      message: 'Failed to get license information',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;