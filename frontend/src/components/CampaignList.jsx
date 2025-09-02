import React from 'react';

export default function CampaignList({ campaigns, onJoin }) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Available Campaigns</h2>
      <div className="space-y-4">
        {campaigns.map(campaign => {
          const avatarUrl = campaign.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(campaign.id || campaign.name)}`;
          return (
            <div key={campaign.id} className="p-4 bg-white rounded-lg shadow flex flex-col gap-2 border hover:shadow-lg transition">
              <div className="flex items-center gap-4">
                <img src={avatarUrl} alt="avatar" className="h-10 w-10 rounded-full border" />
                <div>
                  <span className="font-semibold text-lg">{campaign.name}</span>
                  <p className="text-gray-500 text-sm mt-1">{campaign.description || <span className="italic text-gray-400">No description</span>}</p>
                </div>
              </div>
              <button
                className="self-end px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-2"
                onClick={() => onJoin(campaign.id)}
              >
                Join
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
