/**
 * InvitationPreview - A simplified static preview component for invitations
 * 
 * ✅ WORKS EXACTLY AS INTENDED
 * 🚫 DO NOT MODIFY WITHOUT FULL RETEST
 * 
 * This is a hook-safe alternative to InvitationPage.tsx for viewing invitations.
 * It intentionally avoids conditional hook calls and complex state management.
 */

import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, CalendarIcon, CheckCircleIcon } from "lucide-react";
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

export default function InvitationPreview() {
  const { hash } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  
  // Fetch invitation by hash
  const { 
    data: invitation,
    isLoading: invitationLoading,
    error: invitationError
  } = useQuery<Invitation>({
    queryKey: ['/api/invitations/by-hash', hash],
    queryFn: async () => {
      const response = await fetch(`/api/invitations/by-hash/${hash}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch invitation: ${response.status}`);
      }
      return response.json();
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
      const response = await fetch(`/api/salons/${invitation?.salonId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch salon: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!invitation?.salonId,
  });

  // Set loading state based on queries
  useEffect(() => {
    setLoading(invitationLoading || salonLoading);
  }, [invitationLoading, salonLoading]);

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
                <h2 className="text-2xl font-bold text-red-500 mb-2">Invitation Not Found</h2>
                <p>The invitation you're looking for doesn't exist or has expired.</p>
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-0.5">
        <Card className="shadow-sm">
          <CardHeader className={`${isSalonInvitation ? 'bg-amber-50' : 'bg-pink-50'} pb-0.5`}>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className={`text-2xl ${isSalonInvitation ? 'text-amber-700' : 'text-pink-700'}`}>
                  {isSalonInvitation ? 
                    `Salon Invitation for ${invitation.name}` : 
                    `Ven Me, Baby! Gift Request for ${invitation.name}`}
                </CardTitle>
                <div className="flex items-center justify-between gap-4 mt-0.5">
                  <p className="text-gray-600">
                    From {invitation.sponsor || invitation.salonName || salon?.name || "Unknown Salon"}
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
                  styleOption={invitation.favoriteServices?.[0] || "Selected Style"}
                  senderName={invitation.sponsor || salon?.name || "Your Stylist"}
                  salonName={salon?.name}
                  imageUrl={"/assets/french-tips.png"} // Default image
                  salonInitiated={isSalonInvitation}
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
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className={isSalonInvitation ? 
                  "border-amber-200 text-amber-700 hover:bg-amber-50" : 
                  "border-pink-200 text-pink-700 hover:bg-pink-50"}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}