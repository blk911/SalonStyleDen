import { Router } from 'express';
import { storage } from '../storage';
import { insertAppointmentSchema, Invitation } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Get all appointments for a client
router.get('/clients/:clientId/appointments', async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    
    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }
    
    const appointments = await storage.getClientAppointments(clientId);
    
    // If client has appointments, fetch additional data
    if (appointments.length > 0) {
      // Get salon data for each appointment
      const appointmentsWithSalonData = await Promise.all(
        appointments.map(async (appointment) => {
          const salon = await storage.getSalon(appointment.salonId);
          const invitation = appointment.invitationId 
            ? await storage.getInvitation(appointment.invitationId)
            : null;
            
          return {
            ...appointment,
            salonName: salon?.name,
            styleName: invitation?.styleOption,
            stylePrice: invitation?.stylePrice,
            styleDuration: invitation?.styleDuration
          };
        })
      );
      
      return res.json(appointmentsWithSalonData);
    }
    
    // If no appointments, just return the empty array
    return res.json(appointments);
  } catch (error) {
    console.error('Error fetching client appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get all appointments for a salon
router.get('/salons/:salonId/appointments', async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    
    if (isNaN(salonId)) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }
    
    const appointments = await storage.getSalonAppointments(salonId);
    
    // If salon has appointments, fetch additional data
    if (appointments.length > 0) {
      // Get client data for each appointment
      const appointmentsWithClientData = await Promise.all(
        appointments.map(async (appointment) => {
          const client = await storage.getClient(appointment.clientId);
          const invitation = appointment.invitationId 
            ? await storage.getInvitation(appointment.invitationId)
            : null;
            
          return {
            ...appointment,
            clientName: client?.name,
            clientPhone: client?.phone,
            styleName: invitation?.styleOption,
            stylePrice: invitation?.stylePrice,
            styleDuration: invitation?.styleDuration
          };
        })
      );
      
      return res.json(appointmentsWithClientData);
    }
    
    // If no appointments, just return the empty array
    return res.json(appointments);
  } catch (error) {
    console.error('Error fetching salon appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

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

// Create a new appointment
router.post('/appointments', async (req, res) => {
  try {
    // Validate request body against the schema
    const validatedData = insertAppointmentSchema.parse(req.body);
    
    // Create the appointment
    const appointment = await storage.createAppointment(validatedData);
    
    // If invitation is provided, update its status
    if (appointment.invitationId) {
      await storage.updateInvitationStatus(appointment.invitationId, 'scheduled');
      
      // Create activity log
      await storage.createActivityLog({
        type: 'appointment_scheduled',
        description: `Appointment scheduled for invitation #${appointment.invitationId}`,
        clientId: appointment.clientId,
        salonId: appointment.salonId,
        timestamp: new Date()
      });
    }
    
    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid appointment data', details: error.errors });
    }
    
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Update appointment status
router.put('/appointments/:id/status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid appointment ID' });
    }
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Get the appointment to check if it exists
    const existingAppointment = await storage.getAppointment(id);
    
    if (!existingAppointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    // Update the appointment status
    const updatedAppointment = await storage.updateAppointmentStatus(id, status);
    
    // Create activity log
    await storage.createActivityLog({
      type: 'appointment_status_updated',
      description: `Appointment #${id} status updated to ${status}`,
      clientId: existingAppointment.clientId,
      salonId: existingAppointment.salonId,
      timestamp: new Date()
    });
    
    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
});

export default router;