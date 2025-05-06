import { useState, useEffect } from "react";
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
  const { data: receivedGifts, isLoading: isLoadingReceived, refetch: refetchReceivedGifts } = useQuery({
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
  const { data: allClientInvitations, isLoading: isLoadingSent, refetch: refetchSentGifts } = useQuery({
    queryKey: ['/api/invitations/all', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const params = new URLSearchParams();
      params.set('clientId', clientId.toString());
      const response = await fetch(`/api/invitations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch invitations');
      return response.json() as Promise<Invitation[]>;
    },
    enabled: !!clientId,
    refetchInterval: 5000, // Poll every 5 seconds for new invitations
    refetchOnWindowFocus: true // Refetch when window regains focus
  });
  
  // Filter the gifts that were actually sent BY this client (where senderId matches clientId)
  const sentGifts = allClientInvitations?.filter(gift => gift.senderId === clientId) || [];
  
  // Set up an effect to listen for the "vmb:gift:created" event which will be triggered after gift creation
  useEffect(() => {
    const handleGiftCreated = () => {
      console.log("[GiftsPage] Received gift created event, refreshing data");
      // Force refresh all invitation data
      refetchSentGifts();
      refetchReceivedGifts();
    };
    
    // Listen for the custom event
    window.addEventListener('vmb:gift:created', handleGiftCreated);
    
    // Cleanup
    return () => {
      window.removeEventListener('vmb:gift:created', handleGiftCreated);
    };
  }, [refetchSentGifts, refetchReceivedGifts]);
  
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
                  onComplete={() => setShowGiftCreation(false)}
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
  
      {/* Gifts Sent Card */}
      <Card className="rounded-xl shadow-sm overflow-hidden mt-4">
        <CardHeader className="bg-pink-50 pb-2 pt-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base text-pink-700">GIFTS SENT</CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSentGifts(!showSentGifts)}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={`h-4 w-4 transition-transform ${showSentGifts ? 'rotate-180' : ''}`}
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
            <span className="sr-only">{showSentGifts ? 'Hide' : 'Show'} sent gifts</span>
          </Button>
        </CardHeader>
        {showSentGifts && (
          <CardContent className="pt-4">
            {isLoadingSent ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : sentGifts && sentGifts.length > 0 ? (
              <div className="w-full border rounded-md overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Recipient</th>
                      <th className="py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Status</th>
                      <th className="py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Date</th>
                      <th className="py-2 px-2 sm:px-4 font-medium text-right text-xs sm:text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentGifts.map(gift => (
                      <tr key={gift.id} className="border-b">
                        <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">{gift.name}</td>
                        <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">
                          <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap
                            ${gift.status.toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                              gift.status.toLowerCase() === 'accepted' ? 'bg-green-100 text-green-700' : 
                              gift.status.toLowerCase() === 'pending' ? 'bg-yellow-50 text-yellow-700' : 
                              'bg-gray-100 text-gray-700'}`
                          }>
                            {gift.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                          {new Date(gift.createdAt).toLocaleDateString('en-US', { 
                            month: 'numeric', 
                            day: 'numeric',
                            year: '2-digit'
                          })}
                        </td>
                        <td className="py-2 px-2 sm:px-4 text-right text-xs sm:text-sm">
                          <Link 
                            to={`/invitation-preview/${gift.inviteHash}`}
                            onClick={() => setLocation(`/invitation-preview/${gift.inviteHash}`)}
                            className="inline-flex items-center text-pink-600 font-medium gap-1 text-xs sm:text-sm hover:text-pink-800 cursor-pointer whitespace-nowrap"
                          >
                            <ExternalLinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            View Gift
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">You have no sent gifts at the moment</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Gifts Received Card */}
      <Card className="rounded-xl shadow-sm overflow-hidden mt-4">
        <CardHeader className="bg-pink-50 pb-2 pt-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base text-pink-700">GIFTS RECEIVED</CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowReceivedGifts(!showReceivedGifts)}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={`h-4 w-4 transition-transform ${showReceivedGifts ? 'rotate-180' : ''}`}
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
            <span className="sr-only">{showReceivedGifts ? 'Hide' : 'Show'} received gifts</span>
          </Button>
        </CardHeader>
        {showReceivedGifts && (
          <CardContent className="pt-4">
            {isLoadingReceived ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : receivedGifts && receivedGifts.length > 0 ? (
              <div className="w-full border rounded-md overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">From</th>
                      <th className="py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Status</th>
                      <th className="py-2 px-2 sm:px-4 font-medium text-xs sm:text-sm">Date</th>
                      <th className="py-2 px-2 sm:px-4 font-medium text-right text-xs sm:text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivedGifts.map(gift => (
                      <tr key={gift.id} className="border-b">
                        <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">{gift.sponsor || 'Unknown Sender'}</td>
                        <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">
                          <span className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap
                            ${gift.status.toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                              gift.status.toLowerCase() === 'accepted' ? 'bg-green-100 text-green-700' : 
                              gift.status.toLowerCase() === 'pending' ? 'bg-yellow-50 text-yellow-700' : 
                              'bg-gray-100 text-gray-700'}`
                          }>
                            {gift.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                          {new Date(gift.createdAt).toLocaleDateString('en-US', { 
                            month: 'numeric', 
                            day: 'numeric',
                            year: '2-digit'
                          })}
                        </td>
                        <td className="py-2 px-2 sm:px-4 text-right text-xs sm:text-sm">
                          <Link 
                            to={`/invitation-preview/${gift.inviteHash}`}
                            onClick={() => setLocation(`/invitation-preview/${gift.inviteHash}`)}
                            className="inline-flex items-center text-pink-600 font-medium gap-1 text-xs sm:text-sm hover:text-pink-800 cursor-pointer whitespace-nowrap"
                          >
                            <ExternalLinkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            {gift.status.toLowerCase() === 'pending' ? 'Accept Gift' : 'View Gift'}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500">You have no received gifts at the moment</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}