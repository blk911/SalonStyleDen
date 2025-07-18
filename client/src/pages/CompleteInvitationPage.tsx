import React, { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Loader2, User, Clock, Gift, ArrowLeft, ExternalLink, Heart } from 'lucide-react';
import Navbar from "@/components/layout/Navbar";
import { Link } from 'wouter';
import { Separator } from '@/components/ui/separator';
import { processApiUrl } from '@/lib/utils';

interface StyleOption {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl?: string;
  createdAt: string;
}

interface Invitation {
  id: number;
  name: string;
  hash: string;
  clientId?: number;
  salonId?: number;
  styleId?: number;
  status: 'pending' | 'accepted' | 'complete' | 'rejected';
  message?: string;
  recipientName?: string;
  recipientContact?: string;
  createdAt: string;
  sender?: string;
  signature?: string;
  expiresAt?: string;
  sponsor?: string;
  type?: string;
  giftCode?: string;
}

export default function CompleteInvitationPage() {
  const { id } = useParams<{ id: string }>();
  const invitationId = parseInt(id);
  const [style, setStyle] = useState<StyleOption | null>(null);
  
  // Fetch the invitation details
  const { data: invitation, isLoading, error } = useQuery<Invitation>({
    queryKey: [`/api/invitations/${invitationId}`],
    enabled: !isNaN(invitationId)
  });

  // Fetch style details when invitation loads
  useEffect(() => {
    if (invitation?.styleId) {
      const fetchStyle = async () => {
        try {
          const response = await fetch(processApiUrl(`/api/styles/${invitation.styleId}`));
          if (response.ok) {
            const styleData = await response.json();
            setStyle(styleData);
          }
        } catch (error) {
          console.error('Error fetching style details:', error);
        }
      };
      
      fetchStyle();
    }
  }, [invitation]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            <span className="ml-2 text-lg text-gray-600">Loading invitation #{id}...</span>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-700 mb-2">Invitation Not Found</h1>
            <p className="text-red-600 mb-4">We couldn't find the invitation you're looking for.</p>
            <Link href="/" className="inline-flex items-center text-pink-600 hover:text-pink-800">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Return to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header with Invitation ID */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Complete Invitation
              <Badge className="ml-2 bg-emerald-500" variant="secondary">
                #{invitation.id}
              </Badge>
            </h1>
            <p className="text-gray-500">This invitation has been finalized and cannot be modified</p>
          </div>
          
          <Badge 
            className={`${
              invitation.status === 'complete' 
                ? 'bg-emerald-100 text-emerald-800' 
                : invitation.status === 'accepted' 
                ? 'bg-blue-100 text-blue-800' 
                : invitation.status === 'pending' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
            } px-2 py-1 text-xs font-medium`}
          >
            {invitation.status.toUpperCase()} #{invitation.id}
          </Badge>
        </div>
        
        {/* Main Card */}
        <Card className="overflow-hidden border-pink-100 shadow-sm">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-pink-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Invitation for {invitation.recipientName || 'Guest'}
              </h2>
              <div className="text-sm text-gray-500 flex items-center mt-2 sm:mt-0">
                <Clock className="h-4 w-4 mr-1" />
                <span>Created {new Date(invitation.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <CardContent className="p-6">
            {/* Gift Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Gift Details</h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Gift className="h-5 w-5 text-pink-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-700">
                        {style?.name || 'Selected Service'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {style ? `${style.price.toFixed(2)} • ${style.duration} min` : 'Loading details...'}
                      </p>
                    </div>
                  </div>
                  
                  {invitation.giftCode && (
                    <div className="mt-4 p-2 bg-emerald-50 border border-emerald-100 rounded">
                      <p className="text-sm font-medium text-emerald-800">Gift Code:</p>
                      <p className="text-emerald-700 font-mono">{invitation.giftCode}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Invitation Details</h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <User className="h-5 w-5 text-pink-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-700">
                        From: {invitation.sender || 'A friend'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        To: {invitation.recipientName || 'Guest'}
                      </p>
                    </div>
                  </div>
                  
                  {invitation.sponsor && (
                    <div className="flex items-start mt-2">
                      <Heart className="h-5 w-5 text-pink-500 mr-2 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700">
                          Sponsored by: {invitation.sponsor}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Gift Message */}
            <div className="bg-pink-50 p-5 rounded-lg border border-pink-100 mb-6">
              <h3 className="text-lg font-medium text-pink-800 mb-2">Gift Message</h3>
              <div className="italic text-gray-700 p-3 bg-white rounded border border-pink-100">
                {invitation.message ? (
                  <p>{invitation.message}</p>
                ) : (
                  <p>No personal message included.</p>
                )}
                
                {invitation.signature && (
                  <div className="mt-3 text-right font-medium text-pink-700">
                    {invitation.signature}
                  </div>
                )}
              </div>
            </div>
            
            {/* Final Invitation Display */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-md">
              <h3 className="text-center text-xl font-bold text-pink-600 mb-4">Your Gift Invitation</h3>
              
              <div className="border-2 border-pink-200 rounded-lg p-6 text-center">
                <div className="mb-4">
                  <img 
                    src="/assets/VMB_LOGO.png" 
                    alt="VMB Logo" 
                    className="h-16 mx-auto"
                  />
                </div>
                
                <h4 className="text-lg font-semibold mb-1">
                  You're gifting:
                </h4>
                <p className="text-xl font-bold text-pink-700 mb-2">
                  {style?.name || 'Selected Service'}
                </p>
                
                <div className="flex justify-center mb-4">
                  {style?.imageUrl && (
                    <img 
                      src={style.imageUrl} 
                      alt={style.name} 
                      className="h-24 w-24 object-cover rounded-md border border-gray-200"
                    />
                  )}
                </div>
                
                <div className="text-sm text-gray-700 mb-4">
                  {invitation.message}
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
                  <div>
                    Service Value: ${style?.price.toFixed(2) || '--.--'}
                  </div>
                  <div>
                    Duration: {style?.duration || '--'} min
                  </div>
                </div>
                
                {invitation.giftCode && (
                  <div className="mt-4 bg-gray-50 p-2 rounded border border-gray-200">
                    <p className="text-xs text-gray-600">Gift Code: {invitation.giftCode}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-3">
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Return Home
                </Button>
              </Link>
              
              {invitation.hash && (
                <Link href={`/invitation/${invitation.hash}`}>
                  <Button className="w-full sm:w-auto bg-pink-500 hover:bg-pink-600">
                    View Public Invitation
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
