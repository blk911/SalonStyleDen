import { useState } from "react";
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
import { getImageUrl } from "@/lib/utils";
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
  const [isEditing, setIsEditing] = useState(false);
  
  // State for VMB Style Options selection
  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPersonalizedOffers, setShowPersonalizedOffers] = useState(false);

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
      <main className="flex-grow">
        {/* Hero Section with Client Info */}
        <section className="bg-gradient-to-r from-pink-100 to-pink-50 py-8 border-b border-pink-200">
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                    setShowConfirmDialog(false);
                                    setShowPersonalizedOffers(true);
                                    // Here you would also save the selection to the database
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
                      {/* Personalized VMB Offers section - shown after confirming a style option */}
                      {showPersonalizedOffers && selectedStyle && (
                        <div className="mt-8 border-t pt-4">
                          <div className="bg-gradient-to-r from-pink-100 to-pink-50 p-5 rounded-xl border border-pink-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-200/30 rounded-full -mt-8 -mr-8"></div>
                            <h3 className="font-bold text-lg text-pink-700 mb-3 flex items-center">
                              <StarIcon className="h-5 w-5 mr-2 text-pink-500" />
                              Personalized VMB Offers
                            </h3>
                            <p className="text-sm mb-4">
                              Based on your selection of <span className="font-medium">{selectedStyle.name}</span>, 
                              we've prepared these exclusive offers just for you!
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                              <div className="bg-white p-4 rounded-lg shadow-sm border border-pink-100">
                                <h4 className="font-medium text-pink-700">First-Time Client Special</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  Get 15% off your first appointment when you book within the next 7 days!
                                </p>
                                <div className="mt-3">
                                  <Badge className="bg-pink-100 text-pink-700">Expires in 7 days</Badge>
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-lg shadow-sm border border-pink-100">
                                <h4 className="font-medium text-pink-700">Style Bundle Discount</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  Book this style with any other service and receive a 10% bundle discount!
                                </p>
                                <div className="mt-3">
                                  <Badge className="bg-pink-100 text-pink-700">Limited Time</Badge>
                                </div>
                              </div>
                            </div>
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
                    </div>
                  ) : salonLoading ? (
                    <p>Loading salon information...</p>
                  ) : (
                    <p>Salon information not available</p>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Invitations Card */}
            {invitations && invitations.length > 0 && (
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <CardHeader className="bg-pink-50 pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-pink-700">
                    <StarIcon className="h-4 w-4" />
                    Your Invitations
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {invitations.map(invitation => (
                      <div 
                        key={invitation.id}
                        className="flex flex-col p-3 border rounded-lg hover:bg-pink-50 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Invited by {invitation.sponsor || invitation.salonName}</h3>
                          <Badge 
                            variant="outline" 
                            className={`
                              ${invitation.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                              ${invitation.status === 'style_selected' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                              ${invitation.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                            `}
                          >
                            {invitation.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Sent on {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                        {invitation.firstServiceDate && (
                          <p className="text-sm flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" /> 
                            First appointment: {invitation.firstServiceDate}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
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