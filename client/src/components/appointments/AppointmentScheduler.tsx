import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { Textarea } from '@/components/ui/textarea';
import type { Invitation } from '../../types';
import { Loader2 } from 'lucide-react';

interface Schedule {
  dayOfWeek: number;
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface AppointmentSchedulerProps {
  invitation: Invitation;
  clientId: number;
  onScheduled: () => void;
}

export default function AppointmentScheduler({ invitation, clientId, onScheduled }: AppointmentSchedulerProps) {
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  
  // Get salon schedule
  const { data: schedule, isLoading: isLoadingSchedule } = useQuery({
    queryKey: [`/api/salons/${invitation.salonId}/schedule`],
    queryFn: async () => {
      const res = await fetch(`/api/salons/${invitation.salonId}/schedule`);
      if (!res.ok) {
        throw new Error("Failed to fetch salon schedule");
      }
      return res.json() as Promise<Schedule[]>;
    },
    enabled: !!invitation.salonId
  });
  
  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: {
      clientId: number;
      salonId: number;
      invitationId: number;
      serviceDate: string;
      serviceTime: string;
      notes?: string;
    }) => {
      return apiRequest('POST', '/api/appointments', appointmentData);
    },
    onSuccess: () => {
      toast({
        title: 'Appointment Scheduled',
        description: 'Your appointment has been successfully scheduled.',
      });
      onScheduled();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to schedule appointment: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Generate available time slots based on selected date and salon hours
  useEffect(() => {
    if (!date || !schedule) return;
    
    const dayOfWeek = date.getDay(); // 0-6 (Sunday-Saturday)
    const scheduleForDay = schedule.find(day => day.dayOfWeek === dayOfWeek);
    
    if (!scheduleForDay || !scheduleForDay.isOpen) {
      setAvailableTimes([]);
      return;
    }
    
    // Generate time slots at 30-minute intervals
    const { openTime, closeTime } = scheduleForDay;
    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);
    
    const startMinutes = openHour * 60 + openMinute;
    const endMinutes = closeHour * 60 + closeMinute;
    
    const timeSlots = [];
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
    
    setAvailableTimes(timeSlots);
  }, [date, schedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !time) {
      toast({
        title: 'Missing Information',
        description: 'Please select both a date and time for your appointment.',
        variant: 'destructive',
      });
      return;
    }
    
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    createAppointmentMutation.mutate({
      clientId,
      salonId: invitation.salonId!,
      invitationId: invitation.id,
      serviceDate: formattedDate,
      serviceTime: time,
      notes: notes || undefined
    });
  };

  if (isLoadingSchedule) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading salon schedule...</span>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Schedule Your Appointment</CardTitle>
        <CardDescription>
          {invitation.styleOption ? (
            <span>
              Book your {invitation.styleOption} service
              {invitation.styleDuration ? ` (${invitation.styleDuration} min)` : ''}
            </span>
          ) : 'Select a date and time that works for you'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="date" className="text-sm font-medium">
              Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Select a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => {
                    // Disable dates in the past or days when salon is closed
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    
                    if (date < now) return true;
                    
                    // Check if salon is closed on this day
                    if (schedule) {
                      const dayOfWeek = date.getDay();
                      const scheduleForDay = schedule.find(day => day.dayOfWeek === dayOfWeek);
                      return scheduleForDay ? !scheduleForDay.isOpen : true;
                    }
                    
                    return false;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="time" className="text-sm font-medium">
              Time
            </label>
            <Select
              disabled={!date || availableTimes.length === 0}
              value={time}
              onValueChange={setTime}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a time">
                  {time ? (
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {time}
                    </div>
                  ) : (
                    "Select a time"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableTimes.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm">
                    {date
                      ? "No available times for the selected date"
                      : "Please select a date first"}
                  </div>
                ) : (
                  availableTimes.map((timeSlot) => (
                    <SelectItem key={timeSlot} value={timeSlot}>
                      {timeSlot}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </label>
            <Textarea
              id="notes"
              placeholder="Any special requests or notes for your stylist"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button 
          type="submit" 
          form="appointment-form"
          disabled={!date || !time || createAppointmentMutation.isPending}
          className="w-full"
        >
          {createAppointmentMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scheduling...
            </>
          ) : (
            "Schedule Appointment"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}