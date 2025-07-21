import React, { useState } from 'react';
import VoiceAuthModal from '../components/VoiceAuthModal';
import TaikosVault from '../components/TaikosVault';

export default function TaikosPage() {
  const [verified, setVerified] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">TaiKos OS</h1>
          {!verified ? (
            <VoiceAuthModal 
              userId={user.id || "currentUserId"} 
              onVerified={() => setVerified(true)} 
            />
          ) : (
            <TaikosVault />
          )}
        </div>
      </div>
    </div>
  );
}
