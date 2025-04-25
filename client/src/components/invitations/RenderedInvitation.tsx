import React from 'react';
import { FaMoneyBillWave } from 'react-icons/fa';
import { SiZelle, SiVenmo, SiCashapp } from 'react-icons/si';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";

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
  salonInitiated = false
}: RenderedInvitationProps) {
  const formattedInviteId = inviteId.startsWith('INV-FINAL-') ? inviteId : `INV-FINAL-${inviteId}`;
  
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
          <AspectRatio ratio={4/3} className="bg-muted rounded-md overflow-hidden">
            <img 
              src={imageUrl} 
              alt={styleOption}
              className="object-cover w-full h-full"
            />
          </AspectRatio>
        </div>
        
        <div className="space-y-4">
          <div className={`text-center italic text-gray-700 px-4 ${salonInitiated ? 'text-sm' : ''}`}>
            {salonInitiated ? (
              <>
                Hi <span className="font-semibold">{recipientName}</span>, We are joining Ven Me, Baby! It's all about YOU! Create a gift request, enter your BF, admirer, Mr. and send! Pre-paid styling appointments. It fits today's lifestyle. It's direct, it's easy...and he gets to choose... Ven Me, Baby! ❤️❤️❤️
                
                <div className="flex justify-center space-x-4 mt-3 mb-3">
                  <Button className="bg-[#00D632] hover:bg-[#00B82D] text-white flex items-center space-x-2">
                    <FaMoneyBillWave className="h-5 w-5" />
                    <span>CashApp</span>
                  </Button>
                  <Button className="bg-[#3D95CE] hover:bg-[#3272A0] text-white flex items-center space-x-2">
                    <FaMoneyBillWave className="h-5 w-5" />
                    <span>Zelle</span>
                  </Button>
                  <Button className="bg-[#008CFF] hover:bg-[#0070CC] text-white flex items-center space-x-2">
                    <FaMoneyBillWave className="h-5 w-5" />
                    <span>Venmo</span>
                  </Button>
                </div>
                
                {salonInitiated && (
                  <div className="flex justify-center mt-2 mb-3">
                    <Button 
                      className="w-3/4 bg-green-500 hover:bg-green-600 text-white"
                    >
                      SEND GIFT
                    </Button>
                  </div>
                )}
                
                <div>PS: Clients register here: <a href="/index" className="inline-flex items-center bg-gray-100 text-gray-800 rounded-full p-1 text-xs hover:bg-gray-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></a></div>
              </>
            ) : (
              <>
                Hi <span className="font-semibold">{recipientName}</span>, I would love a fresh set. 
                My stylist has an opening for <span className="font-semibold">{styleOption}</span>, {price} ({time}) 
                will you Ven Me, Baby! ❤️❤️❤️ <span className="font-semibold">{senderName}</span>
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