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
      // Get the registration tracking ID from salon metadata
      const salonData = await storage.getSalon(Number(salonId));
      
      // Create a tracking ID if it doesn't exist
      let registrationTrackingId = `reg_recovery_${Date.now()}`;
      let existingMetadata = {};
      
      // Safely access metadata and extract tracking ID if it exists
      if (salonData && salonData.metadata) {
        try {
          existingMetadata = salonData.metadata;
          if (existingMetadata.registrationTrackingId) {
            registrationTrackingId = existingMetadata.registrationTrackingId;
          }
        } catch (metadataError) {
          console.error("Error accessing metadata:", metadataError);
          // Continue with recovery tracking ID
        }
      }
      
      // Update the salon's metadata to indicate license submission
      await storage.updateSalon(Number(salonId), {
        metadata: {
          licenseSubmitted: true,
          licenseSubmissionTime: new Date().toISOString(),
          registrationTrackingId,
          registrationStage: 'license_submitted',
          // Preserve any existing metadata
          ...(typeof existingMetadata === 'object' ? existingMetadata : {})
        }
      });
      
      // Create detailed activity log for license submission
      await storage.createActivityLog({
        type: "LICENSE_SUBMISSION",
        description: `Salon ${salon.name} license submission: ${licenseNumber} (${licenseState})`,
        salonId: Number(salonId),
        timestamp: new Date(),
        details: JSON.stringify({
          trackingId: registrationTrackingId,
          salonId: Number(salonId),
          licenseName,
          licenseNumber,
          licenseState,
          registrationStage: 'license_submitted'
        })
      });
      
      // Log another activity to mark the successful completion of the registration flow
      await storage.createActivityLog({
        type: "REGISTRATION_COMPLETED",
        description: `Registration flow completed for salon ${salon.name}`,
        salonId: Number(salonId),
        timestamp: new Date(),
        details: JSON.stringify({
          trackingId: registrationTrackingId,
          registrationStage: 'completed',
          licenseVerificationPending: true
        })
      });
      
      console.log(`[LICENSE] License submission activity logged for salon ID ${salonId} with tracking ID ${registrationTrackingId}`);
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