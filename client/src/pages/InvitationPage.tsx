import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PhoneIcon, MailIcon, CalendarIcon, UserIcon, ClockIcon, BuildingIcon, CheckCircleIcon } from "lucide-react";
import { VmbStyleOptions } from "@/components/promos/VmbStyleOptions";
import { useToast } from "@/hooks/use-toast";

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  message?: string | null;
  type?: string | null;
  notes?: string;
  favoriteServices?: string[];
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
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="shadow-sm">
          <CardHeader className="bg-pink-50 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl text-pink-700">Invitation for {invitation.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <CardDescription>From {invitation.sponsor || invitation.salonName || "Unknown Salon"}</CardDescription>
                  
                  {invitation.type === 'client_invitation' && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      Client Referral
                    </Badge>
                  )}
                </div>
              </div>
              <Badge className={`
                ${invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                ${invitation.status === 'accepted' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                ${invitation.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
              `}>
                {invitation.status || 'pending'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left column - Invitation details */}
              <div>
                <h3 className="text-lg font-medium mb-4">Invitation Details</h3>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{invitation.name}</span>
                  </div>

                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{formatPhone(invitation.phone)}</span>
                  </div>

                  <div className="flex items-center">
                    <MailIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{invitation.email}</span>
                  </div>

                  {invitation.firstServiceDate && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                      <span>First Service Date: {new Date(invitation.firstServiceDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Sent: {new Date(invitation.createdAt).toLocaleDateString()}</span>
                  </div>

                  {invitation.inviteHash && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500">Invitation ID: {invitation.inviteHash}</span>
                    </div>
                  )}
                </div>

                {invitation.message && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <h4 className="font-medium mb-2">Message</h4>
                    <div className="bg-pink-50 p-4 rounded-md text-gray-700 italic border border-pink-100">
                      "{invitation.message}"
                    </div>
                    
                    {invitation.type === 'client_invitation' && (
                      <Badge className="mt-2 bg-blue-100 text-blue-700">
                        Client Referral
                      </Badge>
                    )}
                  </div>
                )}
                
                {invitation.notes && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <p className="text-gray-700">{invitation.notes}</p>
                  </div>
                )}
              </div>

              {/* Right column - Salon details and actions */}
              <div>
                {salonLoading ? (
                  <p>Loading salon information...</p>
                ) : salon ? (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Salon Information</h3>

                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                      <div className="flex items-center mb-2">
                        <BuildingIcon className="h-5 w-5 mr-2 text-blue-600" />
                        <h4 className="font-medium text-blue-700">{salon.name}</h4>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p>Owner: {salon.ownerName}</p>
                        <p>Phone: {formatPhone(salon.phone)}</p>
                        <p>Email: {salon.email}</p>
                      </div>

                      {salon.socialMedia && salon.socialMedia.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-100 flex flex-wrap gap-2">
                          {salon.socialMedia.map((social, idx) => (
                            <Badge key={idx} variant="outline" className="bg-blue-100 border-blue-200 text-blue-700">
                              {social.platform}: {social.handle}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end items-center mt-8">
                      <Button 
                        variant="outline"
                        onClick={() => setLocation(`/salon/${salon.id}`)}
                      >
                        View Salon Page
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-500 text-center">No salon information available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Favorite Services */}
            {invitation.favoriteServices && invitation.favoriteServices.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-medium mb-4">Favorite Services</h3>
                <div className="flex flex-wrap gap-2">
                  {invitation.favoriteServices.map((service, idx) => (
                    <Badge key={idx} className="bg-pink-100 text-pink-700 border-pink-200">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Salon style options if salon is available */}
            {salon && salon.services && salon.services.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-lg font-medium mb-4">Pick Your Next Ven Me, Baby! Gift</h3>
                <VmbStyleOptions 
                  services={salon.services} 
                  salonId={salon.id}
                  onSelectionComplete={(selection) => {
                    console.log("Style selected:", selection);
                    toast({
                      title: "Style Selected",
                      description: `You selected this style!`,
                      variant: "default"
                    });
                  }}
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-6">
            <Button 
              variant="ghost"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
            <Button 
              variant="default"
              className={`${
                invitation.status === 'completed' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-pink-600 hover:bg-pink-700'
              } ${
                invitation.status === 'pending' 
                  ? 'animate-pulse shadow-lg'  
                  : ''
              }`}
              onClick={promptAcceptInvitation}
              disabled={invitation.status === 'completed'}
            >
              {invitation.status === 'completed' 
                ? 'View Dashboard' 
                : 'Accept Invitation'}
            </Button>
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
          
          <div className="flex flex-col items-center py-4">
            <CheckCircleIcon className="h-16 w-16 text-pink-500 mb-4" />
            <p className="text-center mb-2">
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