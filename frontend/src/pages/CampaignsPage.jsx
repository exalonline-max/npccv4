import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import Topbar from '../components/Topbar';
import CreateCampaignForm from '../components/CreateCampaignForm';
import CampaignList from '../components/CampaignList';
import UserCampaigns from '../components/UserCampaigns';
import GamePage from './GamePage';
import {
  getCampaigns,
  createCampaign,
  joinCampaign,
  getCampaignMembers,
  updateCampaign
} from '../utils/api';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const { getToken } = useAuth();
  const [showGame, setShowGame] = useState(false);

  useEffect(() => {
  async function refreshLists() {
      setLoading(true);
      const all = await getCampaigns();
      if (user) {
        const userId = user.id;
        const joined = [];
        for (const c of all) {
          const members = await getCampaignMembers(c.id);
          if (members.includes(userId)) joined.push({ ...c, members });
        }
        const joinedIds = new Set(joined.map(c => c.id));
        setUserCampaigns(joined);
        // Only show campaigns the user has NOT already joined
        setCampaigns(all.filter(c => !joinedIds.has(c.id)));
      } else {
        setCampaigns(all);
        setUserCampaigns([]);
      }
      setLoading(false);
    }
    refreshLists();
    // Also load persisted active campaign for this user
    async function loadActive() {
      if (!user) return;
      try {
        const token = await getToken();
        const { getActiveCampaign } = await import('../utils/api');
        const res = await getActiveCampaign(token);
        if (res && res.active) {
          setActiveId(res.active);
          // activeCampaign will be set after we populate userCampaigns below
        }
      } catch (e) {
        // ignore
      }
    }
    loadActive();
  }, [user]);

  // Keep activeCampaign object in sync when activeId or userCampaigns change
  useEffect(() => {
    if (!activeId) {
      setActiveCampaign(null);
      return;
    }
    const found = userCampaigns.find(c => c.id === activeId);
    if (found) setActiveCampaign(found);
  }, [activeId, userCampaigns]);

  async function handleJoin(id) {
    setLoading(true);
    const token = await getToken();
    await joinCampaign(id, token);
    // Refresh lists so the joined campaign is removed from available list
    const all = await getCampaigns();
    if (user) {
      const userId = user.id;
      const joined = [];
      for (const c of all) {
        const members = await getCampaignMembers(c.id);
        if (members.includes(userId)) joined.push({ ...c, members });
      }
      const joinedIds = new Set(joined.map(c => c.id));
      setUserCampaigns(joined);
      setCampaigns(all.filter(c => !joinedIds.has(c.id)));
    } else {
      setCampaigns(all);
    }
    setLoading(false);
  }

  async function handleCreate(data) {
    setLoading(true);
    const token = await getToken();
    await createCampaign(data, token);
    // Refresh lists after creating a campaign
    const all = await getCampaigns();
    if (user) {
      const userId = user.id;
      const joined = [];
      for (const c of all) {
        const members = await getCampaignMembers(c.id);
        if (members.includes(userId)) joined.push({ ...c, members });
      }
      const joinedIds = new Set(joined.map(c => c.id));
      setUserCampaigns(joined);
      setCampaigns(all.filter(c => !joinedIds.has(c.id)));
    } else {
      setCampaigns(all);
    }
    setLoading(false);
  }

  async function handleSetActive(id) {
    setLoading(true);
    setActiveId(id);
    const campaign = userCampaigns.find(c => c.id === id);
    setActiveCampaign(campaign);
    try {
      const token = await getToken();
      const { setActiveCampaign } = await import('../utils/api');
      await setActiveCampaign(id, token);
    } catch (e) {
      // ignore saving error for now
    }
    setLoading(false);
  }

  async function handleEditCampaign(updated) {
    setLoading(true);
    const token = await getToken();
    console.debug('Calling updateCampaign API:', {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      token
    });
    try {
      await updateCampaign(updated.id, { name: updated.name, description: updated.description }, token);
    } catch (e) {
      console.error('Update failed', e);
      alert('Failed to update campaign');
    }
    // Refresh lists after update
    const all = await getCampaigns();
    if (user) {
      const userId = user.id;
      const joined = [];
      for (const c of all) {
        const members = await getCampaignMembers(c.id);
        if (members.includes(userId)) joined.push({ ...c, members });
      }
      const joinedIds = new Set(joined.map(c => c.id));
      setUserCampaigns(joined);
      setCampaigns(all.filter(c => !joinedIds.has(c.id)));
    } else {
      setCampaigns(all);
    }
    setLoading(false);
  }

  function handleOpenCampaign(campaign) {
    // set active and open game UI
    if (!campaign) return;
    setActiveId(campaign.id);
    setActiveCampaign(campaign);
    setShowGame(true);
  }

  async function handleLeave(id) {
    setLoading(true);
    try {
      const token = await getToken();
      const { leaveCampaign } = await import('../utils/api');
      await leaveCampaign(id, token);
      // Refresh lists
      const all = await getCampaigns();
      if (user) {
        const userId = user.id;
        const joined = [];
        for (const c of all) {
          const members = await getCampaignMembers(c.id);
          if (members.includes(userId)) joined.push({ ...c, members });
        }
        const joinedIds = new Set(joined.map(c => c.id));
        setUserCampaigns(joined);
        setCampaigns(all.filter(c => !joinedIds.has(c.id)));
        // If the active campaign was the one left, clear it locally
        if (activeId === id) {
          setActiveId(null);
          setActiveCampaign(null);
        }
      } else {
        setCampaigns(all);
      }
    } catch (e) {
      console.error('Leave failed', e);
      alert('Failed to leave campaign');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-50 relative">
  <Topbar activeCampaign={activeCampaign} />
  <main className="px-2 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="bg-white rounded-lg shadow-lg p-4 border border-yellow-900 flex flex-col items-center">
            <h2 className="text-2xl font-extrabold text-yellow-700 mb-2 tracking-wider">Create</h2>
            <p className="text-sm text-yellow-900 mb-4 italic">Forge a new adventure</p>
            <CreateCampaignForm onCreate={handleCreate} />
          </section>
          <section className="bg-white rounded-lg shadow-lg p-4 border border-green-900 flex flex-col items-center">
            <h2 className="text-2xl font-extrabold text-green-700 mb-2 tracking-wider">Join</h2>
            <p className="text-sm text-green-900 mb-4 italic">Browse open campaigns</p>
            <CampaignList campaigns={campaigns} onJoin={handleJoin} />
          </section>
            <section className="bg-white rounded-lg shadow-lg p-4 border border-blue-900 flex flex-col items-center">
            <h2 className="text-2xl font-extrabold text-blue-700 mb-2 tracking-wider">Play</h2>
            <p className="text-sm text-blue-900 mb-4 italic">Your active adventures</p>
            <UserCampaigns campaigns={userCampaigns} activeId={activeId} onSetActive={handleSetActive} onEditCampaign={handleEditCampaign} onOpen={handleOpenCampaign} />
          </section>
        </div>
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-600"></div>
          </div>
        )}
        {showGame && activeCampaign && (
          <GamePage campaign={activeCampaign} role={'player'} onClose={() => setShowGame(false)} />
        )}
      </main>
    </div>
  );
}
