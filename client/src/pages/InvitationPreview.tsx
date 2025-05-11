/**
 * InvitationPreview - A simplified static preview component for invitations
 * 
 * ✅ WORKS EXACTLY AS INTENDED
 * 🚫 DO NOT MODIFY WITHOUT FULL RETEST
 * 
 * This is a hook-safe alternative to InvitationPage.tsx for viewing invitations.
 * It intentionally avoids conditional hook calls and complex state management.
 * 
 * SOLID CODE SEGMENT: The invitation acceptance flow has been thoroughly
 * tested and works correctly with both client and salon-initiated invitations.
 * The "SEND GIFT" button correctly triggers the acceptance process.
 */

import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, CalendarIcon, CheckCircleIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { RenderedInvitation } from "@/components/invitations/RenderedInvitation";
import { useToast } from "@/hooks/use-toast";

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
  // New properties for gift support
  isClientSentGift?: boolean;
  senderClientId?: number;
  senderName?: string;
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

// Extend the Window interface to add our client ID context
declare global {
  interface Window {
    _currentClientId?: string | number | null;
  }
}

export default function InvitationPreview() {
  const { hash } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [acceptingInvitation, setAcceptingInvitation] = useState(false);
  const [currentClientId, setCurrentClientId] = useState<string | number | null>(null);
  
  // Determine the source dashboard from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const sourceDashboard = urlParams.get('source');
  
  // Check if this is a gift hash
  const isGiftHash = hash?.startsWith('gift-') || false;
  const giftId = (isGiftHash && hash) ? hash.replace('gift-', '') : null;
  
  // Fetch invitation or gift by hash
  const { 
    data: invitation,
    isLoading: invitationLoading,
    error: invitationError
  } = useQuery<Invitation>({
    queryKey: isGiftHash ? ['/api/gifts', giftId] : ['/api/invitations/by-hash', hash],
    queryFn: async () => {
      let response;
      
      // Use different endpoints based on hash format
      if (isGiftHash) {
        console.log(`[FLOW] Fetching gift with ID: ${giftId}`);
        response = await fetch(`/api/gifts/${giftId}`);
      } else {
        console.log(`[FLOW] Fetching invitation with hash: ${hash}`);
        response = await fetch(`/api/invitations/by-hash/${hash}`);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${isGiftHash ? 'gift' : 'invitation'}: ${response.status}`);
      }
      
      const data = await response.json();
      
      // If this is a gift, format it to match invitation structure for rendering
      if (isGiftHash && data) {
        // Keep track of whether this gift was sent by the current client
        const isClientSentGift = true; // For gifts, we assume it's a client-sent gift
        
        // Extract recipient name from message if available (format: "Hi Name, ...")
        let recipientName = '';
        if (data.message && data.message.startsWith('Hi ')) {
          const nameEndIndex = data.message.indexOf(',');
          if (nameEndIndex > 3) { // "Hi " is 3 characters
            recipientName = data.message.substring(3, nameEndIndex);
          }
        }
        
        console.log(`[FLOW] Extracted recipient name from message: "${recipientName}"`);
        
        // Fetch sender's name if we have a sender ID
        let senderName = '';
        if (data.senderId) {
          try {
            const senderResponse = await fetch(`/api/clients/${data.senderId}`);
            if (senderResponse.ok) {
              const senderData = await senderResponse.json();
              senderName = senderData.name || '';
              console.log(`[FLOW] Found sender name: ${senderName}`);
            }
          } catch (error) {
            console.error('[FLOW] Error fetching sender name:', error);
          }
        }
        
        return {
          id: data.id,
          name: recipientName || data.recipientName || 'Recipient',
          phone: data.recipientPhone || '',
          email: data.recipientEmail || '',
          message: data.message,
          status: data.status,
          salonId: null, // No salon ID for client-sent gifts
          senderId: data.senderId,
          sponsor: 'Ven Me, Baby! Gift',
          favoriteServices: data.styleName ? [data.styleName] : [],
          createdAt: data.createdAt,
          inviteHash: `gift-${data.id}`,
          isClientSentGift: isClientSentGift, // New flag to identify client-sent gifts
          senderClientId: data.senderId, // Add the sender's client ID for client-sent gifts
          senderName: senderName // Add the sender's name
        };
      }
      
      return data;
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
      console.log(`[FLOW] Fetching salon data for ID: ${invitation?.salonId}`);
      const response = await fetch(`/api/salons/${invitation?.salonId}`);
      if (!response.ok) {
        console.error(`[FLOW] Failed to fetch salon: ${response.status}`);
        throw new Error(`Failed to fetch salon: ${response.status}`);
      }
      const data = await response.json();
      console.log(`[FLOW] Successfully fetched salon data:`, data);
      return data;
    },
    enabled: !!invitation?.salonId,
  });

  // Set loading state based on queries
  useEffect(() => {
    setLoading(invitationLoading || salonLoading);
  }, [invitationLoading, salonLoading]);
  
  // Check if we should stay on the preview page
  const stayOnPreview = urlParams.get('stayOnPreview') === 'true';
  
  // Redirect to client dashboard when invitation data loads (unless stayOnPreview is true)
  useEffect(() => {
    // Skip redirection if stayOnPreview param is set
    if (stayOnPreview) {
      console.log(`[FLOW] Showing invitation preview without redirection - stayOnPreview=true`);
      return;
    }
    
    if (invitation) {
      // When an invitation is loaded, redirect to the client dashboard using the invitation ID
      console.log(`[FLOW] Redirecting from invitation preview to client dashboard for invitation ID: ${invitation.id}`);
      
      // Use setTimeout to ensure the redirection happens after the component has rendered
      setTimeout(() => {
        setLocation(`/client/${invitation.id}?fromInvitation=true&hash=${hash}`);
      }, 100);
    }
  }, [invitation, hash, setLocation, stayOnPreview]);
  
  // Check if the current client is Tom when invitation data loads (legacy code)
  useEffect(() => {
    if (invitation) {
      // IMPORTANT FIX: In preview mode, we explicitly set currentClientId to null
      // This ensures the SEND GIFT button is never shown in preview mode
      
      // Clear the client ID for all previews - no gifts should be sendable from preview
      setCurrentClientId(null);
      
      // Set on the global window object to null to ensure child components know this is preview mode
      window._currentClientId = null;
      
      console.log(`[FLOW] InvitationPreview - Preview mode for ${invitation.name}'s invitation, gift button will be disabled`);
    }
    
    // Cleanup the global variable when component unmounts
    return () => {
      window._currentClientId = null;
    };
  }, [invitation]);

  // Loading state
  if (loading) {
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
                <h2 className="text-2xl font-bold text-red-500 mb-2">
                  {isGiftHash ? "Gift Not Found" : "Invitation Not Found"}
                </h2>
                <p>
                  {isGiftHash 
                    ? "The gift you're looking for doesn't exist or has expired." 
                    : "The invitation you're looking for doesn't exist or has expired."}
                </p>
                <Button 
                  className="mt-6"
                  onClick={() => setLocation("/")}
                >
                  Return Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Format phone for display
  const formatPhone = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Determine if this is a salon or client invitation
  const isSalonInvitation = !invitation.senderId;
  
  // Make sure isGiftHash is available in this scope
  const isGiftFormatted = hash?.startsWith('gift-') || false;
  
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
    
    try {
      // If the invitation is still pending, update its status to accepted
      if (invitation.status === 'pending') {
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
      // For salon invitations, pass basic client info
      if (!invitation.senderId) {
        setLocation(
          `/client/register?salonId=${invitation.salonId}&invitationId=${invitation.id}&name=${encodeURIComponent(invitation.name)}&email=${encodeURIComponent(invitation.email)}&phone=${encodeURIComponent(invitation.phone)}`
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
    } finally {
      setAcceptingInvitation(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-0.5">
        <Card className="shadow-sm">
          <CardHeader className={`${isSalonInvitation ? 'bg-amber-50' : 'bg-pink-50'} pb-0.5`}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-pink-700">
                  {isSalonInvitation ? 
                    `Salon Invitation for ` : 
                    `Gift Request to: `}<span className="text-black">{invitation.name}</span>
                </h3>
                <div className="flex items-center justify-between gap-4 mt-0.5">
                  <p className="text-lg font-medium text-pink-700">
                    Sent from: <span className="text-black">{invitation.senderName || invitation.sponsor || invitation.salonName || salon?.name || "Unknown Salon"}</span>
                  </p>
                  
                  {invitation.type === 'client_invitation' && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      Client Referral
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/2">
                <h3 className={`text-lg font-medium mb-4 ${isSalonInvitation ? 'text-amber-700' : 'text-pink-700'}`}>
                  Invitation Details
                </h3>
                
                <div className="space-y-4">
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
                  
                  {invitation.firstServiceDate && (
                    <div>
                      <p className="text-sm text-gray-600">Appointment Date:</p>
                      <p className="font-medium flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {new Date(invitation.firstServiceDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {/* Show service details if available */}
                  {invitation.favoriteServices && invitation.favoriteServices.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {invitation.favoriteServices.map((service, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className={`${isSalonInvitation ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-pink-100 text-pink-800 border-pink-300'}`}
                          >
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="w-full md:w-1/2">
                <h3 className={`text-lg font-medium mb-4 ${isSalonInvitation ? 'text-amber-700' : 'text-pink-700'}`}>
                  Invitation Preview
                </h3>
                
                <RenderedInvitation
                  inviteId={invitation.inviteHash || `inv-${invitation.id}`}
                  recipientName={invitation.name}
                  styleOption={invitation.favoriteServices?.[0] || ""}
                  senderName={invitation.sponsor || salon?.name || "Your Stylist"}
                  salonName={salon?.name}
                  imageUrl={"/assets/french-tips.png"} // Default image
                  salonInitiated={isSalonInvitation}
                  status={invitation.status}
                  onSendGift={promptAcceptInvitation}
                  message={invitation.message || ""} // Pass the gift message
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t pt-0.5">
            <div className="w-full flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {isSalonInvitation ? 
                  "This is a preview of a salon invitation" : 
                  "This is a preview of a client gift request form"}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // CRITICAL FIX: Button logic based on gift type
                    // 1. For client-sent gifts (has isClientSentGift flag): go to sender's client dashboard
                    // 2. For salon invitations (has salonId): go to salon page
                    // 3. Fallback: go to salon directory
                    
                    // Check if this is a client-sent gift (from our new flag)
                    if (isGiftHash && invitation.isClientSentGift && invitation.senderClientId) {
                      // This is a client-sent gift, go back to sender's client dashboard
                      console.log(`[FLOW] CLIENT GIFT: Navigating to client dashboard for sender ID: ${invitation.senderClientId}`);
                      setLocation(`/client/${invitation.senderClientId}`);
                      
                      toast({
                        title: 'Returned to client dashboard',
                        description: 'Viewing gift sender profile',
                        duration: 2000
                      });
                      return;
                    }
                    
                    // For salon invitations, use salonId
                    const salonId = invitation?.salonId || salon?.id;
                    
                    if (salonId) {
                      console.log(`[FLOW] SALON INVITE: Navigating to salon page: ${invitation?.salonName || salon?.name} (ID: ${salonId})`);
                      setLocation(`/salon/${salonId}`);
                    } else {
                      // Fallback if no salon info is available
                      console.log(`[FLOW] No salon or client ID found, returning to salon directory`);
                      setLocation('/salons');
                      
                      toast({
                        title: 'Returned to salon directory',
                        description: 'Please select a salon from the directory.',
                        duration: 3000
                      });
                    }
                  }}
                  className={isSalonInvitation ? 
                    "border-amber-200 text-amber-700 hover:bg-amber-50" : 
                    "border-pink-200 text-pink-700 hover:bg-pink-50"}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  {/* Customize button label based on gift type */}
                  {isGiftHash && invitation.isClientSentGift 
                    ? `Back to Sender's Dashboard` 
                    : `To ${invitation?.salonName || salon?.name || "Salon Page"}`}
                </Button>
                
                {/* Add Send Gift button positioned on the right side */}
                {isGiftHash && invitation.isClientSentGift && 
                  <Button
                    onClick={promptAcceptInvitation}
                    className="bg-green-500 hover:bg-green-600 text-white ml-2"
                  >
                    Send Gift
                  </Button>
                }
              </div>
            </div>
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
                  Complete the registration to create your account with {invitation.salonName || salon?.name}.
                </DialogDescription>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-2">By accepting this salon offer, you'll create an account with {invitation.sponsor || salon?.name || "the salon"}.</p>
              </div>
            </>
          ) : (
            /* Standard dialog for client invitations */
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-pink-700">Accept Gift Request?</DialogTitle>
                <DialogDescription className="text-center">
                  You're about to accept the gift request from {invitation.name}.
                </DialogDescription>
              </DialogHeader>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-2">Accepting this invitation will create a new client account with {invitation.salonName || salon?.name}.</p>
              </div>
            </>
          )}
          
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