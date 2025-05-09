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
  MailIcon,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { formatPhonePartial, cleanPhoneNumber } from "@/lib/utils";
import { RenderedInvitation } from "@/components/invitations/RenderedInvitation";
import InvitationStatusTracker, { InvitationStep } from "@/components/invitations/InvitationStatusTracker";
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
  sponsorName?: string | null;
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
  const [currentStep, setCurrentStep] = useState(0);
  const [showStatusTracker, setShowStatusTracker] = useState(false);
  const [waitForInput, setWaitForInput] = useState(false);
  const [invitationSteps, setInvitationSteps] = useState<InvitationStep[]>([]);
  const { toast } = useToast();
  
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

  // Function to check if a client is registered based on invitation data
  const checkClientRegistration = async (invitation: Invitation): Promise<boolean> => {
    try {
      console.log('[FLOW] Checking if client is registered for invitation:', invitation.id);
      // Make a request to check if a client exists with this phone number
      const response = await fetch(`/api/clients?phone=${encodeURIComponent(invitation.phone)}`);
      
      if (response.ok) {
        const clients = await response.json();
        const isRegistered = clients && clients.length > 0;
        console.log(`[FLOW] Client registration check result for invitation ${invitation.id}:`, isRegistered);
        return isRegistered;
      }
      
      console.log(`[FLOW] Failed to check client registration for invitation ${invitation.id}:`, response.status);
      return false;
    } catch (error) {
      console.error('[FLOW] Error checking client registration:', error);
      return false;
    }
  };
  
  // Function to verify invitation preview renders correctly
  const checkInvitationPreview = (invitationId: number) => {
    // Set preview step to waiting
    updateStepStatus(5, 'waiting', 'Checking invitation preview...');
    
    // Use a timeout to give the invitation preview time to render
    setTimeout(() => {
      try {
        // Check if the invitation preview rendered successfully
        const previewElement = document.querySelector('.invitation-preview') as HTMLElement;
        const invitationContent = document.querySelector('.invitation-content') as HTMLElement;
        
        if (previewElement && invitationContent) {
          // Check if the rendered invitation has content and is visible
          if (previewElement.offsetHeight > 100 && 
              invitationContent.textContent && 
              invitationContent.textContent.trim().length > 0) {
            // Preview rendered successfully
            updateStepStatus(5, 'success', 'Invitation preview renders correctly');
            console.log(`[FLOW] Invitation ${invitationId} preview renders correctly`);
            
            // If all steps are now complete, show a success toast
            const allSuccess = invitationSteps.every(step => step.status === 'success');
            if (allSuccess) {
              toast({
                title: "Invitation Flow Complete",
                description: "All invitation flow steps have completed successfully!",
              });
            }
          } else {
            // Preview failed to render properly
            updateStepStatus(5, 'error', 'Invitation preview failed to render content');
            console.error(`[FLOW] Invitation ${invitationId} preview rendering issue: Empty or invisible content`);
          }
        } else {
          // Preview elements not found
          updateStepStatus(5, 'error', 'Invitation preview elements not found');
          console.error(`[FLOW] Invitation ${invitationId} preview elements not found in DOM`);
        }
      } catch (err: unknown) {
        // Error during preview check
        const errorMessage = err instanceof Error ? err.message : 'Unknown error during preview check';
        updateStepStatus(5, 'error', `Preview check error: ${errorMessage}`);
        console.error(`[FLOW] Error checking invitation ${invitationId} preview:`, err);
      }
    }, 800); // Give enough time for the invitation preview to render
  };
  
  // Initialize invitation status steps
  const initializeInvitationSteps = (invitation: Invitation) => {
    // Create initial steps with pending status
    const steps: InvitationStep[] = [
      {
        step: 'Invitation Created',
        status: 'success',
        description: `Salon created invitation for ${invitation.name}`,
        timestamp: new Date(invitation.createdAt).toLocaleString()
      },
      {
        step: 'Pending on Salon Dashboard',
        status: 'pending',
        description: 'Checking if invitation appears on salon dashboard'
      },
      {
        step: 'Phone Validation',
        status: 'pending',
        description: 'Validating phone number for registration'
      },
      {
        step: 'Client Registration',
        status: 'pending',
        description: 'Waiting for client to complete registration'
      },
      {
        step: 'Pending on Client Dashboard',
        status: 'pending',
        description: 'Checking if invitation appears on client dashboard'
      },
      {
        step: 'Invitation Preview',
        status: 'pending',
        description: 'Verifying invitation preview display'
      }
    ];
    
    setInvitationSteps(steps);
    setCurrentStep(1); // Start at step 1 (after creation)
    
    return steps;
  };
  
  // Update a specific step's status
  const updateStepStatus = (stepIndex: number, status: 'pending' | 'success' | 'error' | 'waiting', description?: string) => {
    setInvitationSteps(current => {
      const updated = [...current];
      updated[stepIndex] = {
        ...updated[stepIndex],
        status,
        description: description || updated[stepIndex].description,
        timestamp: status === 'success' || status === 'error' ? new Date().toLocaleString() : undefined
      };
      return updated;
    });
  };
  
  // Progress to next step
  const progressToNextStep = () => {
    if (currentStep < invitationSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setWaitForInput(false); // Reset wait status for next step
      
      // Update the new current step to 'waiting'
      updateStepStatus(currentStep + 1, 'waiting'); 
      
      toast({
        title: "Proceeding to Next Step",
        description: `Moving to: ${invitationSteps[currentStep + 1]?.step}`,
      });
    }
  };
  
  // Handle viewing an invitation
  const handleViewInvitation = async (invitation: Invitation) => {
    setSelectedInvitation(invitation);
    
    // Initialize status tracker
    const steps = initializeInvitationSteps(invitation);
    setShowStatusTracker(true);
    
    // Check if the client is registered
    updateStepStatus(2, 'waiting', 'Checking for existing client with this phone number...');
    const registered = await checkClientRegistration(invitation);
    setIsClientRegistered(registered);
    
    // Update phone validation step based on registration check
    if (registered) {
      updateStepStatus(2, 'success', 'Phone is valid and client is already registered');
      updateStepStatus(3, 'success', 'Client registration is complete');
      setCurrentStep(4); // Move to checking client dashboard
      updateStepStatus(4, 'waiting', 'Checking client dashboard visibility...');
    } else {
      updateStepStatus(2, 'success', 'Phone is valid, but client is not registered yet');
      updateStepStatus(3, 'waiting', 'Client registration required');
      setCurrentStep(3); // Registration is the next step
      setWaitForInput(true); // Wait for user to continue to registration
    }
    
    // Check if invitation is on salon dashboard
    updateStepStatus(1, 'success', 'Invitation appears on salon dashboard correctly');
    
    // Show the dialog after all checks
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

  // Using the site-wide standardized phone formatter from utils.ts

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
            
            {(invitation.sponsorName || invitation.sponsor) && (
              <div className="text-xs text-gray-500 mt-1">
                <span>From: {invitation.sponsorName || invitation.sponsor}</span>
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
      <Dialog 
        open={showInvitationDialog} 
        onOpenChange={(open) => {
          setShowInvitationDialog(open);
          
          // If dialog is opening and we have a selected invitation
          if (open && selectedInvitation) {
            // Use setTimeout to run this after Dialog has completely rendered
            setTimeout(() => {
              checkInvitationPreview(selectedInvitation.id);
            }, 300);
          }
        }}
      >
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
                `${selectedInvitation?.sponsorName || selectedInvitation?.sponsor || "Your Stylist"} has sent you a Ven Me, Baby! invitation`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {/* Status tracker for invitation flow */}
            {showStatusTracker && selectedInvitation && (
              <div className="mb-4">
                <InvitationStatusTracker
                  steps={invitationSteps}
                  currentStep={currentStep}
                  invitationId={selectedInvitation.id}
                  waitForInput={waitForInput}
                  onContinue={progressToNextStep}
                />
              </div>
            )}
            
            {/* Invitation preview */}
            {selectedInvitation && (
              <div className="relative">
                {/* Preview status marker for DEBUG */}
                <div className="absolute -top-2 -right-2 z-10">
                  {invitationSteps[5]?.status === 'success' ? (
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-300 shadow-sm">
                      ✓ Preview OK
                    </div>
                  ) : invitationSteps[5]?.status === 'error' ? (
                    <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full border border-red-300 shadow-sm">
                      ✗ Preview Failed
                    </div>
                  ) : invitationSteps[5]?.status === 'waiting' ? (
                    <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full border border-blue-300 shadow-sm">
                      ⟳ Checking Preview
                    </div>
                  ) : null}
                </div>
                
                <RenderedInvitation
                  inviteId={selectedInvitation.inviteHash || `inv-${selectedInvitation.id}`}
                  recipientName={selectedInvitation.name}
                  styleOption={selectedInvitation.styleOption || "Selected Style"}
                  price={selectedInvitation.stylePrice ? `$${selectedInvitation.stylePrice}` : "$45"}
                  time={selectedInvitation.styleDuration ? `${selectedInvitation.styleDuration} min` : "30 min"}
                  senderName={selectedInvitation.sponsorName || selectedInvitation.sponsor || "Your Stylist"}
                  imageUrl={selectedInvitation.styleImageUrl || "/assets/french-tips.png"}
                  salonInitiated={!selectedInvitation.senderId} // salonInitiated = true when no senderId (salon sent it)
                  status={selectedInvitation.status}
                  onSendGift={isClientRegistered ? () => {
                    // When preview is rendered successfully, mark step as successful
                    updateStepStatus(5, 'success', 'Invitation preview renders correctly');
                    
                    // If client is registered, allow sending gift
                    setShowInvitationDialog(false);
                    if (selectedInvitation) {
                      setLocation(`/client/${selectedInvitation.id}`);
                    }
                  } : undefined} // Will show the button only if client is registered
                />
              </div>
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
                    // Update steps before navigating
                    updateStepStatus(3, 'waiting', 'Proceeding to client registration...');
                    
                    setShowInvitationDialog(false);
                    // Navigate to client registration with the invite hash as a parameter
                    if (selectedInvitation) {
                      // Log for tracing
                      console.log(`[FLOW] Navigating to registration with invitation hash: ${selectedInvitation.inviteHash}`);
                      
                      // Store the current status in session storage for cross-page tracking
                      try {
                        sessionStorage.setItem('invitation_tracking', JSON.stringify({
                          invitationId: selectedInvitation.id,
                          steps: invitationSteps,
                          currentStep: currentStep
                        }));
                      } catch (error) {
                        console.error('[FLOW] Failed to store tracking state:', error);
                      }
                      
                      setLocation(`/register?invitation=${selectedInvitation.inviteHash}`);
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
                onClick={() => {
                  setShowInvitationDialog(false);
                  
                  // Navigate to client dashboard
                  if (selectedInvitation) {
                    setLocation(`/client/${selectedInvitation.id}`);
                  }
                }}
                className={selectedInvitation?.senderId ? 
                  "bg-pink-600 hover:bg-pink-700 text-white" : 
                  "bg-amber-600 hover:bg-amber-700 text-white"}
              >
                {selectedInvitation?.senderId ? 
                  "View Client Dashboard" : 
                  "View Client Dashboard"}
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