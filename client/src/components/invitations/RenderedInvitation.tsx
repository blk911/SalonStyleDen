import React from 'react';

interface RenderedInvitationProps {
  recipientName?: string;
  styleOption?: string;
  priceAndTime?: string;
  signature?: string;
  inviteId?: string;
  onVenSelected?: () => void;
  onCashAppSelected?: () => void;
  onZelleSelected?: () => void;
  onDecline?: () => void;
  onPass?: () => void;
}

export const RenderedInvitation: React.FC<RenderedInvitationProps> = ({
  recipientName = "[NAME]",
  styleOption = "[STY OPT]",
  priceAndTime = "[price and time]",
  signature = "[SIGNED]",
  inviteId = "[RANDOM ID]",
  onVenSelected,
  onCashAppSelected,
  onZelleSelected,
  onDecline,
  onPass
}) => {
  return (
    <div className="border-2 border-teal-600 rounded-md p-6 max-w-md mx-auto">
      {/* Message text */}
      <div className="text-center mb-4">
        <p className="mb-1">
          Hi {recipientName}, I would love a fresh set. My stylist has an opening 
          for a {styleOption}, {priceAndTime}
        </p>
        <p>will you Ven Me, Baby! <span className="text-pink-500">❤️ ❤️ ❤️</span> {signature}</p>
      </div>

      {/* Unique ID */}
      <div className="text-center mb-4">
        Your VMB gift has a unique ID: <strong className="text-pink-600">VMB-{inviteId}</strong>
      </div>

      {/* Buttons */}
      <div>
        {/* Payment options */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button 
            className="bg-green-100 text-green-800 py-2 px-4 rounded border border-green-200"
            onClick={onVenSelected}
          >
            VEN
          </button>
          <button 
            className="bg-blue-100 text-blue-800 py-2 px-4 rounded border border-blue-200"
            onClick={onCashAppSelected}
          >
            C app
          </button>
          <button 
            className="bg-orange-100 text-orange-800 py-2 px-4 rounded border border-orange-200"
            onClick={onZelleSelected}
          >
            Zel
          </button>
        </div>

        {/* Response options */}
        <div className="grid grid-cols-2 gap-2">
          <button 
            className="bg-red-100 text-red-800 py-2 px-4 rounded border border-red-200"
            onClick={onPass}
          >
            Pass
          </button>
          <button 
            className="bg-green-100 text-green-800 py-2 px-4 rounded border border-green-200"
            onClick={onDecline}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};