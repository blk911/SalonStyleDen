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
  message: string;
  status: string;
  type: string;
  createdAt: string;
  senderId?: number;
  salonId?: number;
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
  filterParams.set('status', 'pending'); // Only get pending invitations
  filterParams.set('type', 'sent'); // Only get sent invitations
  
  const { data: invitations, isLoading } = useQuery({
    queryKey: ['/api/invitations/sent', clientId, limit],
    queryFn: async () => {
      const response = await fetch(`/api/invitations?${filterParams}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json() as Promise<Invitation[]>;
    }
  });
  
  // Check client registration status
  const checkClientRegistration = async (invitation: Invitation): Promise<boolean> => {
    try {
      // Check if client is already registered
      const response = await fetch(`/api/clients/check-registration?phone=${encodeURIComponent(invitation.phone)}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return data.registered;
    } catch (error) {
      console.error('Error checking client registration:', error);
      return false;
    }
  };
  
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
                  {`CLIENT INVITE: [${invitation.id}]`}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-pink-600 border-pink-200 hover:bg-pink-50"
                onClick={() => handleViewInvitation(invitation)}
              >
                <span className="hidden sm:inline mr-1">View</span>
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            <div className="text-xs text-gray-500 mt-1">
              <div className="flex items-center">
                <CalendarIcon className="h-3 w-3 mr-1" />
                <span className="font-medium">Sent: </span>
                <span className="ml-1">{formatDate(invitation.createdAt)}</span>
              </div>
              
              <div className="flex items-center mt-1">
                <PhoneIcon className="h-3 w-3 mr-1" />
                <span className="font-medium">Phone: </span>
                <span className="ml-1">{formatPhonePartial(invitation.phone)}</span>
              </div>
              
              {invitation.email && (
                <div className="flex items-center mt-1">
                  <MailIcon className="h-3 w-3 mr-1" />
                  <span className="font-medium">Email: </span>
                  <span className="ml-1">{invitation.email.slice(0, 3)}****@{invitation.email.split('@')[1]}</span>
                </div>
              )}
            </div>
            
            <div className="text-xs mt-2 border-t border-gray-100 pt-2">
              <span className="font-medium text-gray-600">From: </span>
              <span className="text-gray-500">You</span>
            </div>
            
            {invitation.message && (
              <div className="mt-2 text-xs text-gray-600 italic border-t border-gray-100 pt-2">
                "{invitation.message}"
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {/* Invitation View Dialog */}
      <Dialog open={showInvitationDialog} onOpenChange={setShowInvitationDialog}>
        <DialogContent className="max-w-md">
          {selectedInvitation && (
            <>
              <DialogHeader>
                <DialogTitle>Invitation to {selectedInvitation.name}</DialogTitle>
                <DialogDescription>
                  Sent on {new Date(selectedInvitation.createdAt).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              
              <RenderedInvitation 
                inviteId={selectedInvitation.id.toString()}
                recipientName={selectedInvitation.name}
                styleOption={selectedInvitation.type === "style_option" ? selectedInvitation.type : "Style Option"}
                senderName="You"
                salonInitiated={false}
                status={selectedInvitation.status}
              />
              
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowInvitationDialog(false)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}