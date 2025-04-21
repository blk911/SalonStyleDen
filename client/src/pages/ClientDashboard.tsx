import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { VmbStyleOptions } from "@/components/promos/VmbStyleOptions";
import EditableClientInfo from "@/components/dashboard/EditableClientInfo";
import RecentVmbInvitations from "@/components/dashboard/RecentVmbInvitations";
import InlineVmbInvitations from "@/components/dashboard/InlineVmbInvitations";
import ClientInviteForm from "@/components/dashboard/ClientInviteForm";
import { getImageUrl } from "@/lib/utils";
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
  ScissorsIcon
} from "lucide-react";

// Define client interface
interface ClientData {
  id: number;
  name: string;
  phone: string;
  email: string;
  isCurrentClient: boolean;
  acceptedTerms?: boolean; // Added field to track terms acceptance status
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
  
  // Show "Complete Your Profile" dialog for newly validated clients
  const [showCompleteProfileDialog, setShowCompleteProfileDialog] = useState(false);
  
  // State for invitation form
  const [inviteForm, setInviteForm] = useState({
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    message: ''
  });
  
  // State for invitation preview
  const [showInvitePreview, setShowInvitePreview] = useState(false);

  // Add debugging information to trace API calls
  console.log(`ClientDashboard - Fetching client with ID: ${id}`);
  
  // Fetch client data
  const { data: client, isLoading: clientLoading, error: clientError } = useQuery<ClientData>({
    queryKey: ['/api/clients', id],
    queryFn: async () => {
      try {
        console.log(`ClientDashboard - Making API request to fetch client ${id}`);
        const response = await fetch(`/api/clients/${id}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`ClientDashboard - API error: ${response.status} ${errorText}`);
          throw new Error(`Failed to fetch client: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`ClientDashboard - Successfully fetched client:`, data);
        return data;
      } catch (error) {
        console.error(`ClientDashboard - Error fetching client ${id}:`, error);
        throw error;
      }
    },
    refetchOnMount: true,
    enabled: !!id, // Only run the query if we have an ID
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
  
  // Fetch client's style selections
  const { data: styleSelections, isLoading: selectionsLoading } = useQuery<StyleSelection[]>({
    queryKey: ['/api/clients', id, 'style-selections'],
    queryFn: async () => {
      console.log(`ClientDashboard - Fetching style selections for client ${id}`);
      const response = await fetch(`/api/clients/${id}/style-selections`);
      if (!response.ok) {
        throw new Error(`Failed to fetch style selections: ${response.status}`);
      }
      const data = await response.json();
      console.log(`ClientDashboard - Successfully fetched style selections:`, data);
      return data;
    },
    enabled: !!id,
  });

  // Fetch client's invitations
  const { data: invitations, isLoading: invitationsLoading } = useQuery<Invitation[]>({
    queryKey: ['/api/invitations'],
    queryFn: async () => {
      console.log(`ClientDashboard - Fetching invitations`);
      // In a real implementation, this would filter by client's email or phone
      // For now, we'll just fetch all and filter client-side
      const response = await fetch('/api/invitations');
      if (!response.ok) {
        throw new Error(`Failed to fetch invitations: ${response.status}`);
      }
      const data = await response.json();
      // Filter invitations that match this client's email or phone
      const clientInvitations = client ? 
        data.filter((inv: Invitation) => 
          inv.email.toLowerCase() === client.email.toLowerCase() || 
          inv.phone.replace(/\D/g, '') === client.phone.replace(/\D/g, '')
        ) : [];
      console.log(`ClientDashboard - Found ${clientInvitations.length} invitations for this client`);
      return clientInvitations;
    },
    enabled: !!client,
  });

  // Check client's registration status when data is loaded
  useEffect(() => {
    if (client) {
      console.log(`ClientDashboard - Client data loaded. Checking acceptedTerms status: ${client.acceptedTerms}`);
      
      // If the acceptedTerms flag is not true, show the popup
      // Only show popup when client has NOT accepted terms
      if (client.acceptedTerms !== true) {
        console.log('ClientDashboard - Client has not accepted terms, showing profile completion dialog');
        setShowCompleteProfileDialog(true);
      } else {
        console.log('ClientDashboard - Client has already accepted terms, not showing dialog');
        setShowCompleteProfileDialog(false);
      }
    }
  }, [client]);

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
            <DialogTitle className="text-center text-pink-700">Complete Your Profile</DialogTitle>
          </DialogHeader>
          
          <div className="p-4 border border-pink-100 bg-pink-50 rounded mb-5 text-sm">
            <p className="text-center">
              Welcome to Ven Me, Baby!
            </p>
            <p className="mt-2 text-center">
              Your account has been verified successfully. Take a moment to complete your profile
              to get personalized style recommendations and special offers.
            </p>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Button 
              variant="default" 
              onClick={() => {
                setShowCompleteProfileDialog(false);
                setIsEditing(true);
              }}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Edit My Profile
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCompleteProfileDialog(false)}
              className="border-pink-300 text-pink-700"
            >
              Skip for Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <main className="flex-grow">
        {/* Hero Section with Client Info - REDUCED PADDING TO 2px */}
        <section className="bg-gradient-to-r from-pink-100 to-pink-50 py-2 border-b border-pink-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                  <UserIcon className="h-8 w-8 text-pink-500" />
                </div>
                <div className="ml-4">
                  <h1 className="font-bold text-2xl text-pink-700">{client.name}</h1>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                <div className="flex space-x-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-pink-300 text-pink-700 hover:bg-pink-50 flex items-center justify-center gap-2 min-w-[160px]"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    Joined: {new Date(client.createdAt).toLocaleDateString()}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-pink-300 text-pink-700 hover:bg-pink-50 flex items-center justify-center gap-2 min-w-[160px]"
                  >
                    <StarIcon className="h-4 w-4 text-pink-500" />
                    Sponsor: {client.sponsor || "None"}
                  </Button>
                  {client.salonId && salon && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-pink-300 text-pink-700 hover:bg-pink-50 flex items-center justify-center min-w-[160px]"
                      onClick={() => window.location.href = `/salon/${salon.id}`}
                    >
                      View Salon Page
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="border-pink-300 text-pink-700 hover:bg-pink-50 flex items-center justify-center gap-2 min-w-[160px]"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REDUCED SPACE TO 3px */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="space-y-6">
            {/* Add dialog for editing client profile */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Edit Your Profile</DialogTitle>
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
            
            {/* Full-width Salon Card */}
            {client.salonId && (
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <CardHeader className="bg-pink-50 pb-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2 text-pink-700">
                      <ScissorsIcon className="h-4 w-4" />
                      Your Salon
                    </CardTitle>
                    {salon && (
                      <CardDescription>Member of {salon.name}</CardDescription>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4">
                  {salon ? (
                    <div className="space-y-4">
                      {/* VMB Style Options - Direct display without salon contact info */}
                      {salon?.services && salon.services.length > 0 && (
                        <div>
                          <h3 className="text-base font-medium text-pink-700 mb-3">VMB Style Options</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {salon.services.filter(service => service.featured === true).map((service: any) => (
                              <div 
                                key={service.id} 
                                className="flex gap-3 p-3 border rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors cursor-pointer relative"
                                onClick={() => {
                                  setSelectedStyle(service);
                                  setShowConfirmDialog(true);
                                }}
                              >
                                {service.gifUrl && (
                                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden border border-pink-100">
                                    <img 
                                      src={service.gifUrl}
                                      alt={service.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        console.error(`Error loading image for ${service.name}`);
                                        e.currentTarget.src = '/assets/service-placeholder.png';
                                      }}
                                    />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{service.name}</h4>
                                  <p className="text-xs text-gray-600 mt-1">{service.description}</p>
                                  <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs font-semibold text-pink-700">${service.price}</span>
                                    <span className="text-xs text-gray-500">{service.duration} min</span>
                                  </div>
                                </div>
                                <div className="absolute inset-0 hover:bg-pink-200/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                  <div className="bg-white/80 px-3 py-1 rounded-full text-xs font-medium text-pink-700">
                                    Click to select
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Style Selection Confirmation Dialog */}
                      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Confirm Style Selection</DialogTitle>
                          </DialogHeader>
                          {selectedStyle && (
                            <div className="space-y-4">
                              <div className="bg-pink-50 p-4 rounded-lg">
                                <h4 className="font-medium">{selectedStyle.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{selectedStyle.description}</p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="font-semibold text-pink-700">${selectedStyle.price}</span>
                                  <span className="text-gray-500">{selectedStyle.duration} min</span>
                                </div>
                              </div>
                              <p className="text-sm">
                                Would you like to select this VMB Style Option? You'll receive personalized offers based on your selection.
                              </p>
                              <div className="flex justify-end gap-3 mt-4">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setShowConfirmDialog(false)}
                                >
                                  Back
                                </Button>
                                <Button
                                  onClick={() => {
                                    // This would save the selection to the database in a real implementation
                                    // Sample API call that would be implemented:
                                    /*
                                    const selection = {
                                      clientId: client.id,
                                      styleId: selectedStyle.id,
                                      salonId: salon.id,
                                      selectedAt: new Date().toISOString(),
                                      notes: `Selected ${selectedStyle.name} from ${salon.name}`
                                    };
                                    
                                    fetch(`/api/clients/${client.id}/style-selections`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(selection)
                                    }).then(response => {
                                      if (response.ok) {
                                        console.log('Style selection saved successfully');
                                        // Invalidate the style selections query to refresh the list
                                        queryClient.invalidateQueries({ queryKey: ['/api/clients', id, 'style-selections'] });
                                      }
                                    });
                                    */
                                    
                                    console.log(`Selected style: ${selectedStyle.name} from salon: ${salon?.name}`);
                                    setShowConfirmDialog(false);
                                    setShowPersonalizedOffers(true);
                                  }}
                                  className="bg-pink-600 hover:bg-pink-700 text-white"
                                >
                                  Confirm
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {/* Previously Selected Styles */}
                      {/* My VMB Offers section - shown after confirming a style option */}
                      {showPersonalizedOffers && selectedStyle && (
                        <div className="mt-8 border-t pt-4">
                          <div className="bg-gradient-to-r from-pink-100 to-pink-50 p-5 rounded-xl border border-pink-200 relative overflow-hidden">
                            <h3 className="font-bold text-lg text-pink-700 mb-3 flex items-center">
                              <StarIcon className="h-5 w-5 mr-2 text-pink-500" />
                              My VMB Offers
                            </h3>
                            
                            <div className="mt-4">
                              <div className="bg-white p-4 rounded-lg shadow-sm border border-pink-100">
                                <div className="flex justify-between items-start">
                                  <h5 className="font-medium text-pink-700">{selectedStyle.name}</h5>
                                  <Badge className="bg-pink-100 text-pink-700">Selected</Badge>
                                </div>
                                
                                <div className="mt-3 flex items-center text-sm text-gray-500">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  <span>Selected on {new Date().toLocaleDateString()}</span>
                                </div>
                                
                                <div className="border-t mt-3 pt-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm"><span className="font-medium">Price:</span> ${selectedStyle.price}</span>
                                    <span className="text-sm"><span className="font-medium">Duration:</span> {selectedStyle.duration} min</span>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 mt-2">
                                    {selectedStyle.description}
                                  </p>
                                </div>
                                
                                <div className="mt-3 text-sm">
                                  <span className="font-medium">Salon:</span> {salon?.name}
                                </div>
                                
                                {/* Next step button */}
                                <div className="mt-4 flex justify-end">
                                  <Button 
                                    onClick={() => setShowCreatePromo(true)}
                                    className="bg-pink-500 hover:bg-pink-600 text-white"
                                  >
                                    Next: Create and Send Invite
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Create Promo Container */}
                            {showCreatePromo && (
                              <div className="mt-4 bg-white p-4 rounded-lg shadow-sm border border-pink-100">
                                <h5 className="font-medium text-pink-700 mb-4">Create Promo</h5>
                                
                                <div className="space-y-4">
                                  <p className="text-sm text-gray-600">
                                    Enter the name and cell/email you are inviting to gift your Ven Me, Baby! treat!
                                  </p>
                                  
                                  {/* Name and Cell on same line */}
                                  <div className="flex gap-2">
                                    {/* Recipient Name Field */}
                                    <input
                                      type="text"
                                      id="recipientName"
                                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                      placeholder="RECIPIENT name"
                                      value={inviteForm.recipientName}
                                      onChange={(e) => setInviteForm({...inviteForm, recipientName: e.target.value})}
                                    />
                                    
                                    {/* Recipient Phone Field */}
                                    <input
                                      type="tel"
                                      id="recipientPhone"
                                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                      placeholder="Cell phone number"
                                      value={inviteForm.recipientPhone}
                                      onChange={(e) => setInviteForm({...inviteForm, recipientPhone: e.target.value})}
                                    />
                                  </div>
                                  
                                  {/* Recipient Email Field - reduced width */}
                                  <div className="flex">
                                    <input
                                      type="email"
                                      id="recipientEmail"
                                      className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                      placeholder="Email address (optional)"
                                      value={inviteForm.recipientEmail}
                                      onChange={(e) => setInviteForm({...inviteForm, recipientEmail: e.target.value})}
                                    />
                                  </div>
                                  
                                  {/* Custom Message Field */}
                                  <textarea
                                    id="message"
                                    rows={4}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    placeholder={`Hi! ${inviteForm.recipientName || '[recpt name]'},\n\nI love this style - ${selectedStyle?.name || '[selected opt]'}. My nails are a mess and ${salon?.ownerName || '[sal own nm]'} has an opening.\n\nI would love a treat from you! Will you Ven Me, Baby! ❤️❤️❤️ ${client.name}`}
                                    value={inviteForm.message}
                                    onChange={(e) => setInviteForm({...inviteForm, message: e.target.value})}
                                  />
                                  
                                  {/* Style Information Display */}
                                  <div className="bg-pink-50 p-3 rounded-md">
                                    <h6 className="font-medium text-pink-700 mb-2">Selected Style</h6>
                                    <div className="flex gap-3">
                                      {selectedStyle?.gifUrl && (
                                        <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden border border-pink-100">
                                          <img 
                                            src={selectedStyle.gifUrl}
                                            alt={selectedStyle.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              console.error(`Error loading style image: ${selectedStyle.gifUrl}`);
                                              e.currentTarget.src = '/assets/VMB_LOGO.png';
                                            }}
                                          />
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-medium">{selectedStyle?.name}</p>
                                        <p className="text-sm">${selectedStyle?.price} <span className="text-xs">(taxes, reg fee included)</span></p>
                                        <p className="text-xs text-gray-600">{salon?.name}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-6 flex justify-between">
                                  <Button 
                                    variant="outline"
                                    className="border-pink-300 text-pink-700"
                                    onClick={() => setShowCreatePromo(false)}
                                  >
                                    Cancel
                                  </Button>
                                  
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline"
                                      className="border-pink-300 text-pink-700"
                                      onClick={() => {
                                        if (!inviteForm.recipientName) {
                                          toast({
                                            variant: "destructive",
                                            title: "Missing Information",
                                            description: "Please enter a recipient name.",
                                          });
                                          return;
                                        }
                                        
                                        if (!inviteForm.recipientPhone && !inviteForm.recipientEmail) {
                                          toast({
                                            variant: "destructive",
                                            title: "Missing Information",
                                            description: "Please enter either a phone number or email.",
                                          });
                                          return;
                                        }
                                        
                                        // Show preview
                                        setShowInvitePreview(true);
                                      }}
                                    >
                                      Preview
                                    </Button>
                                    
                                    <Button 
                                      className="bg-pink-500 hover:bg-pink-600 text-white"
                                      onClick={async () => {
                                        if (!client || !selectedStyle || !salon) return;
                                        
                                        // Validate form
                                        if (!inviteForm.recipientName) {
                                          toast({
                                            variant: "destructive",
                                            title: "Missing Information",
                                            description: "Please enter a recipient name.",
                                          });
                                          return;
                                        }
                                        
                                        if (!inviteForm.recipientPhone && !inviteForm.recipientEmail) {
                                          toast({
                                            variant: "destructive",
                                            title: "Missing Information",
                                            description: "Please enter either a phone number or email.",
                                          });
                                          return;
                                        }
                                        
                                        try {
                                          // Log the VMB invitation to the server for admin tracking
                                          const response = await fetch('/api/vmb-invitations/log', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                              clientId: client.id,
                                              salonId: salon.id,
                                              styleId: selectedStyle.id
                                            }),
                                          });
                                          
                                          if (!response.ok) {
                                            console.error('Failed to log VMB invitation:', await response.text());
                                            toast({
                                              variant: "destructive",
                                              title: "Error",
                                              description: "Failed to create invitation. Please try again.",
                                            });
                                            return;
                                          }
                                          
                                          // Successfully logged
                                          toast({
                                            title: "Success!",
                                            description: "VMB invitation has been sent successfully!",
                                          });
                                          
                                          console.log('VMB invitation logged successfully for admin tracking');
                                          
                                          // Reset form and close
                                          setInviteForm({
                                            recipientName: '',
                                            recipientPhone: '',
                                            recipientEmail: '',
                                            message: ''
                                          });
                                          setShowCreatePromo(false);
                                          
                                        } catch (error) {
                                          console.error('Error sending VMB invitation:', error);
                                          toast({
                                            variant: "destructive",
                                            title: "Error",
                                            description: "An error occurred. Please try again.",
                                          });
                                        }
                                      }}
                                    >
                                      Send It! Ven Me, Baby!
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Invitation Preview Dialog */}
                            <Dialog open={showInvitePreview} onOpenChange={setShowInvitePreview}>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Invitation Preview</DialogTitle>
                                </DialogHeader>
                                
                                <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-5 rounded-lg border border-blue-200 max-w-sm mx-auto">
                                  {/* Message bubble design - Removed the title and made bubble take full width */}
                                  <div className="bg-blue-100 p-4 rounded-tl-xl rounded-tr-xl rounded-br-xl shadow-sm relative ml-4">
                                    <div className="absolute -bottom-2 -left-4 w-4 h-4 bg-blue-100 transform rotate-45"></div>
                                    <p className="text-gray-800 mb-2">
                                      Hi! {inviteForm.recipientName || '[recpt name]'},
                                    </p>
                                    <p className="text-gray-800 mb-4">
                                      I love this style - {selectedStyle?.name || '[selected opt]'}. My nails are a mess and {salon?.ownerName || '[sal own nm]'} has an opening.
                                    </p>
                                    
                                    {/* Image and price inside the message - original position between opening and signature line */}
                                    <div className="bg-white p-2 rounded-lg shadow-sm border border-blue-200 mb-4">
                                      <div className="flex items-center">
                                        {selectedStyle?.gifUrl && (
                                          <div className="w-20 h-20 rounded-lg overflow-hidden border border-blue-300 mr-3">
                                            <img 
                                              src={selectedStyle.gifUrl}
                                              alt={selectedStyle.name}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                e.currentTarget.src = '/assets/VMB_LOGO.png';
                                              }}
                                            />
                                          </div>
                                        )}
                                        <div>
                                          <p className="font-medium text-blue-800">{selectedStyle?.name}</p>
                                          <p className="text-blue-700">${selectedStyle?.price} <span className="text-xs">(taxes, reg fee included)</span></p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <p className="text-gray-800 mb-2">
                                      I would love a treat from you! Will you Ven Me, Baby! ❤️❤️❤️ {client.name}
                                    </p>
                                    
                                    {/* Payment icons as styled buttons */}
                                    <div className="flex justify-between items-center gap-2 mb-2">
                                      <button className="flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors flex-1">
                                        <img src="/assets/venmo.png" alt="Venmo" className="w-6 h-6 mr-1" />
                                        <span className="text-sm font-medium">Venmo</span>
                                      </button>
                                      <button className="flex items-center justify-center bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors flex-1">
                                        <img src="/assets/zelle.png" alt="Zelle" className="w-6 h-6 mr-1" />
                                        <span className="text-sm font-medium">Zelle</span>
                                      </button>
                                      <button className="flex items-center justify-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex-1">
                                        <img src="/assets/cashapp.png" alt="Cash App" className="w-6 h-6 mr-1" />
                                        <span className="text-sm font-medium">Cash App</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between mt-4">
                                  <Button 
                                    variant="outline"
                                    onClick={() => setShowInvitePreview(false)}
                                  >
                                    Edit
                                  </Button>
                                  
                                  <Button 
                                    className="bg-pink-500 hover:bg-pink-600 text-white"
                                    onClick={async () => {
                                      if (!client || !selectedStyle || !salon) return;
                                      
                                      try {
                                        // Log the VMB invitation to the server for admin tracking
                                        const response = await fetch('/api/vmb-invitations/log', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({
                                            clientId: client.id,
                                            salonId: salon.id,
                                            styleId: selectedStyle.id
                                          }),
                                        });
                                        
                                        if (!response.ok) {
                                          console.error('Failed to log VMB invitation:', await response.text());
                                          toast({
                                            variant: "destructive",
                                            title: "Error",
                                            description: "Failed to create invitation. Please try again.",
                                          });
                                          return;
                                        }
                                        
                                        // Successfully logged
                                        toast({
                                          title: "Success!",
                                          description: "VMB invitation has been sent successfully!",
                                        });
                                        
                                        console.log('VMB invitation logged successfully for admin tracking');
                                        
                                        // Reset form and close dialogs
                                        setInviteForm({
                                          recipientName: '',
                                          recipientPhone: '',
                                          recipientEmail: '',
                                          message: ''
                                        });
                                        setShowInvitePreview(false);
                                        setShowCreatePromo(false);
                                        
                                      } catch (error) {
                                        console.error('Error sending VMB invitation:', error);
                                        toast({
                                          variant: "destructive",
                                          title: "Error",
                                          description: "An error occurred. Please try again.",
                                        });
                                      }
                                    }}
                                  >
                                    Confirm & Send
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      )}
                      
                      {styleSelections && styleSelections.length > 0 && (
                        <div className="mt-8 border-t pt-4">
                          <h3 className="font-semibold text-pink-700 mb-3">Your Selected Styles</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {styleSelections.map(selection => {
                              // Find the corresponding service
                              const service = salon?.services?.find(s => s.id === selection.styleId);
                              return (
                                <div 
                                  key={selection.id}
                                  className="border rounded-lg p-3 bg-green-50 border-green-200"
                                >
                                  <div className="flex justify-between">
                                    <span className="font-medium text-green-700">
                                      {service ? service.name : `Style #${selection.styleId}`}
                                    </span>
                                    <Badge className="bg-green-100 text-green-700">Selected</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Selected on {new Date(selection.selectedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* SHARE VMB Section - MOVED DOWN */}
                      <div className="mt-8 border-t pt-2">
                        <h3 className="font-semibold text-pink-700 mb-2">SHARE VMB</h3>
                        <Card className="shadow-sm overflow-hidden">
                          <CardHeader className="bg-pink-50 pb-3 pt-2">
                            <CardTitle className="text-sm">Invite Your Friends</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <ClientInviteForm clientId={client.id} hideLabels={true} onSuccess={() => {
                              // Refresh the invitations list
                              toast({
                                title: "Invitation Sent",
                                description: "Your invitation has been sent successfully!"
                              });
                            }} />
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Recent VMB Invitations Sent - MOVED UP */}
                      <div className="mt-4 border-t pt-2">
                        <h3 className="font-semibold text-pink-700 mb-2">YOUR VMB GIFTS</h3>
                        <div className="mb-2">
                          <InlineVmbInvitations clientId={client.id} />
                        </div>
                      </div>
                    </div>
                  ) : salonLoading ? (
                    <p>Loading salon information...</p>
                  ) : (
                    <p>Salon information not available</p>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Invitations Card - MOVED UP */}
            {invitations && invitations.length > 0 && (
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <CardHeader className="bg-pink-50 pb-3 pt-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-pink-700">
                    <StarIcon className="h-4 w-4" />
                    Your Invitations
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <InlineVmbInvitations clientId={client.id} />
                </CardContent>
              </Card>
            )}
            
            {/* Standalone SHARE VMB Card - MOVED DOWN - shown whether client has a salon or not */}
            {!client.salonId && (
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <CardHeader className="bg-pink-50 pb-3 pt-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-pink-700">
                    SHARE VMB
                  </CardTitle>
                  <CardDescription>
                    Invite your friends to join Ven Me, Baby!
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <ClientInviteForm clientId={client.id} hideLabels={true} onSuccess={() => {
                    toast({
                      title: "Invitation Sent",
                      description: "Your invitation has been sent successfully!"
                    });
                  }} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}