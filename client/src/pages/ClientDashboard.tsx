// Extend the Window interface to add our client ID context
declare global {
  interface Window {
    _currentClientId?: string | number | null;
  }
}

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
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
import { getImageUrl } from "@/lib/utils";
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
  status: string;
  firstServiceDate?: string;
  createdAt: string;
}

export default function ClientDashboard() {
  const { id } = useParams();
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

  // Fetch client data
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

    console.log(`ClientDashboard - Client data loaded. Checking acceptedTerms status: ${client.acceptedTerms}`);
    console.log(`ClientDashboard - Profile prompt shown status: ${client.profilePromptShown}`);
    console.log(`ClientDashboard - adminView status: ${isAdminView}`);
    
    // CRITICAL FIX: Bypass profile completion popup per user request
    console.log('[CRITICAL FIX] Bypassing profile prompt popup as requested');
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

  const isLoading = clientLoading || (client?.salonId && salonLoading);

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
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold text-red-500">Error</h2>
              <p className="mt-2">There was a problem loading your dashboard. Please try again later.</p>
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
                  <span className="truncate">{client.phone || 'No phone number'}</span>
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
                      'No address'
                    )}
                  </span>
                </div>
              </div>
              
              {/* Section 4: Edit Profile Button */}
              <div className="flex items-center justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-4 py-1.5 text-sm rounded-full border-pink-200 hover:bg-pink-50"
                  onClick={() => setIsEditing(true)}
                >
                  <PencilIcon className="mr-2 h-4 w-4 text-pink-500" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* REDUCED SPACE - No space between hero and tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs for different dashboard sections */}
          <Tabs defaultValue="profile" className="w-full mb-2">
            <TabsList className="grid w-full grid-cols-3 bg-transparent shadow-none gap-3 px-1 py-1">
              <TabsTrigger 
                value="profile" 
                className="bg-white shadow-sm rounded-md transition-all duration-200 
                           hover:bg-gradient-to-r hover:from-pink-50 hover:to-pink-100
                           hover:shadow-md hover:scale-105
                           data-[state=active]:bg-white data-[state=active]:shadow-md
                           data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
              >
                <div className="w-full text-center py-2">
                  <div className="font-semibold text-gray-800">Gifts</div>
                  <div className="flex items-center justify-center text-xs text-muted-foreground mt-1 space-x-1">
                    <span>New</span>
                    <span className="text-muted-foreground/30 px-1">|</span>
                    <span>Status</span>
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="invitations" 
                className="bg-white shadow-sm rounded-md transition-all duration-200 
                           hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100
                           hover:shadow-md hover:scale-105
                           data-[state=active]:bg-white data-[state=active]:shadow-md
                           data-[state=active]:border-b-2 data-[state=active]:border-indigo-500"
              >
                <div className="w-full text-center py-2">
                  <div className="font-semibold text-gray-800">Invitations</div>
                  <div className="flex items-center justify-center text-xs text-muted-foreground mt-1 space-x-1">
                    <span>Send</span>
                    <span className="text-muted-foreground/30 px-1">|</span>
                    <span>Status</span>
                  </div>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="appointments" 
                className="bg-white shadow-sm rounded-md transition-all duration-200 
                           hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100
                           hover:shadow-md hover:scale-105
                           data-[state=active]:bg-white data-[state=active]:shadow-md
                           data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
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
            
            <TabsContent value="profile" className="mt-10 transition-all duration-300 animate-in fade-in-50">
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
              <div className="bg-white rounded-xl shadow-md p-4 border border-pink-100">
                <GiftsPage />
              </div>
            </TabsContent>
            
            <TabsContent value="invitations" className="mt-10 transition-all duration-300 animate-in fade-in-50">
              {/* Invitations Page Component */}
              <div className="bg-white rounded-xl shadow-md p-4 border border-indigo-100">
                <InvitationsPage />
              </div>
            </TabsContent>
            
            <TabsContent value="appointments" className="mt-10 transition-all duration-300 animate-in fade-in-50">
              <div className="bg-white rounded-xl shadow-md p-4 border border-blue-100">
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