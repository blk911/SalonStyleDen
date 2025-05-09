import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useState, useEffect } from "react";
import { formatPhonePartial, cleanPhoneNumber } from "@/lib/utils";
import { RenderedInvitation } from "@/components/invitations/RenderedInvitation";
import { useToast } from "@/hooks/use-toast";

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
  // All React hooks must be called at the top level and in the same order on every render
  const [, setLocation] = useLocation();
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [isClientRegistered, setIsClientRegistered] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  console.log('[FLOW-DEBUG] PendingSalonInvitations component mounted with clientId:', clientId);
  
  // Construct the URL manually for better control and logging
  const buildQueryUrl = () => {
    const url = new URL('/api/invitations', window.location.origin);
    
    if (limit) url.searchParams.append('limit', limit.toString());
    if (clientId) url.searchParams.append('clientId', clientId.toString());
    url.searchParams.append('status', 'pending'); // Only get pending invitations
    
    return url.toString();
  };
  
  const queryUrl = buildQueryUrl();
  console.log('[FLOW-DEBUG] Query URL:', queryUrl);
  
  const { data: allInvitations, isLoading, isError, error } = useQuery({
    queryKey: ['/api/invitations', clientId, 'pending'],
    queryFn: async () => {
      console.log('[FLOW-DEBUG] Fetching pending invitations from:', queryUrl);
      try {
        const response = await fetch(queryUrl);
        
        if (!response.ok) {
          console.error('[FLOW-DEBUG] Failed to fetch invitations:', response.status, response.statusText);
          throw new Error(`Failed to fetch invitations: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[FLOW-DEBUG] Fetched invitations data:', data);
        return data as Invitation[];
      } catch (err) {
        console.error('[FLOW-DEBUG] Error in query function:', err);
        throw err;
      }
    }
  });
  
  // Debug the data that was returned
  useEffect(() => {
    if (allInvitations) {
      console.log(`[FLOW-DEBUG] Retrieved ${allInvitations.length} total invitations`);
      
      if (allInvitations.length > 0) {
        const phoneNumbers = allInvitations.map(inv => inv.phone);
        console.log('[FLOW-DEBUG] Phone numbers in invitations:', phoneNumbers);
        
        const statuses = allInvitations.map(inv => inv.status);
        console.log('[FLOW-DEBUG] Statuses in invitations:', statuses);
      }
    }
  }, [allInvitations]);
  
  // Filter to only include relevant invitations
  const invitations = allInvitations ? allInvitations.filter(invitation => {
    // For client dashboard, only show invitations TO this client, not FROM them
    // When clientId is provided, only show invitations where this client is NOT the sender
    if (clientId) {
      const isNotSender = invitation.senderId !== clientId;
      console.log(`[FLOW-DEBUG] Invitation ${invitation.id} - senderId: ${invitation.senderId}, clientId: ${clientId}, isNotSender: ${isNotSender}`);
      
      // For client dashboard, also check if the phone matches the client's phone
      // This is a temporary workaround until we have proper recipient tracking
      if (isNotSender) {
        return true;
      }
    }
    // In salon dashboards or other pages where no clientId is provided, show all invitations
    return true;
  }) : [];
  
  // Log filtered invitations
  useEffect(() => {
    if (invitations) {
      console.log(`[FLOW-DEBUG] Filtered to ${invitations.length} relevant invitations`);
    }
  }, [invitations]);

  // Function to check if a client is registered based on invitation data
  const checkClientRegistration = async (invitation: Invitation): Promise<boolean> => {
    try {
      console.log('[FLOW-DEBUG] Checking if client is registered for invitation:', invitation.id);
      
      // Clean phone number for comparison
      const cleanedPhone = cleanPhoneNumber(invitation.phone);
      console.log('[FLOW-DEBUG] Cleaned phone for registration check:', cleanedPhone);
      
      // Make a request to check if a client exists with this phone number
      const response = await fetch(`/api/clients?phone=${encodeURIComponent(cleanedPhone)}`);
      
      if (response.ok) {
        const clients = await response.json();
        console.log('[FLOW-DEBUG] Found clients with matching phone:', clients);
        
        const isRegistered = clients && clients.length > 0;
        console.log(`[FLOW-DEBUG] Client registration check result for invitation ${invitation.id}:`, isRegistered);
        
        if (isRegistered && clients[0]) {
          console.log('[FLOW-DEBUG] Matching client details:', {
            id: clients[0].id,
            name: clients[0].name,
            phone: clients[0].phone
          });
        }
        
        return isRegistered;
      }
      
      console.log(`[FLOW-DEBUG] Failed to check client registration for invitation ${invitation.id}:`, response.status);
      return false;
    } catch (error) {
      console.error('[FLOW-DEBUG] Error checking client registration:', error);
      return false;
    }
  };
  
  // Handle viewing an invitation
  const handleViewInvitation = async (invitation: Invitation) => {
    setSelectedInvitation(invitation);
    
    console.log('[FLOW-DEBUG] Viewing invitation details:', invitation);
    
    // Check if the client is registered
    const registered = await checkClientRegistration(invitation);
    setIsClientRegistered(registered);
    console.log('[FLOW-DEBUG] Is client registered?', registered);
    
    // Show the dialog after registration check
    setShowInvitationDialog(true);
  };
  
  // Handle updating invitation status
  const updateInvitationStatus = async (id: number, status: string) => {
    try {
      console.log(`[FLOW-DEBUG] Updating invitation ${id} status to ${status}`);
      
      const response = await fetch(`/api/invitations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update invitation status: ${response.status}`);
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/invitations'] });
      
      toast({
        title: "Success",
        description: `Invitation status updated to ${status}`,
      });
      
      return true;
    } catch (error) {
      console.error('[FLOW-DEBUG] Error updating invitation status:', error);
      
      toast({
        title: "Error",
        description: "Failed to update invitation status",
        variant: "destructive"
      });
      
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  
  if (isError) {
    console.error('[FLOW-DEBUG] Error loading invitations:', error);
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <p className="text-red-700 text-center text-sm">
          Error loading invitations. Please try again.
        </p>
      </Card>
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
                    `CLIENT INVITE: [${invitation.id}]` : 
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
                `${selectedInvitation?.sponsor} has sent you a VMB LTD invitation`}
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
                senderName={selectedInvitation.sponsor || "Your Stylist"}
                imageUrl={selectedInvitation.styleImageUrl || "/assets/french-tips.png"}
                salonInitiated={!selectedInvitation.senderId} // salonInitiated = true when no senderId (salon sent it)
                status={selectedInvitation.status} // Pass the invitation status
                onSendGift={isClientRegistered && 
                  selectedInvitation.status === 'pending' ? async () => {
                  // If client is registered and status allows sending gift, allow sending gift
                  setShowInvitationDialog(false);
                  if (selectedInvitation) {
                    try {
                      // First try to find client by phone
                      const cleanedPhone = cleanPhoneNumber(selectedInvitation.phone);
                      console.log('[FLOW-DEBUG] Finding client for phone:', cleanedPhone);
                      
                      const response = await fetch(`/api/clients?phone=${encodeURIComponent(cleanedPhone)}`);
                      if (response.ok) {
                        const clients = await response.json();
                        if (clients && clients.length > 0) {
                          console.log(`[FLOW-DEBUG] onSendGift: Found client ID ${clients[0].id} for invitation ${selectedInvitation.id}`);
                          
                          // Update the invitation status to "accepted"
                          await updateInvitationStatus(selectedInvitation.id, "accepted");
                          
                          setLocation(`/client/${clients[0].id}`);
                          return;
                        }
                      }
                      
                      // Fall back to invitation ID
                      console.log(`[FLOW-DEBUG] onSendGift: No client found for invitation ${selectedInvitation.id}, using invitation ID`);
                      setLocation(`/client/${selectedInvitation.id}`);
                    } catch (error) {
                      console.error("[FLOW-DEBUG] Error finding client for onSendGift:", error);
                      setLocation(`/client/${selectedInvitation.id}`);
                    }
                  }
                } : undefined} // Will show the button only if client is registered and invitation status allows gift sending
              />
            )}
            
            {/* Not registered message and register button */}
            {selectedInvitation && !isClientRegistered && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <h4 className="text-amber-800 font-medium mb-2">Registration Required</h4>
                <p className="text-sm text-gray-700 mb-3">
                  This client needs to be registered before completing this invitation process.
                </p>
                <Button 
                  onClick={() => {
                    setShowInvitationDialog(false);
                    // Navigate to client registration with the invite hash as a parameter
                    if (selectedInvitation) {
                      const registrationUrl = `/register?invitation=${selectedInvitation.inviteHash}`;
                      console.log('[FLOW-DEBUG] Navigating to registration:', registrationUrl);
                      setLocation(registrationUrl);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white w-full"
                >
                  Register Client
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Invitation #{selectedInvitation?.id}
            </div>
            
            {isClientRegistered ? (
              // Show this button only if client is registered
              <Button 
                onClick={async () => {
                  setShowInvitationDialog(false);
                  
                  // Navigate to the client dashboard using the client ID if possible
                  if (selectedInvitation) {
                    try {
                      // First try to find client by phone
                      const cleanedPhone = cleanPhoneNumber(selectedInvitation.phone);
                      
                      const response = await fetch(`/api/clients?phone=${encodeURIComponent(cleanedPhone)}`);
                      if (response.ok) {
                        const clients = await response.json();
                        if (clients && clients.length > 0) {
                          console.log(`[FLOW-DEBUG] Found client ID ${clients[0].id} for invitation ${selectedInvitation.id}`);
                          
                          // Update the invitation status to "accepted"
                          await updateInvitationStatus(selectedInvitation.id, "accepted");
                          
                          setLocation(`/client/${clients[0].id}`);
                          return;
                        }
                      }
                      // Fall back to invitation ID
                      console.log(`[FLOW-DEBUG] No client found for invitation ${selectedInvitation.id}, using invitation ID`);
                      setLocation(`/client/${selectedInvitation.id}`);
                    } catch (error) {
                      console.error("[FLOW-DEBUG] Error finding client for invitation:", error);
                      setLocation(`/client/${selectedInvitation.id}`);
                    }
                  }
                }}
                className={selectedInvitation?.senderId ? 
                  "bg-pink-600 hover:bg-pink-700 text-white" : 
                  "bg-amber-600 hover:bg-amber-700 text-white"}
              >
                View Client Dashboard
              </Button>
            ) : (
              // Close button if client is not registered
              <Button 
                onClick={() => {
                  setShowInvitationDialog(false);
                }}
                variant="outline"
              >
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}