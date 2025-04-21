import { Link, useLocation, useParams } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ScissorsIcon, 
  ChevronUpIcon, 
  ChevronDownIcon, 
  StarIcon,
  ClockIcon,
  UserIcon,
  SendIcon
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import EditableClientInfo from '@/components/dashboard/EditableClientInfo';
import ClientInvitation from '@/components/dashboard/ClientInvitation';
import InlineVmbInvitations from '@/components/dashboard/InlineVmbInvitations';
import { useStatus } from '@/contexts/StatusContext';

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
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { setStatusMessage, clearStatusMessage } = useStatus();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [, navigate] = useLocation();
  
  // State for client view options
  const [isEditing, setIsEditing] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showGiftOptions, setShowGiftOptions] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPersonalizedOffers, setShowPersonalizedOffers] = useState(false);
  const [showCreatePromo, setShowCreatePromo] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    message: 'I\'d love for you to try my favorite salon! You\'ll get a special offer when you visit.',
  });
  const [inviteSent, setInviteSent] = useState(false);
  const [formErrors, setFormErrors] = useState({
    recipientName: false,
    recipientPhone: false,
  });
  
  // Fetch client data
  const { data: client, isLoading: clientLoading, error: clientError, isError: isClientError } = 
    useQuery<ClientData>({
      queryKey: ['/api/clients', id],
      enabled: !!id,
    });
  
  // Fetch salon data if client has a salonId
  const { data: salon, isLoading: salonLoading, error: salonError } = 
    useQuery<SalonData>({
      queryKey: ['/api/salons', client?.salonId],
      enabled: !!client?.salonId,
    });
  
  // Fetch invitations for this client
  const { data: invitations } = 
    useQuery<Invitation[]>({
      queryKey: ['/api/invitations', { clientId: id }],
      enabled: !!id,
    });
  
  // Function to validate invite form
  const validateInviteForm = () => {
    const errors = {
      recipientName: false,
      recipientPhone: false,
    };
    
    if (!inviteForm.recipientName.trim()) {
      errors.recipientName = true;
    }
    
    if (!inviteForm.recipientPhone.trim()) {
      errors.recipientPhone = true;
    }
    
    setFormErrors(errors);
    return !errors.recipientName && !errors.recipientPhone;
  };
  
  // Function to send an invitation
  const sendInvitation = async () => {
    if (!validateInviteForm()) {
      return;
    }
    
    setStatusMessage('Processing...');
    
    try {
      // Simulated data for now
      const invitationData = {
        name: inviteForm.recipientName,
        phone: inviteForm.recipientPhone,
        email: inviteForm.recipientEmail || null,
        clientId: client?.id,
        salonId: client?.salonId,
        sponsor: client?.name,
        message: inviteForm.message,
        status: 'pending'
      };
      
      // Log the invitation data
      console.log('Sending invitation:', invitationData);
      
      // For now, just simulate a successful invite
      // In production, this would be an actual API call
      setTimeout(() => {
        setInviteSent(true);
        setStatusMessage('TASK COMPLETE');
        
        // Clear after 2 seconds
        setTimeout(() => {
          clearStatusMessage();
        }, 2000);
        
        toast({
          title: 'Invitation Sent',
          description: `Your invitation to ${inviteForm.recipientName} has been sent!`,
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error sending invitation', error);
      setStatusMessage('Error sending invitation');
      
      toast({
        title: 'Error',
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  if (clientLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator />
      </div>
    );
  }
  
  if (isClientError || !client) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-50 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold text-red-700">Error Loading Client</h2>
          <p className="text-red-600">{clientError instanceof Error ? clientError.message : 'Unable to load client data'}</p>
        </div>
        
        <Button onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="max-w-4xl mx-auto pt-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-pink-700">
            Welcome, {client.name}!
          </h1>
          
          <Button 
            variant="outline"
            className="text-pink-600 border-pink-200 hover:bg-pink-50"
            onClick={() => setShowEditDialog(true)}
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
        
        <div className="space-y-6">
          
          {/* Edit Client Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Your Profile</DialogTitle>
                <DialogDescription>Update your contact information and preferences</DialogDescription>
              </DialogHeader>
              
              {client && (
                <EditableClientInfo 
                  client={client}
                  onSave={() => {
                    setShowEditDialog(false);
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
              <CardHeader className="bg-pink-50 pb-2 pt-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-pink-700">
                    <ScissorsIcon className="h-4 w-4" />
                    Your Ven Me, Baby! Dashboard
                  </CardTitle>
                  {salon && (
                    <CardDescription>Member of {salon.name}</CardDescription>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                {salon ? (
                  <div className="space-y-4">
                    {/* Ven Me, Baby! Gift Options - Direct display without salon contact info */}
                    {salon?.services && salon.services.length > 0 && (
                      <div className="border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-pink-100 to-pink-50 py-2 px-4 border-b border-pink-200">
                          <h3 className="text-base font-medium text-pink-700 flex justify-between items-center">
                            <span>Pick Your Next Ven Me, Baby! Gift</span>
                            <button 
                              onClick={() => setShowGiftOptions(!showGiftOptions)} 
                              className="flex items-center text-sm text-pink-600 hover:text-pink-800"
                              aria-label={showGiftOptions ? "Hide gift options" : "Show gift options"}
                            >
                              {showGiftOptions ? (
                                <ChevronUpIcon className="h-5 w-5" />
                              ) : (
                                <ChevronDownIcon className="h-5 w-5" />
                              )}
                            </button>
                          </h3>
                        </div>
                        <div className={`p-4 bg-white ${showGiftOptions ? 'block' : 'hidden'}`}>
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
                              Would you like to select this Ven Me, Baby! Gift? You'll receive personalized offers based on your selection.
                            </p>
                            <div className="flex justify-between mt-4">
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
                            My Ven Me, Baby! Offers
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
                                  placeholder="Enter a personalized message (optional)"
                                  value={inviteForm.message}
                                  onChange={(e) => setInviteForm({...inviteForm, message: e.target.value})}
                                />
                                
                                {/* Show Form Errors */}
                                {(formErrors.recipientName || formErrors.recipientPhone) && (
                                  <div className="text-red-500 text-sm">
                                    Please enter both a name and phone number for your invitation.
                                  </div>
                                )}
                                
                                {/* Send Invitation Button */}
                                {!inviteSent ? (
                                  <div className="flex justify-end">
                                    <Button 
                                      onClick={sendInvitation}
                                      className="bg-pink-600 hover:bg-pink-700 text-white"
                                    >
                                      <SendIcon className="h-4 w-4 mr-2" />
                                      Send Invitation
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
                                    <h6 className="text-green-700 font-medium">Invitation Sent!</h6>
                                    <p className="text-sm text-green-600 mt-1">Your invitation to {inviteForm.recipientName} has been sent successfully.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* SHARE Ven Me, Baby! section */}
                    <div className="mt-8 border-t pt-2">
                      <div className="border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-pink-100 to-pink-50 py-2 px-4 border-b border-pink-200">
                          <h3 className="text-base font-medium text-pink-700">
                            SHARE Ven Me, Baby!, WITH YOUR FRIENDS, SO'S, BF, BFF...NOW!
                          </h3>
                        </div>
                        <div className="p-4 bg-white">
                          <ClientInvitation 
                            clientId={client.id} 
                            clientName={client.name} 
                            salonId={client.salonId} 
                            salonName={salon.name} 
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Recent VMB Invitations Sent - MOVED UP */}
                    <div className="mt-4 border-t pt-2">
                      <h3 className="font-semibold text-pink-700 mb-2">Your Ven Me, Baby! Dashboard</h3>
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
              <CardHeader className="bg-pink-50 pb-2 pt-2">
                <div>
                  <CardTitle className="text-lg text-pink-700">
                    Your Ven Me, Baby! Invitations
                  </CardTitle>
                  <CardDescription>
                    Invitations you've received from salons
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mt-2">
                  {invitations.map((invitation: Invitation) => (
                    <div key={invitation.id} className="p-3 border rounded-lg bg-pink-50">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{invitation.salonName || 'Unknown Salon'}</h4>
                        <Badge className={
                          invitation.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                          invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-gray-100 text-gray-700'
                        }>
                          {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Invited by: {invitation.sponsor || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Sent on: {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Client Info Card */}
          <Card className="rounded-xl shadow-sm overflow-hidden">
            <CardHeader className="bg-pink-50 pb-2 pt-2">
              <div>
                <CardTitle className="text-lg text-pink-700">
                  Your Profile
                </CardTitle>
                <CardDescription>
                  Your contact information and preferences
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <EditableClientInfo
                client={client}
                onSave={() => setIsEditing(false)}
                defaultEditing={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}