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
                  <p className="text-gray-600">
                    <span className="inline-flex items-center">
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Member since {new Date(client.createdAt).toLocaleDateString()}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                <Button 
                  variant="outline" 
                  className="border-pink-300 text-pink-700 hover:bg-pink-50 flex items-center gap-2"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <PencilIcon className="h-4 w-4" />
                  {isEditing ? "Cancel Editing" : "Edit Profile"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="styles">VMB Promos</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
            </TabsList>
            
            {/* DASHBOARD TAB */}
            <TabsContent value="dashboard" className="space-y-6">
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
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2 text-pink-700">
                          <ScissorsIcon className="h-4 w-4" />
                          Your Salon
                        </CardTitle>
                        {salon && (
                          <CardDescription>Member of {salon.name}</CardDescription>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-pink-300 text-pink-700 hover:bg-pink-50"
                        onClick={() => window.location.href = `/salon/${salon.id}`}
                      >
                        View Salon Page
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    {salon ? (
                      <div className="space-y-4">
                        {/* Salon contact info */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-700">Phone:</span>
                            <span className="text-gray-800">{salon.phone}</span>
                          </div>
                          {salon.address && (
                            <div className="flex items-start gap-2">
                              <MapPinIcon className="h-4 w-4 text-gray-500 mt-1" />
                              <div>
                                <span className="font-medium text-gray-700">Address:</span>
                                <p className="text-gray-800">
                                  {salon.address}<br />
                                  {salon.city}, {salon.state} {salon.zipCode}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* VMB Style Options */}
                        {salon.services && salon.services.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-gray-100">
                            <h3 className="text-base font-medium text-pink-700 mb-3">VMB Style Options</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {salon.services.filter(service => service.featured === true).map((service: any) => (
                                <div key={service.id} className="flex gap-3 p-3 border rounded-lg bg-pink-50 hover:bg-pink-100 transition-colors">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">{service.name}</h4>
                                    <p className="text-xs text-gray-600 mt-1">{service.description}</p>
                                    <div className="flex justify-between items-center mt-2">
                                      <span className="text-xs font-semibold text-pink-700">${service.price}</span>
                                      <span className="text-xs text-gray-500">{service.duration} min</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
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
            </TabsContent>
            
            {/* VMB PROMOS TAB */}
            <TabsContent value="styles" className="space-y-6">
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <CardHeader className="bg-pink-50 pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-pink-700">
                    <ScissorsIcon className="h-4 w-4" />
                    Ven Me, Baby! Promos
                  </CardTitle>
                  <CardDescription>
                    Check out special promotions and select your preferred styles
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-4">
                  {client.salonId && salon?.services && id ? (
                    <VmbStyleOptions 
                      services={salon.services} 
                      clientId={parseInt(id)} 
                      salonId={salon.id}
                    />
                  ) : (
                    <div className="text-center p-6">
                      <p className="text-gray-500">
                        {client.salonId ? 
                          "VMB Style Options" :
                          "You're not currently associated with a salon. VMB Style Options will appear here once you're linked to a salon."}
                      </p>
                    </div>
                  )}
                  
                  {/* Previously Selected Styles */}
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
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* APPOINTMENTS TAB */}
            <TabsContent value="appointments" className="space-y-6">
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <CardHeader className="bg-pink-50 pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-pink-700">
                    <CalendarIcon className="h-4 w-4" />
                    Your Appointments
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <div className="text-center py-6">
                    <p className="text-gray-500">No upcoming appointments scheduled.</p>
                    <Button 
                      variant="default" 
                      className="mt-4 bg-pink-500 hover:bg-pink-600"
                    >
                      Request Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Loyalty/Rewards Card */}
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <CardHeader className="bg-pink-50 pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-pink-700">
                    <StarIcon className="h-4 w-4" />
                    Loyalty & Rewards
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <div className="text-center py-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-4">
                      <StarIcon className="h-8 w-8 text-pink-500" />
                    </div>
                    <h3 className="font-medium text-lg">0 Points</h3>
                    <p className="text-sm text-gray-500 mt-2">Complete appointments to earn rewards!</p>
                    
                    <div className="mt-6 p-3 border rounded-lg bg-pink-50 max-w-md mx-auto">
                      <h4 className="font-medium text-pink-700">New Client Promotion</h4>
                      <p className="text-sm mt-1">
                        Get 20% off your first appointment when you select a style above!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}