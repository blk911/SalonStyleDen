import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import AppointmentScheduler from './AppointmentScheduler';
import { CalendarIcon, Clock, MapPin, Scissors, ChevronDown, ChevronUp } from 'lucide-react';

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
  salonName?: string;
  styleName?: string;
  stylePrice?: number;
  styleDuration?: number;
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

interface ClientAppointmentsProps {
  clientId: number;
  completedInvitations?: Invitation[];
}

export default function ClientAppointments({ clientId, completedInvitations = [] }: ClientAppointmentsProps) {
  const [showAppointments, setShowAppointments] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const { toast } = useToast();

  // Fetch client's appointments
  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ['/api/appointments', clientId],
    queryFn: async () => {
      console.log(`ClientAppointments - Fetching appointments for client ${clientId}`);
      const response = await fetch(`/api/clients/${clientId}/appointments`);
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const data = await response.json();
      console.log(`ClientAppointments - Retrieved ${data.length} appointments`);
      return data as Appointment[];
    },
    enabled: showAppointments, // Only fetch when accordion is open
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Handler for scheduling appointment button
  const handleScheduleAppointment = (invitation: Invitation) => {
    setSelectedInvitation(invitation);
    setShowScheduler(true);
    window.scrollTo(0, 0); // Scroll to top to show scheduler
  };

  return (
    <>
      <Card className="border border-pink-100 shadow-sm">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-pink-50"
          onClick={() => setShowAppointments(!showAppointments)}
          aria-label={showAppointments ? "Hide appointments" : "Show appointments"}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-pink-500" />
            <CardTitle className="text-lg font-semibold text-pink-800">Your Appointments</CardTitle>
          </div>
          <div>
            {showAppointments ? (
              <ChevronUp className="h-5 w-5 text-pink-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-pink-500" />
            )}
          </div>
        </div>
        
        <CardContent className={`pt-4 ${showAppointments ? 'block' : 'hidden'}`}>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scheduler section (shown when scheduling) */}
              {showScheduler && selectedInvitation && (
                <div className="mb-6 border-b pb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-medium">Schedule New Appointment</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowScheduler(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <AppointmentScheduler 
                    invitation={selectedInvitation}
                    salonId={selectedInvitation.salonId}
                    clientId={clientId}
                  />
                </div>
              )}
              
              {/* Completed invitations that need appointments */}
              {completedInvitations.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h3 className="text-base font-medium text-pink-700">Ready to Schedule</h3>
                  {completedInvitations.map(invitation => (
                    <Card key={invitation.id} className="border border-amber-200 bg-amber-50">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{invitation.styleOption || 'Standard Service'}</p>
                            <p className="text-sm text-gray-600">
                              {invitation.salonName} • ${invitation.stylePrice || 45} • {invitation.styleDuration || 30} min
                            </p>
                            <Badge className="mt-2 bg-green-100 text-green-700 hover:bg-green-200">
                              Payment Completed
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            className="bg-pink-600 hover:bg-pink-700"
                            onClick={() => handleScheduleAppointment(invitation)}
                          >
                            Schedule Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Upcoming appointments */}
              <div>
                <h3 className="text-base font-medium text-pink-700 mb-3">Your Appointments</h3>
                
                {appointments && appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.map(appointment => (
                      <Card key={appointment.id} className="border border-gray-200">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <p className="font-medium">{appointment.styleName || 'Standard Service'}</p>
                              <Badge className={
                                appointment.status === 'confirmed' 
                                  ? 'bg-green-100 text-green-700' 
                                  : appointment.status === 'cancelled'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              }>
                                {appointment.status === 'confirmed' ? 'Confirmed' : 
                                 appointment.status === 'cancelled' ? 'Cancelled' : 
                                 appointment.status}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600 gap-1">
                              <CalendarIcon className="h-3.5 w-3.5 text-pink-400" />
                              <span>{formatDate(appointment.serviceDate)}</span>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600 gap-1">
                              <Clock className="h-3.5 w-3.5 text-pink-400" />
                              <span>{appointment.serviceTime}</span>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600 gap-1">
                              <Scissors className="h-3.5 w-3.5 text-pink-400" />
                              <span>{appointment.salonName || 'Salon'}</span>
                            </div>
                            
                            {appointment.notes && (
                              <p className="text-xs italic text-gray-500 mt-1 pt-1 border-t border-gray-100">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No appointments found.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {completedInvitations.length > 0 
                        ? 'Schedule an appointment from your completed invitations above.' 
                        : 'Complete an invitation to schedule an appointment.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}