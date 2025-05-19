import { Router } from 'express';
import { DatabaseStorage } from '../storage';
import { z } from 'zod';

const router = Router();
const storage = new DatabaseStorage();

// Schema for license submission validation
const licenseSchema = z.object({
  licenseName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  licenseNumber: z.string().min(3, { message: 'License number required' }),
  licenseState: z.string().min(2, { message: 'Please select a state' }),
  licenseStatus: z.string().optional()
});

// POST /api/salons/:id/license - Update salon license information
router.post('/salons/:id/license', async (req, res) => {
  try {
    const salonId = parseInt(req.params.id);
    if (isNaN(salonId)) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }

    // Validate the request body
    const validation = licenseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid license data', 
        details: validation.error.errors 
      });
    }

    const licenseData = validation.data;
    
    // Set initial status to pending if not specified
    if (!licenseData.licenseStatus) {
      licenseData.licenseStatus = 'pending';
    }

    // Update the salon with license information
    const updatedSalon = await storage.updateSalonLicense(salonId, {
      licenseName: licenseData.licenseName,
      licenseNumber: licenseData.licenseNumber,
      licenseState: licenseData.licenseState,
      licenseStatus: licenseData.licenseStatus,
      licenseVerified: false // Always false on initial submission
    });

    res.status(200).json(updatedSalon);
  } catch (error) {
    console.error('Error updating salon license:', error);
    res.status(500).json({ error: 'Failed to update salon license information' });
  }
});

export default router;