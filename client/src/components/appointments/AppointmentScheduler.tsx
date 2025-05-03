import { useState, useEffect } from 'react';
import { format, parseISO, isValid, isAfter, addDays } from 'date-fns';
import { Calendar, CalendarProps } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarIcon, Clock, Check, ClockIcon } from 'lucide-react';

interface BusinessHour {
  isOpen: boolean;
  dayName: string;
  openTime: string;
  closeTime: string;
  dayOfWeek: number;
}

interface Appointment {
  id: number;
  clientId: number;
  salonId: number;
  invitationId: number;
  serviceDate: string;
  serviceTime: string;
  status: string;
  notes?: string;
  createdAt: string;
}

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  salonId: number;
  salonName: string;
  styleOption?: string;
  stylePrice?: number;
  styleDuration?: number;
  status: string;
}

interface AppointmentSchedulerProps {
  invitation: Invitation;
  salonId: number;
  clientId: number;
}

export default function AppointmentScheduler({ invitation, salonId, clientId }: AppointmentSchedulerProps) {
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch salon's business hours
  useEffect(() => {
    const fetchBusinessHours = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/salons/${salonId}/schedule`);
        if (!response.ok) {
          throw new Error('Failed to fetch business hours');
        }
        const data = await response.json();
        setBusinessHours(data);
        console.log('Fetched business hours:', data);
      } catch (error) {
        console.error('Error fetching business hours:', error);
        toast({
          title: 'Error',
          description: 'Failed to load salon business hours.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (salonId) {
      fetchBusinessHours();
    }
  }, [salonId, toast]);

  // Generate time slots when a date is selected
  useEffect(() => {
    if (selectedDate && businessHours.length > 0) {
      // Get the day of week (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = selectedDate.getDay();
      
      // Find the business hours for the selected day
      const dayHours = businessHours.find((hour) => hour.dayOfWeek === dayOfWeek);
      
      if (dayHours && dayHours.isOpen) {
        // Generate time slots in 30-minute intervals
        const timeSlots = generateTimeSlots(dayHours.openTime, dayHours.closeTime);
        setAvailableTimeSlots(timeSlots);
      } else {
        setAvailableTimeSlots([]);
      }
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedDate, businessHours]);

  // Generate time slots from open to close time in 30-minute intervals
  const generateTimeSlots = (openTime: string, closeTime: string): string[] => {
    const slots: string[] = [];
    
    // Parse times (assuming 24-hour format like "09:00" and "17:00")
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);
    
    // Convert to minutes for easier calculation
    let currentMinutes = openHour * 60 + openMinute;
    const endMinutes = closeHour * 60 + closeMinute;
    
    // Generate slots in 30-minute intervals
    while (currentMinutes < endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;
      
      // Format time as 12-hour clock with AM/PM
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
      
      slots.push(
        `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
      );
      
      // Increment by 30 minutes
      currentMinutes += 30;
    }
    
    return slots;
  };

  // Custom filter to disable dates that are in the past or when salon is closed
  const disableDates: CalendarProps["disabled"] = (date) => {
    // Disable dates in the past
    if (!isAfter(date, new Date())) {
      return true;
    }
    
    // Disable dates when salon is closed
    const dayOfWeek = date.getDay();
    const dayHours = businessHours.find((hour) => hour.dayOfWeek === dayOfWeek);
    
    return !dayHours || !dayHours.isOpen;
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(null); // Clear selected time when date changes
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowConfirmDialog(true);
  };

  // Handle appointment confirmation
  const handleConfirmAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Format date as ISO string (YYYY-MM-DD)
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Create the appointment
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          salonId,
          invitationId: invitation.id,
          serviceDate: formattedDate,
          serviceTime: selectedTime,
          status: 'confirmed',
          notes: `Scheduled for ${invitation.styleOption || 'standard service'}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create appointment');
      }

      // Update invitation status to 'scheduled'
      const updateResponse = await fetch(`/api/invitations/${invitation.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'scheduled' }),
      });

      if (!updateResponse.ok) {
        console.error('Failed to update invitation status');
      }

      toast({
        title: 'Appointment Scheduled',
        description: `Your appointment has been scheduled for ${format(selectedDate, 'EEEE, MMMM d')} at ${selectedTime}.`,
      });

      // Close dialog and reset form
      setShowConfirmDialog(false);
      setSelectedDate(undefined);
      setSelectedTime(null);
      
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule appointment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-pink-500" />
            Schedule Your Appointment
          </CardTitle>
          <CardDescription>
            Select a date and time for your {invitation.styleOption || 'service'} appointment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : businessHours.length > 0 ? (
            <div className="space-y-6">
              <div className="border rounded-md">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={disableDates}
                  className="rounded-md border"
                  fromDate={new Date()}
                />
              </div>

              <Accordion type="single" collapsible defaultValue="business-hours">
                <AccordionItem value="business-hours">
                  <AccordionTrigger className="text-sm font-medium">
                    Salon Business Hours
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {businessHours.map((hour) => (
                        <div key={hour.dayName} className="flex justify-between items-center py-1 border-b border-gray-100">
                          <span className="font-medium w-24">{hour.dayName}</span>
                          {hour.isOpen ? (
                            <span>{hour.openTime} - {hour.closeTime}</span>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">Closed</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {selectedDate && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">
                    Available Times for {format(selectedDate, 'EEEE, MMMM d')}:
                  </h3>
                  {availableTimeSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableTimeSlots.map((time) => (
                        <Button
                          key={time}
                          variant="outline"
                          size="sm"
                          onClick={() => handleTimeSelect(time)}
                          className={selectedTime === time ? 'border-pink-500 bg-pink-50' : ''}
                        >
                          <ClockIcon className="h-3 w-3 mr-1" /> {time}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No available time slots on this day.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-gray-500">
              Business hours are not available for this salon.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Appointment</DialogTitle>
            <DialogDescription>
              Please review and confirm your appointment details.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDate && selectedTime && (
            <div className="py-4">
              <div className="space-y-4">
                <div className="bg-pink-50 p-3 rounded-md border border-pink-200">
                  <h4 className="font-medium text-pink-800 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Appointment Details
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium">{invitation.styleOption || "Standard Service"}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">${invitation.stylePrice || 45}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{invitation.styleDuration || 30} min</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </li>
                  </ul>
                </div>
                
                <p className="text-sm text-gray-500">
                  By confirming this appointment, you agree to the salon's cancellation policy.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between items-center sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAppointment}
              className="bg-pink-500 hover:bg-pink-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Scheduling</span>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Appointment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}