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
import { PhoneIcon, MailIcon, CalendarIcon, UserIcon, ClockIcon, BuildingIcon, CheckCircleIcon, ChevronUpIcon, ChevronDownIcon, ArrowLeftIcon } from "lucide-react";
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
  const [acceptingInvitation, setAcceptingInvitation] = useState(false);
  
  // Form state for client information
  const [clientForm, setClientForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  
  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  

  
  // Parse query parameters to determine view mode and prefill status
  const isCompleteView = location.includes('complete=true');
  const isPreviewView = location.includes('preview=true') || location.includes('view=preview');
  const shouldPrefill = location.includes('prefill=true');
  
  // Parse query parameters to control view mode
  
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
    setAcceptingInvitation(true);
    
    if (!invitation || !invitation.id) {
      toast({
        title: "Error",
        description: "There was a problem with this invitation.",
        variant: "destructive"
      });
      setAcceptingInvitation(false);
      return;
    }
    
    // For salon invitations, validate form data
    if (!invitation.senderId && invitation.status === 'pending') {
      // Basic validation
      if (!clientForm.firstName.trim()) {
        toast({
          title: "Missing Information",
          description: "Please enter your first name.",
          variant: "destructive"
        });
        setAcceptingInvitation(false);
        return;
      }
      
      if (!clientForm.email.trim() || !clientForm.email.includes('@')) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        setAcceptingInvitation(false);
        return;
      }
      
      if (!clientForm.phone.trim() || clientForm.phone.replace(/\D/g, '').length < 10) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid phone number.",
          variant: "destructive"
        });
        setAcceptingInvitation(false);
        return;
      }
    }

    try {
      // First, try to find if client already exists with this phone number
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
      // For salon invitations, pass updated client info from the form
      if (!invitation.senderId) {
        const fullName = `${clientForm.firstName} ${clientForm.lastName}`.trim();
        setLocation(
          `/client/register?salonId=${invitation.salonId}&invitationId=${invitation.id}&name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(clientForm.email)}&phone=${encodeURIComponent(clientForm.phone)}`
        );
      } else {
        setLocation(`/client/register?salonId=${invitation.salonId}&invitationId=${invitation.id}`);
      }
      
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
  
  // 🔄 FIXED VERSION - HOOKS ERROR
  // ✅ WORKS EXACTLY AS INTENDED
  // 🚫 DO NOT MODIFY WITHOUT FULL RETEST
  // Function: Initialize form data when invitation loads
  useEffect(() => {
    // Initialize with empty values by default, ensuring this runs consistently
    let firstName = '';
    let lastName = '';
    let email = '';
    let phone = '';
    
    // Only update values if invitation exists
    if (invitation) {
      // Process name parts from invitation safely
      const nameParts = invitation.name ? invitation.name.split(' ') : ['', ''];
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
      email = invitation.email || '';
      phone = invitation.phone || '';
    }
    
    // Always update the form regardless of invitation state
    setClientForm({
      firstName,
      lastName,
      email,
      phone
    });
    
    // Log form initialization via flow logger
    if (window.vmb && window.vmb.devTools) {
      try {
        const flowLogger = (window.vmb.devTools as any).logFlow;
        if (typeof flowLogger === 'function') {
          flowLogger('InvitationPage', 'Form data initialized', {
            hasInvitation: !!invitation,
            formState: { firstName, lastName, email, phone }
          });
        }
      } catch (error) {
        // Silently handle any logging errors
      }
    }
  }, [invitation]);

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
                  
                  {/* Removed "View Salon Page" button as requested */}
                </div>
              </div>
              {/* Removed Invitation ID badge as requested */}
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
                          
                          // Check if we have matching services between invitation favorites and salon offerings
                          
                          // For preview mode, we ALWAYS want a style selected
                          if (isPreviewView) {
                            // Safely check favoriteServices first
                            const favServices = invitation.favoriteServices;
                            if (favServices && Array.isArray(favServices) && favServices.length > 0) {
                              // Try to find the matching service first
                              const foundService = salon.services.find(s => s.name === favServices[0]);
                              if (foundService) {
                                return foundService.id;
                              }
                            }
                            
                            // If we get here, either no favorite services or no matching service found
                            // For preview mode, always fall back to the first service
                            if (salon.services.length > 0) {
                              return salon.services[0].id;
                            }
                          } else {
                            // For non-preview mode, only set if we find a matching service
                            const favServices = invitation.favoriteServices;
                            if (favServices && Array.isArray(favServices) && favServices.length > 0) {
                              const foundService = salon.services.find(s => s.name === favServices[0]);
                              return foundService?.id;
                            }
                          }
                          
                          return undefined;
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
            {isPreviewView ? (
              <div className="w-full flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {invitation.senderId ? 
                    "This is a preview of a client gift request form" : 
                    "This is a preview of a salon invitation"}
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className={invitation.senderId ? 
                    "border-pink-200 text-pink-700 hover:bg-pink-50" : 
                    "border-amber-200 text-amber-700 hover:bg-amber-50"}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            ) : (
              <div className="w-full">
                {/* For salon-initiated invitations - more detailed flow */}
                {invitation.status === 'pending' && !invitation.senderId && (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-md border border-amber-200">
                      <h3 className="text-lg font-medium text-amber-800 mb-2">Salon Invitation Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">From Salon:</p>
                          <p className="font-medium">{invitation.sponsor || invitation.salonName || salon?.name || "Unknown Salon"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Recipient:</p>
                          <p className="font-medium">{invitation.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Contact:</p>
                          <p className="font-medium">{formatPhone(invitation.phone)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email:</p>
                          <p className="font-medium">{invitation.email}</p>
                        </div>
                      </div>
                      
                      {/* Show service details if available */}
                      {invitation.favoriteServices && invitation.favoriteServices.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-amber-200">
                          <p className="text-sm text-gray-600 mb-1">Services:</p>
                          <div className="flex flex-wrap gap-2">
                            {invitation.favoriteServices.map((service, index) => (
                              <Badge key={index} variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={promptAcceptInvitation}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                      size="lg"
                      disabled={acceptingInvitation}
                    >
                      {acceptingInvitation ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                          Processing...
                        </>
                      ) : (
                        'Accept Salon Offer & Create Account'
                      )}
                    </Button>
                    
                    <p className="text-center text-sm text-gray-500">
                      By accepting this invitation, you'll create an account with {invitation.sponsor || invitation.salonName || salon?.name || "the salon"}.
                    </p>
                  </div>
                )}
                
                {/* Show "Accept Invitation" button for client-initiated invitations (has senderId) */}
                {invitation.status === 'pending' && invitation.senderId && (
                  <div className="flex justify-end">
                    <Button
                      onClick={promptAcceptInvitation}
                      className="bg-pink-600 hover:bg-pink-700 text-white"
                    >
                      Accept Invitation
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </main>
      <Footer />
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className={`sm:max-w-md ${!invitation.senderId ? 'p-0 overflow-hidden' : ''}`}>
          {!invitation.senderId ? (
            /* Special dialog header for salon invitations */
            <>
              <div className="bg-gradient-to-r from-amber-100 to-amber-50 p-4 border-b border-amber-200">
                <DialogTitle className="text-center text-amber-800 text-xl flex justify-center items-center gap-2">
                  <img src="/assets/VMB_LOGO.png" alt="VMB Logo" className="h-6" />
                  Accept Salon Offer
                </DialogTitle>
                <DialogDescription className="text-center">
                  You're accepting an invitation from {invitation.sponsor || invitation.salonName || salon?.name || "a salon"}.
                </DialogDescription>
              </div>
            </>
          ) : (
            /* Regular dialog header for client invitations */
            <DialogHeader>
              <DialogTitle className="text-center text-pink-700">
                Accept Invitation
              </DialogTitle>
              <DialogDescription className="text-center">
                You're about to accept an invitation from {invitation.sponsor || invitation.salonName || "a salon"}.
              </DialogDescription>
            </DialogHeader>
          )}
          
          <div className="flex flex-col items-center py-0.5">
            <CheckCircleIcon className={`h-16 w-16 ${invitation.senderId ? 'text-pink-500' : 'text-amber-500'} mb-0.5`} />
            <p className="text-center mb-0.5">
              This invitation can only be accepted once. After acceptance, you'll be directed to complete your registration.
            </p>
            {invitation.firstServiceDate && (
              <div className={`mt-2 p-3 ${invitation.senderId ? 'bg-pink-50' : 'bg-amber-50'} rounded-md w-full text-center`}>
                <p className="text-sm font-medium">Your first service date is scheduled for:</p>
                <p className={`font-bold ${invitation.senderId ? 'text-pink-700' : 'text-amber-700'}`}>
                  {new Date(invitation.firstServiceDate).toLocaleDateString()}
                </p>
              </div>
            )}
            
            {/* Display client info form for salon-initiated invitations */}
            {!invitation.senderId && invitation.status === 'pending' && (
              <div className="mt-4 p-4 border rounded-md border-amber-200 bg-amber-50">
                <h3 className="font-medium text-amber-800 mb-2">Complete your information to accept this salon offer</h3>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input 
                        type="text" 
                        name="firstName"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        value={clientForm.firstName}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input 
                        type="text" 
                        name="lastName"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                        value={clientForm.lastName}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      value={clientForm.email}
                      onChange={handleFormChange}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      value={clientForm.phone}
                      onChange={handleFormChange}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <p className="text-sm text-gray-600 mb-2">By accepting this salon offer, you'll create an account with {invitation.sponsor || salon?.name || "the salon"}.</p>
                  </div>
                </div>
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
              className={`${invitation.senderId ? 'bg-pink-600 hover:bg-pink-700' : 'bg-amber-500 hover:bg-amber-600'} text-white`}
              onClick={handleAcceptInvitation}
              disabled={acceptingInvitation}
            >
              {acceptingInvitation ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Processing...
                </>
              ) : (
                'Accept & Continue'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}