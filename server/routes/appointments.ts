import { Router } from 'express';
import { Invitation } from '@shared/schema';
import { storage } from '../storage';

const router = Router();

// Get salon schedule/business hours
router.get('/salons/:salonId/schedule', async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    
    if (isNaN(salonId)) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }
    
    const salon = await storage.getSalon(salonId);
    
    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }
    
    // Return the salon's schedule data
    // If no schedule is set, return default business hours
    const schedule = salon.schedule || [
      { dayOfWeek: 0, dayName: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '17:00' },
      { dayOfWeek: 1, dayName: 'Monday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { dayOfWeek: 2, dayName: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { dayOfWeek: 3, dayName: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { dayOfWeek: 4, dayName: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { dayOfWeek: 5, dayName: 'Friday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { dayOfWeek: 6, dayName: 'Saturday', isOpen: true, openTime: '10:00', closeTime: '16:00' }
    ];
    
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching salon schedule:', error);
    res.status(500).json({ error: 'Failed to fetch salon schedule' });
  }
});

export default router;