/**
 * RenderedInvitation Component
 * 
 * ✅ WORKS EXACTLY AS INTENDED
 * 🚫 DO NOT MODIFY WITHOUT FULL RETEST
 * 
 * This component is a key part of the invitation system, rendering both salon-initiated
 * and client-initiated invitations with the correct styling and action handlers.
 * It is used in multiple places including invitation previews and dashboard views.
 */

import React, { useEffect, useState } from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';
import { SiZelle, SiVenmo, SiCashapp } from 'react-icons/si';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";

// Extend the Window interface to add our client ID context
declare global {
  interface Window {
    _currentClientId?: string | number | null;
  }
}

interface RenderedInvitationProps {
  inviteId: string;
  recipientName: string;
  styleOption: string;
  price?: string;
  time?: string;
  senderName: string;
  salonName?: string;
  imageUrl?: string;
  className?: string;
  salonInitiated?: boolean; // To identify salon-initiated invitations
  onSendGift?: () => void; // Handler for the SEND GIFT button click
  status?: string; // Invitation status: pending, sent, accepted, etc.
}

export function RenderedInvitation({
  inviteId,
  recipientName,
  styleOption,
  price = "$45",
  time = "30 min",
  senderName,
  salonName = "Tiffany 5280 Nails Studio",
  imageUrl = "/assets/french-tips.png",
  className = "",
  salonInitiated = false,
  onSendGift,
  status = "pending"
}: RenderedInvitationProps) {
  const formattedInviteId = inviteId.startsWith('INV-FINAL-') ? inviteId : `INV-FINAL-${inviteId}`;
  const [currentClientId, setCurrentClientId] = useState<string | number | null>(null);
  
  // Check URL for source parameter
  const urlParams = new URLSearchParams(window.location.search);
  const sourceDashboard = urlParams.get('source');
  
  // Get the current client ID from the global window object
  useEffect(() => {
    // Try to get client ID from global window object
    const clientId = window._currentClientId || null;
    setCurrentClientId(clientId);
    
    // For debugging: log the client ID context
    console.log(`[FLOW] RenderedInvitation - Current client ID context: ${clientId || 'Not set'}`);
  }, []);
  
  // SITE-WIDE CRITICAL RULE - UPDATED: 
  // The SEND GIFT button should ONLY appear when ALL conditions are met:
  // 1. We're NOT in preview mode (currentClientId must be set)
  // 2. The invitation status is 'pending'
  // 3. There is a valid onSendGift handler
  // 4. This is NOT a salon-initiated invitation
  // 5. The client is viewing their own invitation (sourceDashboard === 'client')
  
  const isInPreviewMode = !currentClientId;
  const isClientViewingOwnInvitation = currentClientId === recipientName || sourceDashboard === 'client';
  const hasValidSendGiftHandler = Boolean(onSendGift);
  const isPendingStatus = status === 'pending';
  
  // CRITICAL RULE: Only show the SEND GIFT button when the invitation recipient
  // is viewing their own invitation from the Client Dashboard
  const showButton = !isInPreviewMode && 
                     isClientViewingOwnInvitation && 
                     hasValidSendGiftHandler && 
                     isPendingStatus &&
                     !salonInitiated &&
                     sourceDashboard === 'client'; // Only show when viewed from client dashboard
  
  console.log(`[FLOW] RenderedInvitation for ${recipientName} - Status: ${status} - Client ID: ${currentClientId || 'NOT SET'} - Source: ${sourceDashboard || 'none'} - Is client: ${isClientViewingOwnInvitation} - Send gift button will ${showButton ? 'SHOW' : 'HIDE'}`);
  
  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg overflow-hidden ${className}`}>
      <CardHeader className={`${salonInitiated ? 'bg-amber-50 border-b border-amber-200' : 'bg-pink-100'} pb-2`}>
        {salonInitiated ? (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center">
              <span className="text-sm font-semibold text-amber-800 w-16">TO:</span>
              <span className="text-sm font-medium text-gray-700">{recipientName}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-semibold text-amber-800 w-16">FROM:</span>
              <span className="text-sm font-medium text-gray-700">{salonName}</span>
            </div>
            <div className="flex justify-end">
              <div className="text-xs font-mono text-gray-500">{formattedInviteId}</div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">{salonName}</div>
              {/* Removed invitation ID display from header */}
            </div>
            <h3 className="text-xl font-semibold text-pink-800 text-center mt-2">
              Ven Me, Baby! Gift Request
            </h3>
          </>
        )}
      </CardHeader>
      
      {/* Gradient bar under header (keep this for styling) */}
      <div className={`p-1 bg-gradient-to-r ${salonInitiated 
        ? 'from-amber-300 via-orange-300 to-yellow-300' 
        : 'from-pink-300 via-purple-300 to-indigo-300'}`}></div>
      
      <CardContent className="p-4">
        <div className="mb-4">
          {/* Set fixed height of 120px while maintaining proper aspect ratio */}
          <div className="rounded-md overflow-hidden shadow-md bg-muted h-[120px] flex items-center justify-center">
            <img 
              src={imageUrl} 
              alt={styleOption}
              className="object-contain h-full max-w-full"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className={`text-center italic text-gray-700 px-4 ${salonInitiated ? 'text-sm' : ''}`}>
            {salonInitiated ? (
              <>
                Hi <span className="font-semibold">{recipientName}</span>, We are joining Ven Me, Baby! VMB fits today's lifestyle. It's direct, it's easy. You choose your style, send your gift request. It's a powerful way to connect on a personal level. Check out the samples, and REGISTER!! Become a Ven Me, Baby!
                
                <div className="text-center mt-1">❤️❤️❤️</div>
                
                {salonInitiated && (
                  <div className="flex justify-center mt-2 mb-2">
                    {status === 'sent' || status === 'accepted' || status === 'redeemed' || status === 'completed' ? (
                      <div className="px-3 py-0.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded flex items-center">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                        {status === 'sent' ? 'GIFT SENT' : 
                         status === 'accepted' ? 'GIFT ACCEPTED' : 
                         status === 'redeemed' ? 'GIFT REDEEMED' : 
                         'COMPLETED'}
                      </div>
                    ) : (
                      <>
                        {showButton ? (
                          <Button 
                            className="h-10 px-4 py-2 w-full bg-green-500 hover:bg-green-600 text-white font-medium"
                            onClick={onSendGift}
                          >
                            SEND GIFT
                          </Button>
                        ) : (
                          <div className="h-10 px-4 py-2 w-full flex items-center justify-center text-sm font-medium rounded-md bg-gray-200 text-gray-600">
                            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
                            GIFT UNAVAILABLE
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {/* Removed VMB ID display */}

              </>
            ) : (
              <>
                Hi <span className="font-semibold">{recipientName}</span>, I would love a fresh set. 
                My stylist has an opening for <span className="font-semibold">{styleOption}</span>, {price} ({time}) 
                will you Ven Me, Baby! ❤️❤️❤️ <span className="font-semibold">{senderName}</span>
                
                {/* Removed VMB ID display */}
              </>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-3 text-center text-xs text-gray-500">
        This invitation created on {new Date().toLocaleDateString()}
      </CardFooter>
    </Card>
  );
}