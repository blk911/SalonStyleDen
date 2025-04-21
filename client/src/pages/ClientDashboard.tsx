import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EditableClientInfo from "@/components/dashboard/EditableClientInfo";
import InlineVmbInvitations from "@/components/dashboard/InlineVmbInvitations";
import ClientInviteForm from "@/components/dashboard/ClientInviteForm";
import { useToast } from "@/hooks/use-toast";
import { 
  PencilIcon, 
  GiftIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from "lucide-react";

// Define client interface
interface ClientData {
  id: number;
  name: string;
  phone: string;
  email: string;
  isCurrentClient: boolean;
  acceptedTerms?: boolean;
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
  
  // State for collapsible sections
  const [showShareForm, setShowShareForm] = useState(true);
  const [showInvitations, setShowInvitations] = useState(true);
  
  // Show "Complete Your Profile" dialog for newly validated clients
  const [showCompleteProfileDialog, setShowCompleteProfileDialog] = useState(false);
  
  // Fetch client data
  const { data: client, isLoading: clientLoading, error: clientError } = useQuery<ClientData>({
    queryKey: ['/api/clients', id],
    queryFn: async () => {
      try {
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
      const response = await fetch(`/api/salons/${client?.salonId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch salon: ${response.status}`);
      }
      return await response.json();
    },
    enabled: !!client?.salonId, // Only run if client has a salonId
  });
  
  // Fetch client's invitations
  const { data: invitations, isLoading: invitationsLoading } = useQuery<Invitation[]>({
    queryKey: ['/api/invitations', 'client', id],
    queryFn: async () => {
      const response = await fetch(`/api/invitations?clientId=${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch invitations: ${response.status}`);
      }
      return await response.json();
    },
    enabled: !!client,
  });

  // Check client's registration status when data is loaded
  useEffect(() => {
    if (client && client.acceptedTerms !== true) {
      setShowCompleteProfileDialog(true);
    } else {
      setShowCompleteProfileDialog(false);
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
        {/* Header */}
        <section className="bg-gradient-to-r from-pink-100 to-pink-50 py-2 border-b border-pink-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center">
                <div className="ml-4">
                  <h1 className="font-bold text-2xl text-pink-700">Ven Me, Baby! Dashboard</h1>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                <div className="flex space-x-4">
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

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="space-y-6">
            
            {/* Edit Profile Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Edit Your Profile</DialogTitle>
                </DialogHeader>
                <EditableClientInfo 
                  client={client} 
                  onSave={() => {
                    setIsEditing(false);
                    toast({
                      title: "Profile Updated",
                      description: "Your profile has been updated successfully."
                    });
                  }}
                />
              </DialogContent>
            </Dialog>
            
            {/* Invitations Section */}
            <Card className="rounded-xl shadow-sm overflow-hidden">
              <CardHeader className="bg-pink-50 pb-2 pt-2">
                <CardTitle className="text-lg flex items-center justify-between gap-2 text-pink-700">
                  <span className="flex items-center gap-2">
                    <span>Your Ven Me, Baby! Gift Box</span>
                    {invitations && invitations.length > 0 && invitations.some(inv => inv.status === 'pending') && (
                      <Badge className="bg-red-500 text-white ml-2 animate-pulse">
                        New
                      </Badge>
                    )}
                  </span>
                  <button 
                    onClick={() => setShowInvitations(!showInvitations)} 
                    className="flex items-center text-sm text-pink-600 hover:text-pink-800"
                    aria-label={showInvitations ? "Hide invitations" : "Show invitations"}
                  >
                    {showInvitations ? (
                      <ChevronUpIcon className="h-5 w-5" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5" />
                    )}
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className={`pt-4 ${showInvitations ? 'block' : 'hidden'}`}>
                <InlineVmbInvitations clientId={client.id} />
              </CardContent>
            </Card>
            
            {/* Share Network Card - Only show if client has no salon */}
            {!client.salonId && (
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <CardHeader className="bg-pink-50 pb-2 pt-2">
                  <CardTitle className="text-lg flex items-center justify-between gap-2 text-pink-700">
                    <span>{client.name}'s SHARE Network</span>
                    <button 
                      onClick={() => setShowShareForm(!showShareForm)} 
                      className="flex items-center text-sm text-pink-600 hover:text-pink-800"
                      aria-label={showShareForm ? "Hide invitation form" : "Show invitation form"}
                    >
                      {showShareForm ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className={`pt-4 ${showShareForm ? 'block' : 'hidden'}`}>
                  <ClientInviteForm 
                    clientId={client.id}
                    hideLabels={true}
                    hideToggle={true}
                    onSuccess={() => {
                      toast({
                        title: "Invitation Sent",
                        description: "Your invitation has been sent successfully!"
                      });
                    }} 
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}// VMB_DASH_RESTRUCTURE_MARKER_20250421