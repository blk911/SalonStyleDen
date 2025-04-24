import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PhoneIcon, MailIcon, CalendarIcon, UserIcon, ClockIcon, BuildingIcon, CheckCircleIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react";
import { VmbStyleOptions } from "@/components/promos/VmbStyleOptions";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  message?: string | null;
  type?: string | null;
  notes?: string;
  favoriteServices?: string[] | undefined;
  salonId?: number;
  senderId?: number | null;
  salonName?: string;
  sponsor?: string;
  status?: string;
  firstServiceDate?: string;
  createdAt: string;
  inviteHash: string;
}

interface Salon {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  socialMedia?: Array<{platform: string, handle: string}>;
  services?: Array<any>;
}

export default function InvitationPage() {
  const { hash } = useParams();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Parse query parameters to determine view mode and prefill status
  const isCompleteView = location.includes('complete=true');
  const isPreviewView = location.includes('view=preview');
  const shouldPrefill = location.includes('prefill=true');
  
  // State for section visibility with localStorage persistence
  const [styleSectionOpen, setStyleSectionOpen] = useState(() => {
    // If this is a preview view, we want steps 1 and 2 to be closed
    if (isPreviewView) {
      return false;
    }
    const saved = localStorage.getItem('vmb-invite-style-section-open');
    return saved ? JSON.parse(saved) : true; // Default to open for better UX
  });
  
  // For preview mode, we want to skip to step 3
  const [showStep3, setShowStep3] = useState(isPreviewView);
  
  // Save section state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('vmb-invite-style-section-open', JSON.stringify(styleSectionOpen));
  }, [styleSectionOpen]);

  // Format phone number for display
  const formatPhone = (phone: string) => {
    if (!phone) return "";

    // Simple US phone formatting
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Fetch invitation by hash
  const { 
    data: invitation,
    isLoading: invitationLoading,
    error: invitationError
  } = useQuery<Invitation>({
    queryKey: ['/api/invitations/by-hash', hash],
    queryFn: async () => {
      const response = await fetch(`/api/invitations/by-hash/${hash}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch invitation: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!hash,
  });

  // Fetch salon if invitation has a salonId
  const { 
    data: salon,
    isLoading: salonLoading
  } = useQuery<Salon>({
    queryKey: ['/api/salons', invitation?.salonId],
    queryFn: async () => {
      const response = await fetch(`/api/salons/${invitation?.salonId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch salon: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!invitation?.salonId,
  });

  // Show confirmation dialog for pending invitations
  const promptAcceptInvitation = () => {
    if (invitation?.status === 'pending') {
      setShowConfirmDialog(true);
    } else {
      handleAcceptInvitation();
    }
  };

  // Handle accept invitation or view dashboard
  const handleAcceptInvitation = async () => {
    setShowConfirmDialog(false);
    
    if (!invitation || !invitation.id) {
      toast({
        title: "Error",
        description: "There was a problem with this invitation.",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, try to find if client already exists with this phone number
      console.log(`Checking if client with phone ${invitation.phone} already exists...`);
      const clientResponse = await fetch(`/api/clients?phone=${encodeURIComponent(invitation.phone)}`);
      
      // If we found a client, go directly to dashboard regardless of invitation status
      if (clientResponse.ok) {
        const clients = await clientResponse.json();
        
        if (clients && clients.length > 0) {
          const clientId = clients[0].id;
          
          // Update invitation to completed if it's not already
          if (invitation.status !== 'completed') {
            try {
              await fetch(`/api/invitations/${invitation.id}/status`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'completed' })
              });
              
              toast({
                title: "Account Found",
                description: "Your account is already registered. Redirecting to your dashboard.",
                variant: "default"
              });
            } catch (error) {
              console.error('Error updating invitation status:', error);
            }
          }
          
          // Go directly to client dashboard
          console.log(`Client found with ID ${clientId}, redirecting to dashboard`);
          setLocation(`/client/${clientId}`);
          return;
        }
      }
      
      // No client exists yet, handle the invitation based on status
      
      // If the invitation is already accepted or completed, go to registration
      if (invitation.status === 'accepted' || invitation.status === 'completed') {
        // Go directly to registration
        setLocation(`/client/register?salonId=${invitation.salonId}&invitationId=${invitation.id}`);
        return;
      }
      
      // For pending invitations, update the status to 'accepted' first
      if (invitation.status === 'pending') {
        // Update invitation status to accepted
        const updateResponse = await fetch(`/api/invitations/${invitation.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'accepted' })
        });
        
        if (!updateResponse.ok) {
          throw new Error('Failed to update invitation status');
        }
        
        // Show toast notification
        toast({
          title: "Invitation Accepted",
          description: "Your invitation has been accepted. Please complete your registration.",
          variant: "default"
        });
      }
      
      // Direct to registration page with the invitation data
      setLocation(`/client/register?salonId=${invitation.salonId}&invitationId=${invitation.id}`);
      
    } catch (error) {
      console.error('Error in invitation acceptance flow:', error);
      toast({
        title: "Error",
        description: "There was a problem processing your invitation. Please try again.",
        variant: "destructive"
      });
      
      // Go to registration as fallback
      setLocation(`/client/register?salonId=${invitation.salonId}&invitationId=${invitation.id}`);
    }
  };

  // Loading state
  if (invitationLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p>Loading invitation details...</p>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (invitationError || !invitation) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-red-500 mb-2">Invitation Not Found</h2>
                <p>The invitation you're looking for doesn't exist or has expired.</p>
                <Button 
                  className="mt-6"
                  onClick={() => setLocation('/')}
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-0.5">
        <Card className="shadow-sm">
          <CardHeader className={`${invitation.senderId ? 'bg-pink-50' : 'bg-amber-50'} pb-0.5`}>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className={`text-2xl ${invitation.senderId ? 'text-pink-700' : 'text-amber-700'}`}>
                  {invitation.senderId ? 
                    `Ven Me, Baby! Gift Request for ${invitation.name}` : 
                    `Salon Invitation for ${invitation.name}`}
                </CardTitle>
                <div className="flex items-center justify-between gap-4 mt-0.5">
                  <CardDescription>From {invitation.sponsor || invitation.salonName || "Unknown Salon"}</CardDescription>
                  
                  {invitation.type === 'client_invitation' && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      Client Referral
                    </Badge>
                  )}
                  
                  {salon && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-pink-300 text-pink-700 hover:bg-pink-50" 
                      onClick={() => setLocation(`/salon/${salon.id}`)}
                    >
                      View Salon Page
                    </Button>
                  )}
                </div>
              </div>
              <Badge className={`
                ${invitation.senderId ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-amber-100 text-amber-700 border-amber-200'}
              `}>
                {invitation.senderId ? 
                  `[${invitation.id}] Ven Me, Baby! Gift Request Form` : 
                  `Salon Invite; ${invitation.name} [${invitation.id}]`}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0.5">
            {/* VMB Style Options Collapsible Section */}
            {salon && salon.services && salon.services.length > 0 && (
              <div className="mt-0.5">
                <div className="rounded-md overflow-hidden mb-0.5">
                  <Collapsible open={styleSectionOpen} onOpenChange={setStyleSectionOpen}>
                    <div className={`${invitation.senderId ? 'bg-pink-50' : 'bg-amber-50'} px-4 py-0.5 rounded-t-md`}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between">
                        <h3 className={`text-lg font-medium ${invitation.senderId ? 'text-pink-700' : 'text-amber-700'}`}>
                          {invitation.senderId ? 'Ven Me, Baby! Style Options' : 'Salon Style Selection'}
                        </h3>
                        <div className={`h-8 w-8 flex items-center justify-center ${invitation.senderId ? 'text-pink-700' : 'text-amber-700'}`}>
                          {styleSectionOpen ? (
                            <ChevronUpIcon className="h-5 w-5" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                    </div>
                    
                    <CollapsibleContent className={`bg-white px-4 py-0.5 border ${invitation.senderId ? 'border-pink-100' : 'border-amber-100'} rounded-b-md`}>
                      <VmbStyleOptions 
                        services={salon.services} 
                        salonId={salon.id}
                        salonInitiated={!invitation.senderId} // TRUE for salon-to-client (senderId null)
                        recipientData={{
                          name: invitation.name,
                          phone: invitation.phone,
                          sponsor: invitation.sponsor || salon.name
                        }}
                        onSelectionComplete={(selection) => {
                          console.log("Style selected:", selection);
                          toast({
                            title: "Style Selected",
                            description: `You selected this style!`,
                            variant: "default"
                          });
                        }}
                        // Set the initial style selection if viewing a pending invitation
                        initialStyleId={(() => {
                          // Complex logic moved to an IIFE to avoid TSLint errors
                          if (!invitation || !salon || !salon.services) return undefined;
                          // Safely check favoriteServices
                          const favServices = invitation.favoriteServices;
                          if (!favServices || !Array.isArray(favServices) || favServices.length === 0) return undefined;
                          // Find the matching service
                          const foundService = salon.services.find(s => s.name === favServices[0]);
                          return foundService?.id;
                        })()}
                        isPreviewMode={isPreviewView}
                        shouldPrefill={shouldPrefill}
                        prefilledServices={(() => {
                          if (!invitation) return [];
                          const favServices = invitation.favoriteServices;
                          return (favServices && Array.isArray(favServices)) ? favServices : [];
                        })()}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t pt-0.5">
            {/* Go Back and Accept Invitation buttons have been removed */}
          </CardFooter>
        </Card>
      </main>
      <Footer />
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-pink-700">Accept Invitation</DialogTitle>
            <DialogDescription className="text-center">
              You're about to accept an invitation from {invitation.sponsor || invitation.salonName || "a salon"}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-0.5">
            <CheckCircleIcon className="h-16 w-16 text-pink-500 mb-0.5" />
            <p className="text-center mb-0.5">
              This invitation can only be accepted once. After acceptance, you'll be directed to complete your registration.
            </p>
            {invitation.firstServiceDate && (
              <div className="mt-2 p-3 bg-pink-50 rounded-md w-full text-center">
                <p className="text-sm font-medium">Your first service date is scheduled for:</p>
                <p className="text-pink-700 font-bold">{new Date(invitation.firstServiceDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-pink-600 hover:bg-pink-700"
              onClick={handleAcceptInvitation}
            >
              Accept & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}