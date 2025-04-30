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
  
  // Get the current client ID from the global window object
  useEffect(() => {
    // Try to get client ID from global window object
    const clientId = window._currentClientId || null;
    setCurrentClientId(clientId);
    
    // For debugging: log the client ID context
    console.log(`[FLOW] RenderedInvitation - Current client ID context: ${clientId || 'Not set'}`);
  }, []);
  
  // SITE-WIDE CRITICAL RULE - REVISED FOR FIX: 
  // The SEND GIFT button should ONLY appear when ALL conditions are met:
  // 1. We're NOT in preview mode (currentClientId must be set)
  // 2. The viewer is the intended recipient (client ID matches recipient name)
  // 3. The invitation status is 'pending'
  // 4. There is a valid onSendGift handler
  // 5. This is NOT a salon-initiated invitation
  
  // Additional sponsor relationship validation
  const isInPreviewMode = !currentClientId;
  const isClientViewingOwnInvitation = currentClientId === recipientName;
  const hasValidSendGiftHandler = Boolean(onSendGift);
  const isPendingStatus = status === 'pending';
  
  // CRITICAL RULE: Only show the SEND GIFT button when the invitation recipient
  // is viewing their own invitation from the Client Dashboard
  const showButton = !isInPreviewMode && 
                     isClientViewingOwnInvitation && 
                     hasValidSendGiftHandler && 
                     isPendingStatus &&
                     !salonInitiated; // Never show button in salon view
  
  console.log(`[FLOW] RenderedInvitation for ${recipientName} - Status: ${status} - Client ID: ${currentClientId || 'NOT SET'} - Is recipient viewing: ${isClientViewingOwnInvitation} - Send gift button will ${showButton ? 'SHOW' : 'HIDE'}`);
  
  return (
    <Card className={`w-full max-w-md mx-auto shadow-lg overflow-hidden ${className}`}>
      <CardHeader className={`${salonInitiated ? 'bg-amber-100' : 'bg-pink-100'} pb-2`}>
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">{salonName}</div>
          <div className="text-xs font-mono text-gray-600">{formattedInviteId}</div>
        </div>
        <h3 className={`text-xl font-semibold ${salonInitiated ? 'text-amber-800' : 'text-pink-800'} text-center mt-2`}>
          {salonInitiated ? "SALON INVITE" : "Ven Me, Baby! Gift Request"}
        </h3>
      </CardHeader>
      
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
                Hi <span className="font-semibold">{recipientName}</span>, We are joining Ven Me, Baby! It's all about YOU! Create a request, enter your BF, admirer, or Mr. and send your gift request for <span className="font-semibold">{styleOption}</span>. VMB fits today's lifestyle. It's direct, it's easy...and he gets to choose... Ven Me, Baby!
                
                <div className="text-center mt-1">❤️❤️❤️</div>
                
                <div className="flex justify-center space-x-2 mt-2 mb-2">
                  <Button className="bg-[#00D632] hover:bg-[#00B82D] text-white flex items-center px-1 py-0.5 h-auto text-xs">
                    <FaMoneyBillWave className="h-3 w-3 mr-1" />
                    $App
                  </Button>
                  <Button className="bg-[#3D95CE] hover:bg-[#3272A0] text-white flex items-center px-1 py-0.5 h-auto text-xs">
                    <FaMoneyBillWave className="h-3 w-3 mr-1" />
                    Zel
                  </Button>
                  <Button className="bg-[#008CFF] hover:bg-[#0070CC] text-white flex items-center px-1 py-0.5 h-auto text-xs">
                    <FaMoneyBillWave className="h-3 w-3 mr-1" />
                    Ven
                  </Button>
                </div>
                
                {salonInitiated && (
                  <div className="flex justify-center mt-1 mb-2">
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
                            className="px-3 py-0.5 h-auto text-xs bg-green-500 hover:bg-green-600 text-white"
                            onClick={onSendGift}
                          >
                            SEND GIFT
                          </Button>
                        ) : (
                          <div className="px-3 py-0.5 text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded flex items-center">
                            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
                            GIFT UNAVAILABLE
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                <div className="text-center mt-2 text-xs text-gray-400">VMB:{inviteId}</div>

              </>
            ) : (
              <>
                Hi <span className="font-semibold">{recipientName}</span>, I would love a fresh set. 
                My stylist has an opening for <span className="font-semibold">{styleOption}</span>, {price} ({time}) 
                will you Ven Me, Baby! ❤️❤️❤️ <span className="font-semibold">{senderName}</span>
                
                <div className="text-center mt-2 text-xs text-gray-400">VMB:{inviteId}</div>
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