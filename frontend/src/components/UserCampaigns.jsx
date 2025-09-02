import React from 'react';

export default function UserCampaigns({ campaigns, activeId, onSetActive }) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Your Campaigns</h2>
      <div className="space-y-4">
        {campaigns.map(campaign => {
          const avatarUrl = campaign.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(campaign.id || campaign.name)}`;
          return (
            <div key={campaign.id} className={`p-4 bg-white rounded-lg shadow flex flex-col gap-2 border transition ${activeId === campaign.id ? 'border-2 border-blue-600' : 'hover:shadow-lg'}`}>
              <div className="flex items-center gap-4">
                <img src={avatarUrl} alt="avatar" className="h-10 w-10 rounded-full border" />
                <div>
                  <span className="font-semibold text-lg">{campaign.name}</span>
                  {activeId === campaign.id && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Active</span>
                  )}
                  <p className="text-gray-500 text-sm mt-1">{campaign.description || <span className="italic text-gray-400">No description</span>}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2 items-center">
                {activeId !== campaign.id && (
                  <button
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => onSetActive(campaign.id)}
                  >
                    Set Active
                  </button>
                )}
                {/* Optional: Show members */}
                {campaign.members && (
                  <span className="text-xs text-gray-500">Members: {campaign.members.length}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
