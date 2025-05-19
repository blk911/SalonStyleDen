import { Router, Request, Response } from 'express';
import { storage } from '../storage';

const router = Router();

// Route to submit salon license information
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { salonId, licenseName, licenseNumber, licenseState } = req.body;
    
    if (!salonId || !licenseName || !licenseNumber || !licenseState) {
      return res.status(400).json({ 
        error: 'Missing required license information', 
        message: 'Please provide all required license information.'
      });
    }
    
    // Get the salon to ensure it exists
    const salon = await storage.getSalon(Number(salonId));
    if (!salon) {
      return res.status(404).json({ 
        error: 'Salon not found', 
        message: 'The salon could not be found.'
      });
    }
    
    // Update salon with license information
    const updatedSalon = await storage.updateSalonLicense(Number(salonId), {
      licenseName,
      licenseNumber,
      licenseState,
      licenseStatus: 'pending',
      licenseVerified: false
    });
    
    // Log the license submission for admin review
    console.log(`[LICENSE] Salon ${salonId} (${salon.name}) license submitted: ${licenseNumber} (${licenseState})`);
    
    // Create an activity log entry to track this step in the registration flow
    try {
      await storage.createActivityLog({
        type: "LICENSE_SUBMISSION",
        description: `Salon ${salon.name} license submission: ${licenseNumber} (${licenseState})`,
        salonId: Number(salonId),
        timestamp: new Date()
      });
    } catch (logError) {
      console.error("Failed to log license submission activity:", logError);
      // Don't fail the request if logging fails
    }
    
    return res.status(200).json({
      success: true,
      message: 'License information submitted successfully.',
      data: {
        salonId,
        licenseName,
        licenseNumber,
        licenseState,
        licenseStatus: 'pending'
      }
    });
  } catch (error) {
    console.error('Error submitting license:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: 'An error occurred while submitting license information.'
    });
  }
});

// Route to get salon license information
router.get('/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    
    if (!salonId) {
      return res.status(400).json({ 
        error: 'Missing salon ID', 
        message: 'Please provide a salon ID.'
      });
    }
    
    // Get the salon
    const salon = await storage.getSalon(Number(salonId));
    if (!salon) {
      return res.status(404).json({ 
        error: 'Salon not found', 
        message: 'The salon could not be found.'
      });
    }
    
    // Return license information
    return res.status(200).json({
      success: true,
      data: {
        salonId: salon.id,
        licenseName: salon.licenseName,
        licenseNumber: salon.licenseNumber,
        licenseState: salon.licenseState,
        licenseStatus: salon.licenseStatus || 'not_submitted',
        licenseVerified: salon.licenseVerified || false
      }
    });
  } catch (error) {
    console.error('Error getting license information:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: 'An error occurred while retrieving license information.'
    });
  }
});

export default router;