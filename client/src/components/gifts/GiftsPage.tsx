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
  styleOption?: string | null;
  stylePrice?: number | null;
  styleDuration?: number | null;
}

interface Gift {
  id: number;
  senderId: number;
  recipientId: number | null;
  recipientPhone: string | null;
  recipientEmail: string | null;
  giftType: string;
  styleId: number | null;
  styleName: string | null;
  amount: number;
  message: string | null;
  status: string;
  salonId: number;
  giftHash: string;
  expiresAt: string | null;
  createdAt: string;
  redeemedAt: string | null;
  recipientName?: string;
  senderName?: string;
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

  // Query for received gifts (where this client is the recipient)
  const { data: receivedGifts, isLoading: isLoadingReceived } = useQuery({
    queryKey: ['/api/gifts/received', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      try {
        // Get gifts received by this client (both by ID and phone)
        const response = await fetch(`/api/gifts/received/${clientId}`);
        if (!response.ok) throw new Error('Failed to fetch received gifts');
        
        const gifts = await response.json() as Gift[];
        console.log("Received gifts:", gifts);
        
        // Transform gift data to match the format expected by the UI
        return gifts.map(gift => ({
          id: gift.id,
          name: gift.senderName || "Gift Sender", // Use sender name if available
          phone: gift.recipientPhone || "",
          email: gift.recipientEmail || "",
          message: gift.message,
          salonId: gift.salonId,
          senderId: gift.senderId,
          sponsor: gift.senderName || "Gift Sender", // Default display name
          status: gift.status || "sent",
          inviteHash: `gift-${gift.id}`, // Route key for viewing 
          createdAt: gift.createdAt,
          amount: gift.amount,
          styleOption: gift.styleName,
          stylePrice: gift.amount,
          giftHash: gift.giftHash // Include gift hash for unique identification
        })) as Invitation[];
      } catch (error) {
        console.error("Error fetching received gifts:", error);
        return []; // Return empty array on error
      }
    },
    enabled: !!clientId,
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  // Query for sent gifts (where this client is the sender)
  const { data: sentGiftsData, isLoading: isLoadingSent } = useQuery({
    queryKey: ['/api/gifts/sent', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      try {
        // Get gifts sent by this client
        const response = await fetch(`/api/gifts/sent/${clientId}`);
        if (!response.ok) throw new Error('Failed to fetch sent gifts');
        
        const gifts = await response.json() as Gift[];
        console.log("Sent gifts:", gifts);
        
        // Transform gift data to match the format expected by the UI
        return gifts.map(gift => ({
          id: gift.id,
          name: gift.recipientName || "Gift Recipient", // Use recipient name if available
          phone: gift.recipientPhone || "",
          email: gift.recipientEmail || "",
          message: gift.message,
          salonId: gift.salonId,
          senderId: gift.senderId,
          sponsor: null,
          status: gift.status || "sent",
          inviteHash: `gift-${gift.id}`, // Route key for viewing
          createdAt: gift.createdAt,
          amount: gift.amount,
          styleOption: gift.styleName,
          stylePrice: gift.amount,
          giftHash: gift.giftHash // Include gift hash for unique identification
        })) as Invitation[];
      } catch (error) {
        console.error("Error fetching sent gifts:", error);
        return []; // Return empty array on error
      }
    },
    enabled: !!clientId,
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  // Use the transformed sent gifts data
  const sentGifts = sentGiftsData || [];
  
  return (
    <div className="space-y-4 w-full">
      {/* Gift section tabs - Sent/Received at the top level */}
      <div className="flex w-full border-b border-gray-200 mb-3">
        <button
          onClick={() => setShowSentGifts(true)}
          className={`flex-1 py-2 text-center font-medium text-sm border-b-2 ${
            showSentGifts 
              ? 'border-pink-500 text-pink-700' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Sent
        </button>
        <button
          onClick={() => setShowReceivedGifts(true)}
          className={`flex-1 py-2 text-center font-medium text-sm border-b-2 ${
            showReceivedGifts 
              ? 'border-pink-500 text-pink-700' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Received
        </button>
      </div>

      {/* Create Gift Request Card */}
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
  
      {/* Gifts display area - conditionally rendered based on tabs */}
      <div className="space-y-6 mt-6">
        {/* RECEIVED GIFTS SECTION - Shown when received tab is active */}
        {showReceivedGifts && (
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-3">Received Gifts</h3>
            
            {isLoadingReceived ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            ) : receivedGifts && receivedGifts.length > 0 ? (
              <div className="space-y-3">
                {receivedGifts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(gift => (
                  <div key={gift.id} className="flex flex-col py-3 px-4 bg-white rounded-lg border border-pink-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <HeartIcon className="h-5 w-5 text-pink-500" />
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-medium">
                              From <span className="font-semibold text-pink-700">{gift.sponsor || "Unknown"}</span>
                            </p>
                            <span className="text-xs text-gray-400 mx-1">•</span>
                            <p className="text-xs text-gray-500">{new Date(gift.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{gift.message || "Personal gift invitation"}</p>
                          {gift.styleOption && (
                            <p className="text-xs text-pink-600 mt-1 font-medium">
                              {gift.styleOption}
                              {gift.stylePrice && ` • $${(gift.stylePrice / 100).toFixed(2)}`}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          gift.status.toLowerCase() === 'accepted' ? 'bg-green-100 text-green-700' : 
                          gift.status.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-700' : 
                          gift.status.toLowerCase() === 'redeemed' ? 'bg-purple-100 text-purple-700' : 
                          gift.status.toLowerCase() === 'pending' || gift.status.toLowerCase() === 'sent' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {gift.status.charAt(0).toUpperCase() + gift.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-2">
                      <Link
                        to={`/invitation-preview/${gift.inviteHash}?stayOnPreview=true`}
                        className="text-xs text-pink-600 font-medium hover:text-pink-800 flex items-center gap-1"
                      >
                        <ExternalLinkIcon className="h-3 w-3" />
                        View
                      </Link>
                      
                      {(gift.status.toLowerCase() === 'pending' || gift.status.toLowerCase() === 'sent') && (
                        <Button 
                          variant="outline"
                          size="sm"
                          className="h-7 py-0 px-3 bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200 text-xs"
                          onClick={async () => {
                            try {
                              // If it's a gift (not an invitation), use the gifts API
                              if (gift.inviteHash.startsWith('gift-')) {
                                const giftId = gift.inviteHash.split('-')[1];
                                const response = await fetch(`/api/gifts/${giftId}/status`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'redeemed' })
                                });
                                
                                if (!response.ok) throw new Error('Failed to update gift status');
                                
                                // Refresh the component
                                window.location.reload();
                              } else {
                                // For legacy invitations
                                const response = await fetch(`/api/invitations/${gift.id}/status`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'accepted' })
                                });
                                
                                if (!response.ok) throw new Error('Failed to update status');
                                
                                // Navigate to the invitation preview page
                                setLocation(`/invitation-preview/${gift.inviteHash}?stayOnPreview=true`);
                              }
                            } catch (error) {
                              console.error('Error accepting gift:', error);
                              // Refresh anyway
                              window.location.reload();
                            }
                          }}
                        >
                          {gift.inviteHash.startsWith('gift-') ? 'Redeem Gift' : 'Accept'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500">No gifts received yet</p>
              </div>
            )}
          </div>
        )}

        {/* SENT GIFTS SECTION - Shown when sent tab is active */}
        {showSentGifts && (
          <div>
            <h3 className="text-base font-medium text-gray-800 mb-3">Sent Gifts</h3>
            
            {isLoadingSent ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            ) : sentGifts && sentGifts.length > 0 ? (
              <div className="space-y-3">
                {sentGifts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(gift => (
                  <div key={gift.id} className="flex flex-col py-3 px-4 bg-white rounded-lg border border-green-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlusIcon className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-medium">
                              To <span className="font-semibold text-green-700">{gift.name}</span>
                            </p>
                            <span className="text-xs text-gray-400 mx-1">•</span>
                            <p className="text-xs text-gray-500">{new Date(gift.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{gift.message || "Personal gift invitation"}</p>
                          {gift.styleOption && (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              {gift.styleOption}
                              {gift.stylePrice && ` • $${(gift.stylePrice / 100).toFixed(2)}`}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          gift.status.toLowerCase() === 'accepted' ? 'bg-green-100 text-green-700' : 
                          gift.status.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-700' : 
                          gift.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-pink-100 text-pink-700'
                        }`}>
                          {gift.status.charAt(0).toUpperCase() + gift.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-2">
                      <Link
                        to={`/invitation-preview/${gift.inviteHash}?stayOnPreview=true`}
                        className="text-xs text-green-600 font-medium hover:text-green-800 flex items-center gap-1"
                      >
                        <ExternalLinkIcon className="h-3 w-3" />
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed border-gray-200 rounded-lg bg-gray-50">
                <p className="text-gray-500">No gifts sent yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}