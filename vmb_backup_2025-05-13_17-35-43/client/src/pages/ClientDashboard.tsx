// Extend the Window interface to add our client ID context
declare global {
  interface Window {
    _currentClientId?: string | number | null;
  }
}

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { VmbStyleOptions } from "@/components/promos/VmbStyleOptions";
import EditableClientInfo from "@/components/dashboard/EditableClientInfo";
import RecentVmbInvitations from "@/components/dashboard/RecentVmbInvitations";
import InlineVmbInvitations from "@/components/dashboard/InlineVmbInvitations";
import PendingSalonInvitations from "@/components/dashboard/PendingSalonInvitations";
import SentInvitations from "@/components/dashboard/SentInvitations";
import ClientInviteForm from "@/components/dashboard/ClientInviteForm";
import ClientAppointments from "@/components/appointments/ClientAppointments";
import GiftsPage from "@/components/gifts/GiftsPage";
import InvitationsPage from "@/components/invitations/InvitationsPage";
import { RenderedInvitation } from "@/components/invitations/RenderedInvitation";
import { getImageUrl, formatPhoneNumber } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  PhoneIcon, 
  AtSignIcon, 
  UserIcon, 
  PencilIcon, 
  HeartIcon,
  StarIcon,
  CheckCircleIcon,
  ScissorsIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2Icon
} from "lucide-react";

// Define client interface
interface ClientData {
  id: number;
  name: string;
  phone: string;
  email: string;
  isCurrentClient: boolean;
  acceptedTerms?: boolean; // Added field to track terms acceptance status
  profilePromptShown?: boolean; // Added field to track if profile completion prompt has been shown
  notes?: string;
  favoriteServices?: string[];
  salonId?: number;
  salonName?: string;
  sponsor?: string;
  sponsorName?: string;
  type: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  socialMedia?: SocialMediaItem[] | null;
  photoUrl?: string;
  createdAt: string;
}

interface SocialMediaItem {
  platform: string;
  handle: string;
}

interface SalonData {
  id: number;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  services?: any[];
  promos?: any[];
  schedule?: any;
  ownerPhotoUrl?: string;
}

interface StyleSelection {
  id: number;
  clientId: number;
  styleId: number;
  salonId: number;
  selectedAt: string;
  status: string;
}

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  salonId: number;
  salonName?: string;
  sponsor?: string;
  sponsorName?: string;
  status: string;
  firstServiceDate?: string;
  createdAt: string;
}

export default function ClientDashboard() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // State for VMB Style Options selection
  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPersonalizedOffers, setShowPersonalizedOffers] = useState(false);
  const [showCreatePromo, setShowCreatePromo] = useState(false);
  
  // Show/hide state for VMB Style Options section - default to HIDE per user request
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  
  // Show/hide state for gift options section - default to HIDE
  const [showGiftOptions, setShowGiftOptions] = useState(false);
  
  // Show/hide state for pending invitations section - default to HIDE
  const [showPendingInvitations, setShowPendingInvitations] = useState(false);
  
  // Show/hide state for sent invitations section - default to HIDE per user request
  const [showSentInvitations, setShowSentInvitations] = useState(false);
  
  // Show/hide state for share form section - default to HIDE per user request
  const [showShareForm, setShowShareForm] = useState(false);
  
  // Show "Complete Your Profile" dialog for newly validated clients
  const [showCompleteProfileDialog, setShowCompleteProfileDialog] = useState(false);
  
  // State for invitation form with default client-to-others message template
  const [inviteForm, setInviteForm] = useState({
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    message: ''
  });
  
  // Define client-to-others default message template
  const getDefaultClientToOthersMessage = () => {
    return `Hi! ${inviteForm.recipientName || '[recpt name]'},\n\nI love this style - ${selectedStyle?.name || '[selected opt]'}. My nails are a mess and ${salon?.ownerName || '[sal own nm]'} has an opening.\n\nI would love a treat from you! Will you Ven Me, Baby! ❤️❤️❤️ ${client?.name || ''}`;
  };
  
  // State for invitation preview
  const [showInvitePreview, setShowInvitePreview] = useState(false);

  // Validate ID parameter - should be a number, not 'registration' or other text
  const numericId = id && !isNaN(Number(id)) ? id : null;
  
  // Add debugging information to trace API calls
  console.log(`ClientDashboard - Fetching client with ID: ${numericId || 'INVALID'}`);

  // Check if we're coming from an invitation page
  const urlParams = new URLSearchParams(window.location.search);
  const fromInvitation = urlParams.get('fromInvitation') === 'true';
  const invitationHash = urlParams.get('hash');
  
  // Fetch invitation data if we're viewing from an invitation or if viewing a client by ID
  const { 
    data: invitation,
    isLoading: invitationLoading
  } = useQuery<any>({
    queryKey: ['/api/invitations/id', numericId],
    queryFn: async () => {
      // If we have a hash, fetch by hash instead of ID
      if (invitationHash) {
        const response = await fetch(`/api/invitations/by-hash/${invitationHash}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch invitation by hash: ${response.status}`);
        }
        return response.json();
      }
      
      // Otherwise fetch by ID - this might be either a client ID or an invitation ID
      const response = await fetch(`/api/invitations/${numericId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch invitation: ${response.status}`);
      }
      return response.json();
    },
    // Enable this query either when coming from invitation page or when we have a numeric ID
    // This allows us to handle cases where we access a dashboard directly via invitation ID
    enabled: !!numericId,
  });
  
  // Fetch client data - try client ID first, but if that fails, we'll handle it
  const { data: client, isLoading: clientLoading, error: clientError } = useQuery<ClientData>({
    queryKey: ['/api/clients', numericId],
    queryFn: async () => {
      try {
        if (!numericId) {
          throw new Error('Invalid client ID format');
        }
        
        console.log(`ClientDashboard - Making API request to fetch client ${numericId}`);
        const response = await fetch(`/api/clients/${numericId}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`ClientDashboard - API error: ${response.status} ${errorText}`);
          throw new Error(`Failed to fetch client: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`ClientDashboard - Successfully fetched client:`, data);
        return data;
      } catch (error) {
        console.error(`ClientDashboard - Error fetching client ${numericId || 'INVALID'}:`, error);
        
        // If we have invitation data, we can create a temporary client view
        if (invitation) {
          // Return a synthetic client object based on the invitation data
          // This doesn't persist to the database but lets us render the dashboard
          console.log('Using invitation data to create temporary client view');
          return {
            id: invitation.id,
            name: invitation.name,
            phone: invitation.phone,
            email: invitation.email,
            notes: invitation.notes,
            salonId: invitation.salonId,
            invitationPending: true, // Flag to indicate this isn't a real client record yet
            fromInvitation: true
          };
        }
        
        throw error;
      }
    },
    refetchOnMount: true,
    enabled: !!numericId, // Only run the query if we have a valid numeric ID
  });

  // Fetch linked salon data if salonId exists
  const { data: salon, isLoading: salonLoading } = useQuery<SalonData>({
    queryKey: ['/api/salons', client?.salonId],
    queryFn: async () => {
      console.log(`ClientDashboard - Fetching linked salon with ID: ${client?.salonId}`);
      const response = await fetch(`/api/salons/${client?.salonId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch salon: ${response.status}`);
      }
      const data = await response.json();
      console.log(`ClientDashboard - Successfully fetched salon:`, data);
      return data;
    },
    enabled: !!client?.salonId, // Only run if client has a salonId
  });
  
  // Add Style Selection Mutation
  const addStyleSelectionMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await fetch(`/api/clients/${data.clientId}/style-selections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error during style selection:', error);
        throw error;
      }
    },
    onSuccess: () => {
      setShowConfirmDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/clients', client?.id, 'style-selections'] });
      toast({
        title: "Style Selected",
        description: "Your style preference has been saved successfully!",
      });
    },
    onError: (error) => {
      console.error('Error saving style selection:', error);
      toast({
        title: "Error",
        description: "There was a problem saving your style selection. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Check if user is viewing their own profile or if it's an admin view
  const [isAdminView, setIsAdminView] = useState(false);
  
  // Detect if we're in admin view mode by checking URL parameters or localStorage
  useEffect(() => {
    // Check if there's an admin flag in the URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const adminViewParam = urlParams.get('adminView');
    const adminViewStorage = localStorage.getItem('adminView');
    
    // Set admin view mode if either condition is true
    if (adminViewParam === 'true' || adminViewStorage === 'true') {
      console.log('[FLOW] ClientDashboard - Admin view mode detected, profile prompt will not show');
      setIsAdminView(true);
    } else {
      console.log('[FLOW] ClientDashboard - Regular client view mode');
      setIsAdminView(false);
    }
    
    // Cleanup function to remove adminView from localStorage when leaving the page
    return () => {
      // Only remove if this was set by the admin dashboard navigation
      if (adminViewParam === 'true') {
        console.log('[FLOW] ClientDashboard - Cleaning up adminView flag from localStorage');
        localStorage.removeItem('adminView');
      }
    };
  }, []);
  
  // CRITICAL FIX: Set the global client ID for invitation context
  // This allows the RenderedInvitation component to properly determine who is viewing invitations
  useEffect(() => {
    if (client?.id) {
      // Set the client ID in the global window object for invitation context
      window._currentClientId = client.name; // We store client name to match the recipientName in invitations
      console.log(`[FLOW] ClientDashboard - Setting global client ID context: ${client.name} (ID: ${client.id})`);
    }
    
    // Clean up when component unmounts
    return () => {
      console.log('[FLOW] ClientDashboard - Clearing global client ID context');
      window._currentClientId = null;
    };
  }, [client]);

  // Check client's registration status when data is loaded - POPUP DISABLED BY REQUEST
  useEffect(() => {
    if (!client) return;

    // Log client status info in development mode only
    if (import.meta.env.DEV) {
      console.log(`ClientDashboard - Client status:
      - acceptedTerms: ${client.acceptedTerms}
      - profilePromptShown: ${client.profilePromptShown}
      - adminView: ${isAdminView}`);
    }
    
    // CRITICAL FIX: Bypass profile completion popup per user request
    // Skip profile prompt in admin view
    setShowCompleteProfileDialog(false);
    
    // Still mark that we've shown the popup to this client in the database
    if (client.profilePromptShown !== true) {
      updateProfilePromptShown(client.id);
    }
  }, [client, isAdminView]);
  
  // Function to update the client's profilePromptShown status in the database
  const updateProfilePromptShown = async (clientId: number) => {
    try {
      console.log(`[FLOW] ClientDashboard - Marking profile prompt as shown for client ${clientId}`);
      const response = await fetch(`/api/clients/${clientId}/profile-prompt-shown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profilePromptShown: true }),
      });
      
      if (!response.ok) {
        console.error(`Error updating profile prompt status: ${response.status}`);
        return;
      }
      
      const result = await response.json();
      console.log(`[FLOW] ClientDashboard - Successfully marked profile prompt as shown`);
    } catch (error) {
      console.error('Error updating profile prompt status:', error);
    }
  };

  // Update loading state to include invitation loading
  const isLoading = clientLoading || (client?.salonId && salonLoading) || (fromInvitation && invitationLoading);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (clientError || !client) {
    // Extract error message to provide more context
    const errorMessage = clientError instanceof Error 
      ? clientError.message
      : "Unknown error occurred";
    
    // Check if it's a "not found" error
    const isNotFoundError = errorMessage.includes("404") || errorMessage.includes("not found");
    
    // Check if we have invitation data available (either from fromInvitation or direct access)
    if (isNotFoundError && invitation) {
      // If invitation data is available, display a simplified client dashboard for registration
      return (
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow pt-6 pb-12 px-4">
            <div className="container mx-auto">
              <Card className="mb-8 overflow-hidden">
                <CardHeader className="bg-pink-50 pb-4">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <CardTitle className="text-2xl font-bold text-pink-700">Welcome, {invitation.name}!</CardTitle>
                      <CardDescription className="text-pink-600">
                        Complete your registration to access your dashboard
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setLocation(`/client/register?invitationId=${invitation.id}&name=${encodeURIComponent(invitation.name)}&phone=${encodeURIComponent(invitation.phone)}&registrationMode=complete`)}
                      className="bg-pink-600 hover:bg-pink-700 text-white"
                    >
                      Complete Registration
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Your Invitation</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">From:</p>
                          <p className="font-medium">{invitation.sponsorName || invitation.sponsor || "Tiffany 5280 Nails Studio"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Message:</p>
                          <p className="italic text-gray-700 border-l-2 border-pink-200 pl-3 py-1">{invitation.message}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status:</p>
                          <Badge className="bg-yellow-100 text-yellow-800 mt-1">{invitation.status || "pending"}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center items-center">
                      <RenderedInvitation
                        inviteId={invitation.inviteHash || `inv-${invitation.id}`}
                        recipientName={invitation.name}
                        styleOption={invitation.favoriteServices?.[0] || ""}
                        senderName={invitation.sponsorName || invitation.sponsor || "Your Stylist"}
                        salonName={invitation.salonName}
                        imageUrl={"/assets/french-tips.png"}
                        salonInitiated={!invitation.senderId}
                        status={invitation.status}
                        onSendGift={() => setLocation(`/client/register?invitationId=${invitation.id}&name=${encodeURIComponent(invitation.name)}&phone=${encodeURIComponent(invitation.phone)}`)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    // If invitation is not available or we're not from invitation page, show error
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-red-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-lg font-medium mb-2">
                {isNotFoundError ? "Client Not Found" : "Dashboard Error"}
              </h2>
              <p className="mb-4">
                {isNotFoundError 
                  ? `We couldn't find client with ID ${numericId}. This client may not exist or may have been removed.`
                  : "There was a problem loading your dashboard. Please try again later."}
              </p>
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/")}>
                  Go Home
                </Button>
                <Button 
                  onClick={() => setLocation(`/client/${isNotFoundError ? "14" : numericId}`)}>
                  {isNotFoundError ? "Try Existing Client" : "Retry"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Check if client is linked to any salon - we want to show VMB Style Options for all connected salons
  const isLinkedToVMB = !!client.salonId;
  const serviceOptions = salon?.services || [];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* Complete Your Profile Dialog */}
      <Dialog open={showCompleteProfileDialog} onOpenChange={setShowCompleteProfileDialog}>
        <DialogContent className="sm:max-w-md" aria-describedby="complete-profile-description">
          <div id="complete-profile-description" className="sr-only">
            Complete your client profile to get the most out of Ven Me, Baby!
          </div>
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              To make the most of your Ven Me, Baby! experience, please complete your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              By accepting Terms of Service, you confirm that you've read and agree to our:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Community Guidelines</li>
            </ul>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowCompleteProfileDialog(false)}
              >
                Later
              </Button>
              <Button
                onClick={() => {
                  setShowCompleteProfileDialog(false);
                  setIsEditing(true);
                }}
              >
                Complete Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-grow">
        {/* Hero section - Tightened vertically */}
        <section className="bg-gradient-to-b from-pink-50 to-white pb-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              {/* Section 1: Avatar */}
              <div className="flex justify-center md:justify-start">
                <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                  {client.photoUrl ? (
                    <AvatarImage src={getImageUrl(client.photoUrl)} alt={client.name} />
                  ) : (
                    <AvatarFallback className="bg-pink-100 text-pink-800 text-lg">
                      {client.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              
              {/* Section 2: Client name and type */}
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm text-gray-500 mt-1">
                  <Badge variant="outline" className="bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100">
                    {client.type === 'client' ? 'Client' : 'Salon Owner'}
                  </Badge>
                  {client.salonId && <Badge variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100">
                    Linked to {client.salonName}
                  </Badge>}
                </div>
              </div>
              
              {/* Section 3: Contact information stacked vertically */}
              <div className="space-y-1.5 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span className="truncate">{client.phone ? formatPhoneNumber(client.phone) : 'No phone number'}</span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600">
                  <AtSignIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span className="truncate">{client.email || 'No email'}</span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span className="truncate">
                    {client.address ? (
                      <>{client.address}, {client.city || ''}, {client.state || ''} {client.zipCode || ''}</>
                    ) : (
                      <>Client of {' '}
                        <Link 
                          to={`/salons/2`} 
                          className="text-pink-500 hover:text-pink-700 hover:underline"
                        >
                          Tiffany 5280 Nails Studio
                        </Link>
                      </>
                    )}
                  </span>
                </div>
              </div>
              
              {/* Section 4: Edit Profile Button - Reduced size */}
              <div className="flex items-center justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3 py-1 text-xs rounded-full border-pink-200 hover:bg-pink-50"
                  onClick={() => setIsEditing(true)}
                >
                  <PencilIcon className="mr-1 h-3 w-3 text-pink-500" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* REDUCED SPACE - No space between hero and tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs for different dashboard sections */}
          <Tabs defaultValue="gifts" className="w-full mb-2">
            <TabsList className="grid w-full grid-cols-3 bg-transparent shadow-none gap-3 px-1 py-1 mb-1">
              <TabsTrigger 
                value="gifts" 
                className="bg-white shadow-md rounded-md transition-all duration-200 
                           border border-gray-100
                           hover:bg-gradient-to-r hover:from-pink-50 hover:to-pink-100
                           hover:shadow-lg hover:scale-105
                           data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-50 data-[state=active]:to-pink-100
                           data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-pink-500
                           data-[state=active]:border-t data-[state=active]:border-t-pink-200
                           data-[state=active]:border-l data-[state=active]:border-l-pink-200
                           data-[state=active]:border-r data-[state=active]:border-r-pink-200"
              >
                <div className="w-full text-center py-2">
                  <div className="font-semibold text-gray-800">Gifts</div>
                  <div className="flex items-center justify-center text-xs text-muted-foreground mt-1 space-x-1">
                    <span>Sent</span>
                    <span className="text-muted-foreground/30 px-1">|</span>
                    <span>Received</span>
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="invitations" 
                className="bg-white shadow-md rounded-md transition-all duration-200 
                           border border-gray-100
                           hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100
                           hover:shadow-lg hover:scale-105
                           data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-50 data-[state=active]:to-indigo-100
                           data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-indigo-500
                           data-[state=active]:border-t data-[state=active]:border-t-indigo-200 
                           data-[state=active]:border-l data-[state=active]:border-l-indigo-200
                           data-[state=active]:border-r data-[state=active]:border-r-indigo-200"
              >
                <div className="w-full text-center py-2">
                  <div className="font-semibold text-gray-800">Invitations</div>
                  <div className="flex items-center justify-center text-xs text-muted-foreground mt-1 space-x-1">
                    <span>Friends</span>
                    <span className="text-muted-foreground/30 px-1">|</span>
                    <span>Owners</span>
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="appointments" 
                className="bg-white shadow-md rounded-md transition-all duration-200 
                           border border-gray-100
                           hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100
                           hover:shadow-lg hover:scale-105
                           data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-blue-100
                           data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-blue-500
                           data-[state=active]:border-t data-[state=active]:border-t-blue-200
                           data-[state=active]:border-l data-[state=active]:border-l-blue-200
                           data-[state=active]:border-r data-[state=active]:border-r-blue-200"
              >
                <div className="w-full text-center py-2">
                  <div className="font-semibold text-gray-800">Appointments</div>
                  <div className="flex items-center justify-center text-xs text-muted-foreground mt-1 space-x-1">
                    <span>Pending</span>
                    <span className="text-muted-foreground/30 px-1">|</span>
                    <span>Booked</span>
                  </div>
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="gifts" className="mt-12 transition-all duration-300 animate-in fade-in-50">
              {/* Add dialog for editing client profile */}
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="max-w-4xl" aria-describedby="edit-profile-description">
                  <div id="edit-profile-description" className="sr-only">
                    Edit your profile information to keep it current.
                  </div>
                  <DialogHeader>
                    <DialogTitle>Edit Your Profile</DialogTitle>
                    <DialogDescription>
                      Update your personal information and preferences.
                    </DialogDescription>
                  </DialogHeader>
                  {client && (
                    <EditableClientInfo 
                      client={{
                        id: client.id,
                        name: client.name,
                        phone: client.phone,
                        email: client.email,
                        isCurrentClient: client.isCurrentClient,
                        acceptedTerms: client.acceptedTerms,
                        notes: client.notes,
                        favoriteServices: client.favoriteServices,
                        salonId: client.salonId,
                        salonName: client.salonName,
                        type: client.type,
                        address: client.address,
                        city: client.city,
                        state: client.state,
                        zipCode: client.zipCode,
                        socialMedia: client.socialMedia,
                        photoUrl: client.photoUrl
                      }}
                      onSave={(updatedClient) => {
                        console.log("Client profile updated:", updatedClient);
                        // The React Query cache will be invalidated by the component
                        setIsEditing(false);
                      }}
                      defaultEditing={true}
                      isDialog={true}
                    />
                  )}
                </DialogContent>
              </Dialog>
              
              {/* Gifts Page Component */}
              <div className="bg-white rounded-xl shadow-md p-4 border border-pink-200 bg-gradient-to-b from-pink-50/50 to-white">
                <GiftsPage clientId={client.id} salonId={client.salonId} />
              </div>
            </TabsContent>
            
            <TabsContent value="invitations" className="mt-12 transition-all duration-300 animate-in fade-in-50">
              {/* Invitations Page Component */}
              <div className="bg-white rounded-xl shadow-md p-4 border border-indigo-200 bg-gradient-to-b from-indigo-50/50 to-white">
                <InvitationsPage />
              </div>
            </TabsContent>
            
            <TabsContent value="appointments" className="mt-12 transition-all duration-300 animate-in fade-in-50">
              <div className="bg-white rounded-xl shadow-md p-4 border border-blue-200 bg-gradient-to-b from-blue-50/50 to-white">
                <ClientAppointments clientId={client.id} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}