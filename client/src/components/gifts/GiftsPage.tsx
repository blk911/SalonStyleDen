import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLinkIcon, HeartIcon, PlusCircleIcon, XIcon } from "lucide-react";
import GiftCreationFlow from "./GiftCreationFlow";
import { ReceivedGiftsDisplay } from "./ReceivedGiftsDisplay";
import { SentGiftsDisplay } from "./SentGiftsDisplay";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
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
  const { data: receivedGiftsData, isLoading: isLoadingReceived } = useQuery({
    queryKey: ['/api/gifts/received', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      try {
        // Get gifts received by this client (both by ID and phone)
        const response = await fetch(`/api/gifts/received/${clientId}`);
        if (!response.ok) throw new Error('Failed to fetch received gifts');
        
        const gifts = await response.json() as Gift[];
        console.log("Received gifts:", gifts);
        
        // Critical check: Filter out any gifts where this client is BOTH the sender and recipient
        // This prevents the impossible case where a client sends a gift to themselves
        const filteredGifts = gifts.filter(gift => {
          // A gift can be received either by ID or phone, but the sender cannot be the same as recipient
          if (gift.senderId === clientId) {
            // Log and filter out self-gifts which violate business rules
            console.warn("[DATA INTEGRITY] Filtering out gift", gift.id, "where sender is also recipient");
            return false;
          }
          return true;
        });
        
        // Transform valid gift data to match the format expected by the UI
        return filteredGifts.map(gift => ({
          id: gift.id,
          name: gift.senderName || "Gift Sender", // Use sender name if available
          phone: gift.recipientPhone || "",
          email: gift.recipientEmail || "",
          message: gift.message,
          salonId: gift.salonId,
          senderId: gift.senderId,
          sponsor: "Gift Sender", // Default display name
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
        
        // Critical fix - Ensure no gifts are shown as "sent" where the recipient is the same as the sender
        // This is a business rule violation and should not be possible
        const validGifts = gifts.filter(gift => {
          // Ensure no gifts where sender is sending to themselves via ID
          if (gift.recipientId === clientId) {
            console.warn("[DATA INTEGRITY] Filtering out impossible gift", gift.id, "where recipient ID matches sender ID");
            return false;
          }
          
          // Fetch client data synchronously (we're in an async function so this is OK)
          // This adds an extra check to ensure client phone number doesn't match recipient
          if (clientData && gift.recipientPhone === clientData.phone) {
            console.warn("[DATA INTEGRITY] Filtering out impossible gift", gift.id, "where recipient phone matches sender phone");
            return false;
          }
          
          return true;
        });
        
        // Transform gift data to match the format expected by the UI
        return validGifts.map(gift => ({
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
  
  // Use the transformed gifts data with safety checks
  const receivedGifts = receivedGiftsData || [];
  const sentGifts = sentGiftsData || [];
  
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

      {/* Always show Gifts Received section using the new ReceivedGiftsDisplay component */}
      <div className="mt-4 border rounded-lg p-4 bg-yellow-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-amber-800">Gifts Received</h3>
        </div>
        
        {/* Pass client ID to the ReceivedGiftsDisplay component */}
        {clientId ? (
          <ReceivedGiftsDisplay 
            clientId={clientId}
            setLocation={(to: string) => setLocation(to)}
            className="bg-white rounded-lg border border-yellow-200"
          />
        ) : (
          <div className="text-center p-4 bg-white rounded-lg border border-yellow-200">
            <p className="text-amber-800">Unable to display gifts</p>
            <p className="text-xs text-gray-500 mt-1">Client information not available</p>
          </div>
        )}
      </div>

      {/* Always show Gifts Sent section, with appropriate empty state */}
      <div className="mt-4 border rounded-lg p-4 bg-green-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-green-800">Gifts Sent</h3>
        </div>
        
        {/* Pass client ID to the SentGiftsDisplay component */}
        {clientId ? (
          <SentGiftsDisplay 
            clientId={clientId}
            setLocation={(to: string) => setLocation(to)}
            className="bg-white rounded-lg border border-green-200"
          />
        ) : (
          <div className="text-center p-4 bg-white rounded-lg border border-green-200">
            <p className="text-green-800">Unable to display sent gifts</p>
            <p className="text-xs text-gray-500 mt-1">Client information not available</p>
          </div>
        )}
      </div>
    </div>
  );
}