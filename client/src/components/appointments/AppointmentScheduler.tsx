/**
 * AppointmentScheduler Component
 * 
 * Provides a calendar interface for clients to schedule appointments with salons
 * after they have completed the payment for a service.
 */
import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, SquareCheck } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_TIME_SLOTS = [
  '9:00 AM', 
  '10:00 AM', 
  '11:00 AM', 
  '1:00 PM', 
  '2:00 PM', 
  '3:00 PM', 
  '4:00 PM'
];

interface AppointmentSchedulerProps {
  invitationId: number;
  salonId: number;
  serviceType: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentSet: (date: Date, timeSlot: string) => void;
  salonName?: string;
}

export function AppointmentScheduler({
  invitationId,
  salonId,
  serviceType,
  open,
  onOpenChange,
  onAppointmentSet,
  salonName = "Tiffany 5280 Nails Studio"
}: AppointmentSchedulerProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);
  const { toast } = useToast();
  
  // When a date is selected, load available time slots for that date
  const handleDateSelect = async (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    setDate(selectedDate);
    setTimeSlot(null);
    setIsLoading(true);
    
    try {
      // In a future implementation, this will fetch actual available slots
      // from the salon's schedule in the database
      
      // For now, we'll simulate some availability based on the day of week
      const dayOfWeek = selectedDate.getDay();
      
      // Simulated time slots availability
      let slots = [...DEFAULT_TIME_SLOTS];
      
      // Remove morning slots on Mondays (simulated)
      if (dayOfWeek === 1) {
        slots = slots.filter(slot => !slot.includes('AM'));
      }
      
      // Remove afternoon slots on Fridays (simulated)
      if (dayOfWeek === 5) {
        slots = slots.filter(slot => !slot.includes('PM'));
      }
      
      // Randomly remove 1-2 slots to simulate booked appointments
      const numToRemove = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numToRemove; i++) {
        const randomIndex = Math.floor(Math.random() * slots.length);
        if (slots.length > 3) { // Ensure we always have at least 3 options
          slots.splice(randomIndex, 1);
        }
      }
      
      setAvailableTimeSlots(slots);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available time slots. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle the confirmation of appointment scheduling
  const handleConfirmAppointment = async () => {
    if (!date || !timeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select both a date and time for your appointment.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In the future, this will send the appointment data to the server
      // and update the invitation with the appointment details
      
      // For now, we'll simulate a successful appointment creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the callback with the selected date and time
      onAppointmentSet(date, timeSlot);
      
      // Close the dialog
      onOpenChange(false);
      
      toast({
        title: "Appointment Scheduled!",
        description: `Your appointment has been set for ${format(date, 'MMMM do')} at ${timeSlot}.`,
      });
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: "Error",
        description: "Failed to schedule appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-amber-500" />
            Schedule Your Appointment
          </DialogTitle>
          <DialogDescription>
            Select a date and time for your {serviceType} appointment at {salonName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2 text-gray-700">Select a Date</h4>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date() || date > addWeeks(new Date(), 8)}
              className="rounded-md border"
            />
          </div>
          
          {date && (
            <div className="border rounded-md p-3">
              <h4 className="text-sm font-medium mb-2 text-gray-700">Select a Time</h4>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableTimeSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={timeSlot === slot ? "default" : "outline"}
                      className={timeSlot === slot ? "bg-amber-500 hover:bg-amber-600" : ""}
                      onClick={() => setTimeSlot(slot)}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {slot}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {date && timeSlot && (
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <h4 className="font-medium text-amber-800 flex items-center gap-2">
                <SquareCheck className="h-4 w-4" />
                Your Selection
              </h4>
              <div className="mt-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{format(date, 'MMMM do, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">{serviceType}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAppointment}
            className="bg-amber-500 hover:bg-amber-600 text-white"
            disabled={isLoading || !date || !timeSlot}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Processing</span>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              "Confirm Appointment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AppointmentScheduler;