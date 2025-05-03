import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import AppointmentScheduler from './AppointmentScheduler';
import { Invitation } from '@/types';

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

interface ClientAppointmentsProps {
  clientId: number;
  completedInvitations?: Invitation[];
}

export default function ClientAppointments({ clientId, completedInvitations = [] }: ClientAppointmentsProps) {
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);

  // Fetch client appointments
  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: [`/api/clients/${clientId}/appointments`],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/appointments`);
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      return response.json() as Promise<Appointment[]>;
    }
  });

  const handleScheduleClick = (invitation: Invitation) => {
    setSelectedInvitation(invitation);
    setShowScheduler(true);
  };

  const handleAppointmentScheduled = () => {
    setShowScheduler(false);
    setSelectedInvitation(null);
    refetch();
  };

  // Filter invitations that don't already have appointments
  const invitationsWithoutAppointments = completedInvitations.filter(invitation => {
    // Check if we already have an appointment for this invitation
    return !appointments?.some(appt => appt.invitationId === invitation.id);
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const hasAppointments = appointments && appointments.length > 0;
  const hasInvitationsToSchedule = invitationsWithoutAppointments.length > 0;

  if (!hasAppointments && !hasInvitationsToSchedule && !showScheduler) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Your Appointments</CardTitle>
          <CardDescription>You don't have any appointments scheduled yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      <Accordion type="single" collapsible defaultValue="appointments" className="w-full">
        {hasAppointments && (
          <AccordionItem value="appointments">
            <AccordionTrigger className="font-serif text-lg">
              Your Appointments
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {appointments?.map((appointment) => (
                  <Card key={appointment.id} className="overflow-hidden">
                    <div className={`h-2 ${getStatusColor(appointment.status)}`} />
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            {appointment.styleName || 'Salon Visit'}
                            {' '}
                            <Badge variant={getStatusVariant(appointment.status)}>
                              {getStatusText(appointment.status)}
                            </Badge>
                          </h3>
                          <div className="mt-2 space-y-1 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{appointment.salonName || 'Salon'}</span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>
                                {format(parseISO(appointment.serviceDate), 'EEEE, MMMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{appointment.serviceTime}</span>
                            </div>
                            {appointment.notes && (
                              <div className="mt-2 text-xs text-muted-foreground italic">
                                Notes: {appointment.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {hasInvitationsToSchedule && (
          <AccordionItem value="schedule">
            <AccordionTrigger className="font-serif text-lg">
              Schedule New Appointments
            </AccordionTrigger>
            <AccordionContent>
              {showScheduler && selectedInvitation ? (
                <AppointmentScheduler 
                  invitation={selectedInvitation} 
                  clientId={clientId} 
                  onScheduled={handleAppointmentScheduled} 
                />
              ) : (
                <div className="space-y-4">
                  {invitationsWithoutAppointments.map((invitation) => (
                    <Card key={invitation.id} className="overflow-hidden">
                      <div className="h-2 bg-primary" />
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">
                              {invitation.styleOption || 'Salon Service'}
                              {invitation.styleDuration ? ` (${invitation.styleDuration} min)` : ''}
                            </h3>
                            <div className="mt-1 space-y-1 text-sm">
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{invitation.salonName || 'Salon'}</span>
                              </div>
                              {invitation.stylePrice && (
                                <div className="text-muted-foreground">
                                  Price: ${(invitation.stylePrice / 100).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleScheduleClick(invitation)}
                            className="mt-2"
                          >
                            Schedule
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}

// Helper functions
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'bg-blue-500';
    case 'completed':
      return 'bg-green-500';
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-gray-300';
  }
}

function getStatusVariant(status: string): 'default' | 'destructive' | 'outline' | 'secondary' | 'success' {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'secondary';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getStatusText(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'Confirmed';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}