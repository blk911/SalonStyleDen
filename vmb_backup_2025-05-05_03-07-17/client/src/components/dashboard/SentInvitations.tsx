// Component: SentInvitations - Displays invitations sent by a client
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ExternalLinkIcon, PhoneIcon, CalendarIcon, ClockIcon, GiftIcon, UserIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RenderedInvitation } from "@/components/invitations/RenderedInvitation";

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string | null;
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

interface SentInvitationsProps {
  clientId?: number;
  limit?: number;
}

export default function SentInvitations({ 
  clientId, 
  limit = 5
}: SentInvitationsProps) {
  // All React hooks must be called at the top level and in the same order on every render
  const [, setLocation] = useLocation();
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  
  const filterParams = new URLSearchParams();
  if (limit) filterParams.set('limit', limit.toString());
  if (clientId) filterParams.set('clientId', clientId.toString());
  
  const { data: allInvitations, isLoading } = useQuery({
    queryKey: ['/api/invitations', clientId, limit],
    queryFn: async () => {
      console.log('[SentInvitations] Fetching invitations with params:', filterParams.toString());
      const response = await fetch(`/api/invitations?${filterParams}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      console.log('[SentInvitations] Retrieved invitations:', data);
      return data as Invitation[];
    }
  });
  
  // Filter to only include invitations sent BY this client
  const invitations = allInvitations ? allInvitations.filter(invitation => 
    // Include only invitations where this client is the sender
    invitation.senderId === clientId
  ) : [];
  
  // Handle viewing an invitation
  const handleViewInvitation = async (invitation: Invitation) => {
    setSelectedInvitation(invitation);
    setShowInvitationDialog(true);
  };

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
      <Card className="p-4 bg-pink-50 border-pink-100">
        <p className="text-gray-500 italic text-center text-sm">
          You haven't sent any invitations yet.
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

  return (
    <div className="grid grid-cols-1 gap-3">
      {invitations.map(invitation => (
        <Card 
          key={invitation.id} 
          className="border border-pink-100 hover:border-pink-300 hover:shadow-md transition-all duration-200"
        >
          <CardContent className="p-3 relative">
            <div className="flex flex-row justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-pink-500" />
                <span className="font-medium">{invitation.name}</span>
                <Badge className="bg-pink-100 text-pink-700">
                  {invitation.type === "salon_owner_invitation" ? 
                    `SALON INVITE: [${invitation.id}]` : 
                    `FRIEND INVITE: [${invitation.id}]`}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 border-pink-200 text-pink-700 hover:bg-pink-50"
                onClick={() => handleViewInvitation(invitation)}
              >
                <ExternalLinkIcon className="h-3.5 w-3.5 mr-1" />
                View
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3 text-pink-400" />
                <span>Sent: {formatDate(invitation.createdAt)}</span>
              </div>
              
              {invitation.firstServiceDate && (
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-3 w-3 text-pink-400" />
                  <span>Appointment: {formatDate(invitation.firstServiceDate)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <PhoneIcon className="h-3 w-3 text-pink-400" />
                <span>{formatPhonePartial(invitation.phone)}</span>
              </div>
              
              {invitation.styleOption && (
                <div className="flex items-center gap-1">
                  <GiftIcon className="h-3 w-3 text-pink-400" />
                  <span>Style: {invitation.styleOption}</span>
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500 mt-1">
              <span>Status: <span className="font-medium capitalize">{invitation.status}</span></span>
            </div>
            
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
              Your Invitation to {selectedInvitation?.name}
            </DialogTitle>
            <DialogDescription>
              You sent this invitation on {selectedInvitation?.createdAt && formatDate(selectedInvitation.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {selectedInvitation && (
              <RenderedInvitation
                inviteId={selectedInvitation.inviteHash || `inv-${selectedInvitation.id}`}
                recipientName={selectedInvitation.name}
                styleOption={selectedInvitation.styleOption || ""}
                price={selectedInvitation.stylePrice ? `$${selectedInvitation.stylePrice}` : "$45"}
                time={selectedInvitation.styleDuration ? `${selectedInvitation.styleDuration} min` : "30 min"}
                senderName="You"
                imageUrl={selectedInvitation.styleImageUrl || "/assets/french-tips.png"}
                salonInitiated={false}
                status={selectedInvitation.status}
                onSendGift={undefined} // No need to show the send gift button for sent invitations
              />
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Invitation #{selectedInvitation?.id}
            </div>
            
            <Button 
              onClick={() => setShowInvitationDialog(false)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}