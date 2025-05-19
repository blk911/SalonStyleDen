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

// Route to verify a salon's license (admin action)
router.post('/verify/:salonId', async (req: Request, res: Response) => {
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
    
    // Update salon license status
    const updatedSalon = await storage.updateSalonLicense(Number(salonId), {
      licenseStatus: 'verified',
      licenseVerified: true,
      licenseVerificationDate: new Date().toISOString()
    });
    
    // Log the license verification
    console.log(`[LICENSE] Salon ${salonId} (${salon.name}) license verified by admin`);
    
    return res.status(200).json({
      success: true,
      message: 'License successfully verified.',
      data: {
        salonId: Number(salonId),
        licenseStatus: 'verified',
        licenseVerified: true,
        licenseVerificationDate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error verifying license:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: 'An error occurred while verifying the license.'
    });
  }
});

// Route to reject a salon's license (admin action)
router.post('/reject/:salonId', async (req: Request, res: Response) => {
  try {
    const { salonId } = req.params;
    const { rejectionReason } = req.body;
    
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
    
    // Update salon license status
    const updatedSalon = await storage.updateSalonLicense(Number(salonId), {
      licenseStatus: 'rejected',
      licenseVerified: false,
      licenseVerificationDate: new Date().toISOString(),
      rejectionReason: rejectionReason || 'License information could not be verified'
    });
    
    // Log the license rejection
    console.log(`[LICENSE] Salon ${salonId} (${salon.name}) license rejected by admin`);
    
    return res.status(200).json({
      success: true,
      message: 'License has been rejected.',
      data: {
        salonId: Number(salonId),
        licenseStatus: 'rejected',
        licenseVerified: false,
        licenseVerificationDate: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error rejecting license:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: 'An error occurred while rejecting the license.'
    });
  }
});

export default router;