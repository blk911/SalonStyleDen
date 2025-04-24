import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PhoneIcon, MailIcon, CalendarIcon, UserIcon, ClockIcon, BuildingIcon, CheckCircleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Invitation {
  id: number;
  name: string;
  phone: string;
  email: string;
  message?: string | null;
  type?: string | null;
  notes?: string;
  favoriteServices?: string[];
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

export default function CompleteInvitationPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Fetch invitation by ID
  const { 
    data: invitation,
    isLoading: invitationLoading,
    error: invitationError
  } = useQuery<Invitation>({
    queryKey: ['/api/invitations', id],
    queryFn: async () => {
      const response = await fetch(`/api/invitations/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch invitation: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!id,
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-6">
        <Card className="shadow-sm">
          <CardHeader className="bg-emerald-50 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl text-emerald-700">
                  Complete Invitation #{invitation.id}
                </CardTitle>
                <div className="flex items-center justify-between gap-4 mt-1">
                  <CardDescription>From {invitation.sponsor || invitation.salonName || "Unknown Salon"}</CardDescription>
                  
                  {invitation.type === 'client_invitation' && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      Client Referral
                    </Badge>
                  )}
                  
                  {salon && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50" 
                      onClick={() => setLocation(`/salon/${salon.id}`)}
                    >
                      View Salon Page
                    </Button>
                  )}
                </div>
              </div>
              <Badge className={`
                ${invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : ''}
                ${invitation.status === 'accepted' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                ${invitation.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                ${invitation.status === 'complete' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : ''}
              `}>
                {invitation.status || 'pending'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="bg-white p-6 rounded-md border border-emerald-100">
              <h2 className="text-xl font-bold text-emerald-700 mb-4">
                Ven Me, Baby! Final Invitation
              </h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800">Recipient Information</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{invitation.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 text-emerald-500" />
                    <span>{formatPhone(invitation.phone)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4 text-emerald-500" />
                    <span>{invitation.email}</span>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800">Invitation Details</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <BuildingIcon className="h-4 w-4 text-emerald-500" />
                    <span>Salon: {invitation.salonName || salon?.name || "Unknown Salon"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-emerald-500" />
                    <span>Invited on: {formatDate(invitation.createdAt)}</span>
                  </div>
                  {invitation.firstServiceDate && (
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 text-emerald-500" />
                      <span>First Service Date: {formatDate(invitation.firstServiceDate)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {invitation.message && (
                <>
                  <Separator className="my-4" />
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800">Message</h3>
                    <div className="mt-2 p-4 bg-gray-50 rounded-md italic text-gray-700">
                      "{invitation.message}"
                    </div>
                  </div>
                </>
              )}
              
              {invitation.favoriteServices && invitation.favoriteServices.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-800">Favorite Services</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {invitation.favoriteServices.map((service, index) => (
                        <Badge key={index} className="bg-pink-100 text-pink-800 border-pink-200">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>

          <CardFooter className="border-t pt-4 flex justify-between">
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
            {salon && (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setLocation(`/salon/${salon.id}`)}
              >
                Visit Salon Page
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}