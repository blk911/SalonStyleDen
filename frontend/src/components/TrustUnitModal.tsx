import React from 'react';

interface TrustUnitModalProps {
  triad: {
    id: string;
    members: Array<{ id: string; name: string }>;
  };
  onAccept: () => void;
  onReject: () => void;
}

export default function TrustUnitModal({ triad, onAccept, onReject }: TrustUnitModalProps) {
  const handleAccept = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    await fetch('/api/trust/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trustUnitId: triad.id, userId: user.id }),
    });
    onAccept();
  };

  return (
    <div className="modal">
      <h3 className="text-xl font-bold mb-4">You're invited to a Trust Unit</h3>
      <ul className="mb-4 space-y-2">
        {triad.members.map((m: any) => (
          <li key={m.id} className="text-gray-700">{m.name}</li>
        ))}
      </ul>
      <div className="flex space-x-4">
        <button 
          onClick={handleAccept}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Accept
        </button>
        <button 
          onClick={onReject}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
