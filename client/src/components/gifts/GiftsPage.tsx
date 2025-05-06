import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLinkIcon, HeartIcon, PlusCircleIcon, UserPlusIcon, XIcon } from "lucide-react";
import GiftCreationFlow from "./GiftCreationFlow";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";

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
  status: string;
  inviteHash: string;
  createdAt: string;
}

interface GiftsPageProps {
  clientId?: number;
  salonId?: number;
}

export default function GiftsPage({ clientId }: GiftsPageProps) {
  const [showGiftCreation, setShowGiftCreation] = useState(false);
  const [showSentGifts, setShowSentGifts] = useState(true);
  const [showReceivedGifts, setShowReceivedGifts] = useState(true);
  const [, setLocation] = useLocation();
  
  // Query for the current client's name to use in filters
  const { data: clientData } = useQuery({
    queryKey: ['/api/clients/data', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) throw new Error('Failed to fetch client data');
      return response.json();
    },
    enabled: !!clientId
  });

  // Query for received gifts (where this client is the recipient - by phone number matching)
  const { data: receivedGifts, isLoading: isLoadingReceived } = useQuery({
    queryKey: ['/api/invitations/received', clientId, clientData?.name],
    queryFn: async () => {
      if (!clientId || !clientData?.name) return [];
      const params = new URLSearchParams();
      params.set('name', clientData.name);
      const response = await fetch(`/api/invitations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch received gifts');
      const allInvitations = await response.json() as Invitation[];
      
      // Filter out self-gifts (where sender ID matches this client's ID)
      return allInvitations.filter(invitation => 
        invitation.senderId !== clientId && 
        invitation.senderId !== undefined
      );
    },
    enabled: !!clientId && !!clientData?.name
  });
  
  // Query for sent gifts (where this client is the sender)
  const { data: allClientInvitations, isLoading: isLoadingSent } = useQuery({
    queryKey: ['/api/invitations/all', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const params = new URLSearchParams();
      params.set('clientId', clientId.toString());
      const response = await fetch(`/api/invitations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch invitations');
      return response.json() as Promise<Invitation[]>;
    },
    enabled: !!clientId
  });
  
  // Filter the gifts that were actually sent BY this client (where senderId matches clientId)
  const sentGifts = allClientInvitations?.filter(gift => gift.senderId === clientId) || [];
  
  return (
    <div className="space-y-4 w-full">
      {/* SHARE VMB Card - Always shown whether client has a salon or not */}
      <Card className="rounded-xl shadow-sm overflow-hidden">
        <div className="bg-pink-50 pt-5 pb-2.5 flex justify-center items-center">
          <div className="flex items-center gap-1.5 text-sm">
            <HeartIcon className="h-3.5 w-3.5 text-red-500" />
            <span>
              <span className="text-black font-semibold">Ven Me,</span>
              <span className="text-pink-600 italic font-semibold">Baby!</span>
              <span className="text-gray-600"> Make Connections Personal!</span>
            </span>
            <HeartIcon className="h-3.5 w-3.5 text-red-500" />
          </div>
        </div>
        <CardContent className="pt-4">
          {!showGiftCreation ? (
            <div 
              className="border rounded-lg p-4 bg-gradient-to-r from-pink-50 to-pink-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-pointer"
              onClick={() => setShowGiftCreation(true)}
            >
              <div className="p-2 bg-white rounded-full">
                <PlusCircleIcon className="h-6 w-6 text-pink-500" />
              </div>
              <div className="flex-1 text-center">
                <h3 className="text-lg font-medium text-pink-800">Create Gift Request</h3>
                <p className="text-sm text-pink-700">Send an Invitation for Connection</p>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-pink-800">Create Gift Request</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowGiftCreation(false)}
                  className="h-8 w-8 p-0"
                >
                  <XIcon className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              
              {clientId ? (
                <GiftCreationFlow 
                  clientId={clientId as number} 
                  onComplete={() => {
                    setShowGiftCreation(false);
                    // Force refresh of the sent gifts query after closing
                    window.location.reload();
                  }}
                />
              ) : (
                <div className="text-center p-6 border border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-500">Unable to create a gift - no client ID available</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
  

      {/* Single line header for received gifts */}
      {receivedGifts && receivedGifts.length > 0 && (
        <div className="mt-4 border rounded-lg p-4 bg-yellow-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-amber-800">Gifts Received</h3>
            <div className="flex items-center gap-8">
              <span className="text-sm font-medium text-amber-800">GIFT</span>
              <span className="text-sm font-medium text-amber-800">STATUS</span>
            </div>
          </div>
          <div className="space-y-2">
            {receivedGifts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(gift => (
              <div key={gift.id} className="flex items-center justify-between py-2 px-4 bg-white rounded-lg border border-yellow-200 shadow-sm">
                <div className="flex items-center gap-2 flex-grow">
                  <HeartIcon className="h-4 w-4 text-yellow-600" />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium">
                        Gift from <span className="font-semibold text-amber-700">{gift.sponsor || "Unknown"}</span>
                      </p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-gray-500">{new Date(gift.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{gift.message || "Personal gift invitation"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 ml-2">
                  <Link
                    to={`/invitation-preview/${gift.inviteHash}`}
                    className="text-xs text-amber-600 font-medium hover:text-amber-800 flex items-center gap-1 whitespace-nowrap"
                  >
                    <ExternalLinkIcon className="h-3 w-3" />
                    View
                  </Link>
                  
                  {gift.status.toLowerCase() === 'pending' ? (
                    <Button 
                      variant="outline"
                      size="sm"
                      className="h-7 py-0 px-3 whitespace-nowrap bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 text-xs"
                      onClick={async () => {
                        try {
                          // Update the invitation status to accepted
                          const response = await fetch(`/api/invitations/${gift.id}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'accepted' })
                          });
                          
                          if (!response.ok) throw new Error('Failed to update status');
                          
                          // Navigate to the invitation preview page
                          setLocation(`/invitation-preview/${gift.inviteHash}`);
                        } catch (error) {
                          console.error('Error accepting gift:', error);
                          // Navigate anyway as fallback
                          setLocation(`/invitation-preview/${gift.inviteHash}`);
                        }
                      }}
                    >
                      Accept
                    </Button>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      gift.status.toLowerCase() === 'accepted' ? 'bg-green-100 text-green-700' : 
                      gift.status.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {gift.status.charAt(0).toUpperCase() + gift.status.slice(1).toLowerCase()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Single line display of sent gifts */}
      {sentGifts && sentGifts.length > 0 && (
        <div className="mt-4 border rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-800">Gifts Sent ({sentGifts.length})</h3>
            <div className="flex items-center gap-8">
              <span className="text-sm font-medium text-green-800">GIFT</span>
              <span className="text-sm font-medium text-green-800">STATUS</span>
            </div>
          </div>
          
          <div className="space-y-2">
            {sentGifts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(gift => (
              <div key={gift.id} className="flex items-center justify-between py-2 px-4 bg-white rounded-lg border border-green-200 shadow-sm">
                <div className="flex items-center gap-2 flex-grow">
                  <UserPlusIcon className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium">
                        Gift to <span className="font-semibold text-green-700">{gift.name}</span>
                      </p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-gray-500">{new Date(gift.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{gift.message || "Personal gift invitation"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 ml-2">
                  <Link
                    to={`/invitation-preview/${gift.inviteHash}`}
                    className="text-xs text-green-600 font-medium hover:text-green-800 flex items-center gap-1 whitespace-nowrap"
                  >
                    <ExternalLinkIcon className="h-3 w-3" />
                    View
                  </Link>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    gift.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                    gift.status.toLowerCase() === 'accepted' ? 'bg-green-100 text-green-700' : 
                    gift.status.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {gift.status.charAt(0).toUpperCase() + gift.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}