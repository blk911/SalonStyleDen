import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GiftClaimCard } from "@/components/gifts/GiftClaimCard";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Loader2, Users, ArrowLeft, Gift as GiftIcon } from "lucide-react";
import { formatCurrency, formatPhoneNumber, processApiUrl } from "@/lib/utils";

// Match the interface expected by GiftClaimCard
interface ReceivedGift {
  id: number;
  senderId: number;
  senderName?: string;
  salonId: number;
  salonName?: string;
  giftType: string;
  styleId?: number;
  styleName?: string;
  amount: number;
  message?: string;
  status: string;
  giftHash: string;
  createdAt: string;
  expiresAt?: string;
  redeemedAt?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientId?: number;
}

interface Gift {
  id: number;
  senderId: number;
  senderName?: string;
  recipientId?: number | null;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  giftType: string;
  styleId?: number;
  styleName?: string;
  amount: number;
  message?: string;
  status: string;
  salonId: number;
  salonName?: string;
  giftHash: string;
  createdAt: string;
  expiresAt?: string;
  redeemedAt?: string;
}

interface Client {
  id: number;
  name: string;
  phone: string;
  email?: string;
  type: string;
  isCurrentClient: boolean;
  salonId?: number;
}

export default function GiftDetailPage() {
  // Parse the gift ID from the URL
  const [, params] = useRoute<{ id: string }>("/admin/gifts/:id");
  const giftId = params?.id;
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"admin" | "claim">("admin"); // Default to admin view
  const [recipientClient, setRecipientClient] = useState<Client | null>(null);

  // Fetch gift data
  const { data: gift, isLoading, isError, error } = useQuery<Gift>({
    queryKey: [`/api/gifts/${giftId}`],
    enabled: !!giftId,
  });

  // Check if recipient exists whenever gift data changes
  useEffect(() => {
    if (gift?.recipientId) {
      // If recipient ID exists, fetch client data
      fetch(processApiUrl(`/api/clients/${gift.recipientId}`))
        .then(res => res.json())
        .then(data => {
          setRecipientClient(data);
          setViewMode("admin"); // If recipient exists, always show admin view
        })
        .catch(err => {
          console.error("Error fetching recipient:", err);
        });
    } else if (gift?.status === "pending") {
      // If no recipient but status is pending, show claim view
      setViewMode("claim");
      setRecipientClient(null);
    }
  }, [gift]);

  // Fetch sender client data
  const { data: senderClient } = useQuery<Client>({
    queryKey: [`/api/clients/${gift?.senderId}`],
    enabled: !!gift?.senderId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-pink-600" />
            <p className="text-lg">Loading gift details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !gift) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
            <div className="text-red-600 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-700 mb-2">Gift Not Found</h2>
            <p className="mb-4 text-gray-600">
              The gift you're looking for couldn't be found. It may have been removed or the ID is incorrect.
            </p>
            <p className="text-sm text-red-600">{(error as Error)?.message}</p>
            <Link href="/admin">
              <Button className="mt-4" variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // If in claim mode, show the claim card
  if (viewMode === "claim" && !recipientClient) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow container py-8 max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold mb-6">Gift Details</h1>
          
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GiftIcon className="h-5 w-5 text-pink-500" />
                  Unclaimed Gift
                </CardTitle>
                <CardDescription>
                  This gift is pending and has not been claimed by the recipient yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GiftClaimCard 
                  gift={{
                    id: gift.id,
                    senderId: gift.senderId,
                    senderName: gift.senderName,
                    salonId: gift.salonId,
                    salonName: gift.salonName,
                    giftType: gift.giftType,
                    styleId: gift.styleId,
                    styleName: gift.styleName,
                    amount: gift.amount,
                    message: gift.message,
                    status: gift.status,
                    giftHash: gift.giftHash,
                    createdAt: gift.createdAt,
                    expiresAt: gift.expiresAt,
                    redeemedAt: gift.redeemedAt,
                    recipientName: gift.recipientName,
                    recipientPhone: gift.recipientPhone,
                    recipientEmail: gift.recipientEmail,
                    recipientId: gift.recipientId as number | undefined, // Convert to match ReceivedGift type
                  }} 
                  clientId={0} // We don't have a client ID yet
                  onGiftClaimed={() => {
                    // Refresh the page after claiming
                    toast({
                      title: "Gift claimed successfully!",
                      description: "The gift has been claimed and the recipient account has been created.",
                    });
                    // Refresh after a short delay
                    setTimeout(() => window.location.reload(), 1500);
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Otherwise, show the admin view
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container py-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-6">Gift Details</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gift Information Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GiftIcon className="h-5 w-5 text-pink-500" />
                Gift Information
              </CardTitle>
              <div className="flex items-center mt-2">
                <Badge className={
                  gift.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' 
                    : gift.status === 'redeemed' 
                      ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                }>
                  {gift.status === 'pending' ? 'Pending' : 
                   gift.status === 'redeemed' ? 'Redeemed' : 
                   gift.status === 'canceled' ? 'Canceled' : 
                   gift.status}
                </Badge>
                <span className="text-sm text-gray-500 ml-2">
                  Created: {new Date(gift.createdAt).toLocaleDateString()}
                </span>
                {gift.redeemedAt && (
                  <span className="text-sm text-gray-500 ml-2">
                    Claimed: {new Date(gift.redeemedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p>{gift.giftType === 'style_card' ? 'Style Card' : gift.giftType}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                  <p className="font-semibold">{formatCurrency(gift.amount / 100)}</p>
                </div>
                {gift.styleName && (
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-gray-500">Service</h3>
                    <p>{gift.styleName}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Message</h3>
                  <p className="border-l-2 border-pink-200 pl-3 py-2 italic text-gray-600">
                    {gift.message || "No message provided"}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">From Salon</h3>
                  <p>
                    {gift.salonName || "Unknown Salon"}
                    {gift.salonId && (
                      <Link to={`/salon/${gift.salonId}`}>
                        <Button variant="link" size="sm" className="p-0 h-auto ml-1">
                          View
                        </Button>
                      </Link>
                    )}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Gift ID</h3>
                  <p className="font-mono text-xs">{gift.giftHash}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Sender Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-pink-500" />
                People
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Sender</h3>
                <div className="border rounded-md p-3 bg-gray-50">
                  <p className="font-medium">{senderClient?.name || gift.senderName || "Unknown"}</p>
                  {senderClient?.phone && (
                    <p className="text-sm text-gray-600">{formatPhoneNumber(senderClient.phone)}</p>
                  )}
                  {senderClient?.id && (
                    <Link to={`/client/${senderClient.id}`}>
                      <Button variant="link" size="sm" className="p-0 h-auto mt-1">
                        View Profile
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Recipient</h3>
                <div className="border rounded-md p-3 bg-gray-50">
                  {recipientClient ? (
                    <>
                      <p className="font-medium">{recipientClient.name}</p>
                      <p className="text-sm text-gray-600">{formatPhoneNumber(recipientClient.phone)}</p>
                      <Link to={`/client/${recipientClient.id}`}>
                        <Button variant="link" size="sm" className="p-0 h-auto mt-1">
                          View Profile
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">{gift.recipientName || "Not claimed yet"}</p>
                      {gift.recipientPhone && (
                        <p className="text-sm text-gray-600">{formatPhoneNumber(gift.recipientPhone)}</p>
                      )}
                      {gift.recipientEmail && (
                        <p className="text-sm text-gray-600">{gift.recipientEmail}</p>
                      )}
                      {gift.status === "pending" && (
                        <div className="mt-2">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Waiting for recipient to claim
                          </Badge>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              {gift.status === "pending" && (
                <Button variant="outline" className="w-full">
                  <Link to={`/redeem-gift/${gift.giftHash}`} className="w-full flex justify-center">
                    Send Claim Link
                  </Link>
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
