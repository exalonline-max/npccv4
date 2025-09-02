import React from 'react';

export default function UserCampaigns({ campaigns, activeId, onSetActive }) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-6">
      <h2 className="text-lg font-bold mb-2">Your Campaigns</h2>
      <div className="flex flex-col gap-2">
        {campaigns.map(campaign => {
          const avatarUrl = campaign.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(campaign.id || campaign.name)}`;
          return (
            <div key={campaign.id} className={`px-2 py-2 bg-white rounded shadow flex items-center gap-3 border transition text-sm ${activeId === campaign.id ? 'border-2 border-blue-600' : 'hover:shadow-md'}`}> 
              <img src={avatarUrl} alt="avatar" className="h-8 w-8 rounded-full border" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold truncate">{campaign.name}</span>
                {activeId === campaign.id && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Active</span>
                )}
                <span className="ml-2 text-gray-400 truncate">{campaign.description || <span className="italic">No description</span>}</span>
              </div>
              {activeId !== campaign.id && (
                <button
                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                  onClick={() => onSetActive(campaign.id)}
                >
                  Set Active
                </button>
              )}
              {campaign.members && (
                <span className="text-xs text-gray-500 ml-2">Members: {campaign.members.length}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
