import React, { useEffect, useState } from 'react';

export default function GamePage({ campaign, role = 'player', onClose }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!campaign) return;
      try {
        const { getCampaignMembers } = await import('../utils/api');
        const m = await getCampaignMembers(campaign.id);
        if (mounted) setMembers(m || []);
      } catch (e) {
        console.error('Failed to load members', e);
      }
    }
    load();
    return () => { mounted = false; };
  }, [campaign]);

  if (!campaign) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <p className="text-sm text-gray-500">Role: <span className="font-semibold capitalize">{role}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-gray-100 rounded" onClick={onClose}>Back</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="border rounded p-4 mb-4">
              <h2 className="font-semibold mb-2">Campaign Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line">{campaign.description || 'No description'}</p>
            </div>

            <div className="border rounded p-4">
              <h2 className="font-semibold mb-2">Live Chat</h2>
              <p className="text-sm text-gray-500">Chat will appear here (Ably integration to follow).</p>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <button className="px-3 py-2 bg-blue-600 text-white rounded">Roll Dice</button>
                <button className="px-3 py-2 bg-green-600 text-white rounded">Open Journal</button>
                <button className="px-3 py-2 bg-yellow-600 text-white rounded">View Map</button>
              </div>
            </div>

            <div className="border rounded p-4">
              <h3 className="font-semibold mb-2">Players</h3>
              <div className="text-sm text-gray-700 space-y-1">
                {members.length === 0 && <div className="italic text-gray-500">No players yet</div>}
                {members.map(id => (
                  <div key={id} className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">{id.slice(0,2)}</div>
                    <div className="truncate">{id}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
