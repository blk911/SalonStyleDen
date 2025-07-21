import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState<any>({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.id) {
      fetch(`/api/dashboard?userId=${user.id}`)
        .then(res => res.json())
        .then(setData);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome, {data.user?.name}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Invites Sent</h2>
              <ul className="space-y-2">
                {data.invitesSent?.map((inv: any) => (
                  <li key={inv.id} className="text-sm text-gray-600">
                    {inv.phoneNumber} — {inv.status}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Trust Units</h2>
              <ul className="space-y-2">
                {data.trustUnits?.map((tu: any) => (
                  <li key={tu.id} className="text-sm text-gray-600">
                    Members: {tu.memberA}, {tu.memberB}, {tu.memberC} — 
                    Status: {tu.confirmedA && tu.confirmedB && tu.confirmedC ? '✅ Confirmed' : '⌛ Pending'}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded">
                  Send Invite
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded">
                  Access TaiKos Vault
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded">
                  Create Trust Unit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
