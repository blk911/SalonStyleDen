/**
 * CompletedInvitationSummary Component
 * 
 * Displays a summary of completed/paid invitations and provides scheduling options 
 * for clients to set appointments with the salon.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CalendarCheck, SquareCheckBig } from 'lucide-react';
import { format } from 'date-fns';
import AppointmentScheduler from "@/components/appointments/AppointmentScheduler";

interface Invitation {
  id: number;
  name: string;
  salonId: number;
  salonName?: string;
  styleOption?: string;
  status: string;
  price?: string;
  firstServiceDate?: string;
  createdAt: string;
}

interface CompletedInvitationSummaryProps {
  invitation: Invitation;
  onAppointmentUpdate?: () => void;
}

export function CompletedInvitationSummary({ 
  invitation,
  onAppointmentUpdate
}: CompletedInvitationSummaryProps) {
  const [showAppointmentScheduler, setShowAppointmentScheduler] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  const handleAppointmentSet = async (date: Date, timeSlot: string) => {
    setIsUpdating(true);
    
    try {
      // Format the date and time into a proper datetime string
      const dateTimeString = `${format(date, 'yyyy-MM-dd')}T${timeSlot.replace(' ', '')}`;
      
      // In a future implementation, this will make an API call to update the invitation
      // with the appointment date and time
      
      // For now, we'll simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Appointment Confirmed",
        description: `Your appointment has been scheduled for ${format(date, 'MMMM do')} at ${timeSlot}.`,
      });
      
      // Trigger the parent update callback if provided
      if (onAppointmentUpdate) {
        onAppointmentUpdate();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update your appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-amber-700">
            <SquareCheckBig className="h-5 w-5 text-green-600" />
            {invitation.firstServiceDate 
              ? "Your Upcoming Appointment" 
              : "Your Paid Service"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-100 rounded-md p-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-lg">{invitation.styleOption || "Nail Service"}</h3>
                  <p className="text-sm text-gray-600">at {invitation.salonName || "Tiffany 5280 Nails Studio"}</p>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Paid
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-green-100">
                {invitation.firstServiceDate ? (
                  <div className="flex items-center gap-2 text-gray-700">
                    <CalendarCheck className="h-4 w-4 text-green-600" />
                    <span>
                      Appointment: {format(new Date(invitation.firstServiceDate), 'MMMM do, yyyy - h:mm a')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    <span>No appointment scheduled yet</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                {invitation.firstServiceDate ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={() => setShowAppointmentScheduler(true)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Change Appointment
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => setShowAppointmentScheduler(true)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    SET APPOINTMENT
                  </Button>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-500 italic">
              Need to cancel or have questions? Please contact {invitation.salonName || "the salon"} directly.
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AppointmentScheduler
        invitationId={invitation.id}
        salonId={invitation.salonId}
        serviceType={invitation.styleOption || "Nail Service"}
        open={showAppointmentScheduler}
        onOpenChange={setShowAppointmentScheduler}
        onAppointmentSet={handleAppointmentSet}
        salonName={invitation.salonName}
      />
    </>
  );
}

export default CompletedInvitationSummary;