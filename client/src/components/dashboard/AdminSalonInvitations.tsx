import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RenderedInvitation } from "@/components/invitations/RenderedInvitation";
import { 
  UserIcon, 
  CalendarIcon, 
  ClockIcon, 
  ExternalLinkIcon,
  PhoneIcon
} from "lucide-react";

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  message?: string | null;
  notes?: string | null;
  type?: string | null;
  salonId: number | null;
  senderId?: number | null;
  sponsor: string | null;
  status: string;
  inviteHash: string;
  createdAt: string;
  firstServiceDate?: string;
  // Added fields for style selection
  styleOption?: string;
  stylePrice?: number;
  styleDuration?: number;
  styleImageUrl?: string;
}

export default function AdminSalonInvitations() {
  const [, setLocation] = useLocation();
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  
  // Fetch all salon-to-client invitations (where senderId is null)
  const { data: invitations, isLoading } = useQuery({
    queryKey: ['/api/invitations/salon-to-client'],
    queryFn: async () => {
      const response = await fetch('/api/invitations');
      if (!response.ok) throw new Error('Network response was not ok');
      
      const allInvites = await response.json() as Invitation[];
      // Filter for salon-initiated invitations (no senderId)
      return allInvites.filter(invite => invite.senderId === null);
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <Card className="p-4 bg-amber-50 border-amber-100">
        <p className="text-gray-500 italic text-center text-sm">
          No salon-to-client invitations found.
        </p>
      </Card>
    );
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: '2-digit',
      year: '2-digit' 
    }).format(date);
  };

  // Format phone for display (partial hiding)
  const formatPhonePartial = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-****`;
    }
    return phone;
  };

  // Handle viewing an invitation
  const handleViewInvitation = (invitation: Invitation) => {
    setSelectedInvitation(invitation);
    setShowInvitationDialog(true);
  };

  return (
    <ScrollArea className="h-[400px]">
      <div className="grid grid-cols-1 gap-3 pr-4">
        {invitations.map(invitation => (
        <Card 
          key={invitation.id} 
          className="border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all duration-200"
        >
          <CardContent className="p-3 relative">
            <div className="flex flex-row justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-amber-500" />
                <span className="font-medium">{invitation.name}</span>
                <Badge className="bg-amber-100 text-amber-700">
                  {`SALON INVITE: [${invitation.id}]`}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                onClick={() => handleViewInvitation(invitation)}
              >
                <ExternalLinkIcon className="h-3.5 w-3.5 mr-1" />
                View
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3 text-amber-400" />
                <span>Sent: {formatDate(invitation.createdAt)}</span>
              </div>
              
              {invitation.firstServiceDate && (
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3 text-amber-400" />
                  <span>Appointment: {formatDate(invitation.firstServiceDate)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <PhoneIcon className="h-3 w-3 text-amber-400" />
                <span>{formatPhonePartial(invitation.phone)}</span>
              </div>
            </div>
            
            {invitation.sponsor && (
              <div className="text-xs text-gray-500 mt-1">
                <span>From: {invitation.sponsor}</span>
              </div>
            )}
            
            {invitation.notes && (
              <div className="text-xs italic text-gray-600 mt-2 border-t border-gray-100 pt-1">
                "{invitation.notes.substring(0, 100)}..."
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      </div>

      {/* Rendered Invitation Dialog */}
      <Dialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Salon Invitation Details</DialogTitle>
            <DialogDescription>
              {selectedInvitation?.sponsor} has sent this invitation
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedInvitation && (
              <RenderedInvitation
                inviteId={selectedInvitation.inviteHash || `inv-${selectedInvitation.id}`}
                recipientName={selectedInvitation.name}
                styleOption={selectedInvitation.styleOption || "Selected Style"}
                price={selectedInvitation.stylePrice ? `$${selectedInvitation.stylePrice}` : "$45"}
                time={selectedInvitation.styleDuration ? `${selectedInvitation.styleDuration} min` : "30 min"}
                senderName={selectedInvitation.sponsor || "Your Stylist"}
                imageUrl={selectedInvitation.styleImageUrl || "/assets/french-tips.png"}
                salonInitiated={true} // salon-to-client invitations
              />
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Invitation #{selectedInvitation?.id}
            </div>
            <Button 
              onClick={() => {
                setShowInvitationDialog(false);
                
                // Navigate to the full invitation page with preview mode
                if (selectedInvitation) {
                  setLocation(`/invitation/${selectedInvitation.inviteHash}?view=preview&prefill=true`);
                }
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              View Complete Invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}