import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  UserIcon, 
  CalendarIcon, 
  ClockIcon, 
  ExternalLinkIcon,
  GiftIcon,
  PhoneIcon,
  MailIcon
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { RenderedInvitation } from "@/components/invitations/RenderedInvitation";

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  message?: string | null;
  type?: string | null;
  salonId: number | null;
  senderId?: number | null;
  sponsor: string | null;
  status: string;
  inviteHash: string;
  createdAt: string;
  firstServiceDate?: string;
  // Added new fields for style selection
  styleOption?: string;
  stylePrice?: number;
  styleDuration?: number;
  styleImageUrl?: string;
}

interface PendingSalonInvitationsProps {
  clientId?: number;
  limit?: number;
}

export default function PendingSalonInvitations({ 
  clientId, 
  limit = 5
}: PendingSalonInvitationsProps) {
  const [, setLocation] = useLocation();
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  
  const filterParams = new URLSearchParams();
  if (limit) filterParams.set('limit', limit.toString());
  if (clientId) filterParams.set('clientId', clientId.toString());
  filterParams.set('status', 'pending'); // Only get pending invitations
  
  const { data: invitations, isLoading } = useQuery({
    queryKey: ['/api/invitations/pending', clientId, limit],
    queryFn: async () => {
      const response = await fetch(`/api/invitations?${filterParams}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Invitation[]>;
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
          No pending salon invitations at this time.
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
    // Option 1: Show in a dialog (current implementation)
    setSelectedInvitation(invitation);
    setShowInvitationDialog(true);
    
    // Option 2: Direct to invitation page with preview mode
    // This would navigate directly to the invitation page with the preview mode
    // setLocation(`/invitation/${invitation.inviteHash}?view=preview&prefill=true`);
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {invitations.map(invitation => (
        <Card 
          key={invitation.id} 
          className={invitation.senderId ? 
            "border border-pink-100 hover:border-pink-300 hover:shadow-md transition-all duration-200" :
            "border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all duration-200"
          }
        >
          <CardContent className="p-3 relative">
            <div className="flex flex-row justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <UserIcon className={`h-4 w-4 ${invitation.senderId ? 'text-pink-500' : 'text-amber-500'}`} />
                <span className="font-medium">{invitation.name}</span>
                <Badge className={invitation.senderId ? 
                  "bg-pink-100 text-pink-700" : 
                  "bg-amber-100 text-amber-700"
                }>
                  {invitation.senderId ? 
                    `[${invitation.id}] Ven Me, Baby! Gift Request Form` : 
                    `SALON INVITE: [${invitation.id}]`}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className={`h-8 px-2 ${
                  invitation.senderId ? 
                  'border-pink-200 text-pink-700 hover:bg-pink-50' : 
                  'border-amber-200 text-amber-700 hover:bg-amber-50'
                }`}
                onClick={() => handleViewInvitation(invitation)}
              >
                <ExternalLinkIcon className="h-3.5 w-3.5 mr-1" />
                View
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <div className="flex items-center gap-1">
                <CalendarIcon className={`h-3 w-3 ${invitation.senderId ? 'text-pink-400' : 'text-amber-400'}`} />
                <span>Sent: {formatDate(invitation.createdAt)}</span>
              </div>
              
              {invitation.firstServiceDate && (
                <div className="flex items-center gap-1">
                  <ClockIcon className={`h-3 w-3 ${invitation.senderId ? 'text-pink-400' : 'text-amber-400'}`} />
                  <span>Appointment: {formatDate(invitation.firstServiceDate)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <PhoneIcon className={`h-3 w-3 ${invitation.senderId ? 'text-pink-400' : 'text-amber-400'}`} />
                <span>{formatPhonePartial(invitation.phone)}</span>
              </div>
              
              {invitation.styleOption && (
                <div className="flex items-center gap-1">
                  <GiftIcon className={`h-3 w-3 ${invitation.senderId ? 'text-pink-400' : 'text-amber-400'}`} />
                  <span>Style: {invitation.styleOption}</span>
                </div>
              )}
            </div>
            
            {invitation.sponsor && (
              <div className="text-xs text-gray-500 mt-1">
                <span>From: {invitation.sponsor}</span>
              </div>
            )}
            
            {invitation.message && (
              <div className="text-xs italic text-gray-600 mt-2 border-t border-gray-100 pt-1">
                "{invitation.message}"
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Rendered Invitation Dialog */}
      <Dialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedInvitation?.senderId ? 
                "Gift Request Details" : 
                "Salon Invitation Details"}
            </DialogTitle>
            <DialogDescription>
              {selectedInvitation?.senderId ?
                `You created this gift request for ${selectedInvitation?.name}` :
                `${selectedInvitation?.sponsor} has sent you a Ven Me, Baby! invitation`}
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
                salonInitiated={!selectedInvitation.senderId} // salonInitiated = true when no senderId (salon sent it)
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
                  setLocation(`/invitation-preview/${selectedInvitation.inviteHash}`);
                }
              }}
              className={selectedInvitation?.senderId ? 
                "bg-pink-600 hover:bg-pink-700 text-white" : 
                "bg-amber-600 hover:bg-amber-700 text-white"}
            >
              {selectedInvitation?.senderId ? 
                "View Complete Gift Request" : 
                "View Complete Invitation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}