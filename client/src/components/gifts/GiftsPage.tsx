import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLinkIcon, HeartIcon, PlusCircleIcon, UserPlusIcon, XIcon } from "lucide-react";
import GiftCreationFlow from "./GiftCreationFlow";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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
      return response.json() as Promise<Invitation[]>;
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
                    // Invalidate queries to refresh gift data
                    queryClient.invalidateQueries({ queryKey: ['/api/invitations/all', clientId] });
                    queryClient.invalidateQueries({ queryKey: ['/api/invitations/received', clientId] });
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
  

      {/* Single line display of sent gifts */}
      {sentGifts && sentGifts.length > 0 && (
        <div className="mt-4 border rounded-lg p-4 bg-green-50">
          <h3 className="text-sm font-medium text-green-800 mb-2">Gifts Sent ({sentGifts.length}):</h3>
          {sentGifts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(gift => (
            <div key={gift.id} className="flex items-center justify-between py-2 border-b border-green-100 last:border-0">
              <div className="flex-1">
                <p className="text-sm">
                  You sent a gift to <span className="font-medium">{gift.name}</span> • <span className="text-gray-500 text-xs">{new Date(gift.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
              <Link 
                to={`/invitation-preview/${gift.inviteHash}`}
                className="text-xs text-green-600 font-medium hover:text-green-800 flex items-center gap-1"
              >
                <ExternalLinkIcon className="h-3 w-3" />
                View
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}