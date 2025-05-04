import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartIcon, PlusCircleIcon, UserPlusIcon, XIcon, Loader2 } from "lucide-react";
import GiftCreationFlow from "./GiftCreationFlow";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface GiftsPageProps {
  clientId?: number;
  salonId?: number;
}

interface Invitation {
  id: number;
  name: string;
  phone: string;
  salonId: number;
  salonName?: string;
  sponsor?: string;
  status: string;
  styleId?: number;
  styleName?: string;
  paymentStatus?: string;
  createdAt: string;
}

export default function GiftsPage({ clientId = 10 }: GiftsPageProps) {
  const [showGiftCreation, setShowGiftCreation] = useState(false);
  
  // Fetch gifts received by this client
  const { data: receivedGifts, isLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}/received-gifts`],
    queryFn: async () => {
      const response = await fetch(`/api/invitations?recipientClientId=${clientId}&status=pending,accepted,completed`);
      if (!response.ok) {
        throw new Error("Failed to fetch received gifts");
      }
      return response.json() as Promise<Invitation[]>;
    },
  });
  
  // Fetch gifts sent by this client
  const { data: sentGifts } = useQuery({
    queryKey: [`/api/clients/${clientId}/sent-gifts`],
    queryFn: async () => {
      const response = await fetch(`/api/invitations?sponsorClientId=${clientId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch sent gifts");
      }
      return response.json() as Promise<Invitation[]>;
    },
  });

  // Function to render gift status badge
  const renderStatusBadge = (status: string) => {
    let badgeColor = "bg-gray-200 text-gray-800";
    
    if (status === "pending") {
      badgeColor = "bg-yellow-100 text-yellow-800";
    } else if (status === "accepted") {
      badgeColor = "bg-blue-100 text-blue-800";
    } else if (status === "completed") {
      badgeColor = "bg-green-100 text-green-800";
    } else if (status === "cancelled") {
      badgeColor = "bg-red-100 text-red-800";
    }
    
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded ${badgeColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
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
              className="border rounded-lg p-4 bg-gradient-to-r from-pink-50 to-pink-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[180px] transition-all hover:shadow-md cursor-pointer"
              onClick={() => setShowGiftCreation(true)}
            >
              <div className="p-3 bg-white rounded-full mb-3">
                <PlusCircleIcon className="h-8 w-8 text-pink-500" />
              </div>
              <h3 className="text-lg font-medium text-pink-800">Create New Gift</h3>
              <p className="text-sm text-pink-700 mt-1">Send someone special a salon treatment</p>
            </div>
          ) : (
            <div className="border rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-pink-800">Create a New Gift</h3>
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
              
              <GiftCreationFlow 
                clientId={clientId} 
                onComplete={() => setShowGiftCreation(false)}
              />
            </div>
          )}
        </CardContent>
      </Card>
  
      {/* Gifts Received Card */}
      <Card className="rounded-xl shadow-sm overflow-hidden mt-4">
        <CardHeader className="bg-pink-50 pb-2 pt-2">
          <CardTitle className="text-base text-pink-700">Gifts Received</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
              <span className="ml-2 text-gray-600">Loading gifts...</span>
            </div>
          ) : receivedGifts && receivedGifts.length > 0 ? (
            <div className="space-y-3">
              {receivedGifts.map((gift: Invitation) => (
                <div key={gift.id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-800">{gift.styleName || "Salon Treatment"}</h4>
                    <p className="text-sm text-gray-600">From: {gift.sponsor || "Anonymous"}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(gift.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {renderStatusBadge(gift.status)}
                    {gift.status === "pending" && (
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        Accept Gift
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 border border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500">You have no received gifts at the moment</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gifts Sent Card */}
      <Card className="rounded-xl shadow-sm overflow-hidden mt-4">
        <CardHeader className="bg-pink-50 pb-2 pt-2">
          <CardTitle className="text-base text-pink-700">Gifts Sent</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {sentGifts && sentGifts.length > 0 ? (
            <div className="space-y-3">
              {sentGifts.map((gift: Invitation) => (
                <div key={gift.id} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-800">{gift.styleName || "Salon Treatment"}</h4>
                    <p className="text-sm text-gray-600">To: {gift.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(gift.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    {renderStatusBadge(gift.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-6 border border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500">You haven't sent any gifts yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}