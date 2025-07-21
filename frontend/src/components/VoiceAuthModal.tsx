import React, { useState } from 'react';

interface VoiceAuthModalProps {
  userId: string;
  onVerified: (challenge: any) => void;
}

export default function VoiceAuthModal({ userId, onVerified }: VoiceAuthModalProps) {
  const [recording, setRecording] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!recording) return;

    const formData = new FormData();
    formData.append('voice', recording);
    formData.append('userId', userId);

    const res = await fetch('/api/taikos/voice-auth', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.status === 'verified') {
      onVerified(data.challenge);
    } else {
      alert('Voice verification failed.');
    }
  };

  return (
    <div className="modal">
      <h2 className="text-xl font-bold mb-4">Voice Verification</h2>
      <div className="space-y-4">
        <input 
          type="file" 
          accept="audio/*" 
          onChange={e => setRecording(e.target.files?.[0] || null)}
          className="w-full"
        />
        <button 
          onClick={handleSubmit} 
          disabled={!recording}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
