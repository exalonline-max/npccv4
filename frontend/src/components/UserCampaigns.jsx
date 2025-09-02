import React, { useState } from 'react';

  const [menuOpen, setMenuOpen] = useState({});

  function toggleMenu(id) {
    setMenuOpen(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function handleLeave(id) {
    // TODO: Implement leave campaign logic
    alert(`Leave campaign ${id}`);
    setMenuOpen(prev => ({ ...prev, [id]: false }));
  }

  function handleEdit(id) {
    // TODO: Implement edit campaign logic
    alert(`Edit campaign ${id}`);
    setMenuOpen(prev => ({ ...prev, [id]: false }));
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-6">
      <h2 className="text-lg font-bold mb-2">Your Campaigns</h2>
      <div className="flex flex-col gap-2">
        {campaigns.map(campaign => {
          const avatarUrl = campaign.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(campaign.id || campaign.name)}`;
          return (
            <div key={campaign.id} className={`relative px-2 py-2 bg-white rounded shadow flex items-center gap-3 border transition text-sm ${activeId === campaign.id ? 'border-2 border-blue-600' : 'hover:shadow-md'}`}> 
              <img src={avatarUrl} alt="avatar" className="h-8 w-8 rounded-full border" />
              <div className="flex-1 min-w-0">
                <span className="font-semibold truncate">{campaign.name}</span>
                {activeId === campaign.id && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Active</span>
                )}
                <span className="ml-2 text-gray-400 truncate">{campaign.description || <span className="italic">No description</span>}</span>
              </div>
              <button
                className="ml-2 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
                onClick={() => toggleMenu(campaign.id)}
                aria-label="Campaign menu"
              >
                <svg width="20" height="20" fill="currentColor" className="text-gray-500" viewBox="0 0 20 20">
                  <circle cx="4" cy="10" r="2" />
                  <circle cx="10" cy="10" r="2" />
                  <circle cx="16" cy="10" r="2" />
                </svg>
              </button>
              {menuOpen[campaign.id] && (
                <div className="absolute right-2 top-12 z-10 bg-white border rounded shadow-lg py-1 w-40">
                  {activeId !== campaign.id && (
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700"
                      onClick={() => { onSetActive(campaign.id); setMenuOpen(prev => ({ ...prev, [campaign.id]: false })); }}
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-700"
                    onClick={() => handleLeave(campaign.id)}
                  >
                    Leave Campaign
                  </button>
                  {/* TODO: Only show Edit if user is owner */}
                  <button
                    className="block w-full text-left px-4 py-2 hover:bg-yellow-50 text-yellow-700"
                    onClick={() => handleEdit(campaign.id)}
                  >
                    Edit Campaign
                  </button>
                </div>
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
