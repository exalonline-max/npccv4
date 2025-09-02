import React from 'react';

export default function CampaignList({ campaigns, onJoin }) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Available Campaigns</h2>
      <div className="space-y-4">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="p-4 bg-white rounded shadow flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {campaign.avatar && (
                <img src={campaign.avatar} alt="avatar" className="h-8 w-8 rounded-full border" />
              )}
              <span className="font-semibold text-lg">{campaign.name}</span>
            </div>
            <p className="text-gray-600">{campaign.description}</p>
            <button
              className="self-end px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => onJoin(campaign.id)}
            >
              Join
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
