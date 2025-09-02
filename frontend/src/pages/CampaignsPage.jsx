import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import Topbar from '../components/Topbar';
import CreateCampaignForm from '../components/CreateCampaignForm';
import CampaignList from '../components/CampaignList';
import UserCampaigns from '../components/UserCampaigns';
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      const all = await getCampaigns();
      setCampaigns(all);
      if (user) {
        const userId = user.id;
        const joined = [];
        for (const c of all) {
          const members = await getCampaignMembers(c.id);
          if (members.includes(userId)) joined.push({ ...c, members });
        }
        setUserCampaigns(joined);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  async function handleJoin(id) {
    setLoading(true);
    const token = await getToken();
    await joinCampaign(id, token);
    const all = await getCampaigns();
    const userId = user.id;
    const joined = [];
    for (const c of all) {
      const members = await getCampaignMembers(c.id);
      if (members.includes(userId)) joined.push({ ...c, members });
    }
    setUserCampaigns(joined);
    setLoading(false);
  }

  async function handleCreate(data) {
    setLoading(true);
    const token = await getToken();
    await createCampaign(data, token);
    const all = await getCampaigns();
    setCampaigns(all);
    setLoading(false);
  }

  function handleSetActive(id) {
    setLoading(true);
    setActiveId(id);
    const campaign = userCampaigns.find(c => c.id === id);
    setActiveCampaign(campaign);
    // TODO: Save active campaign to user profile via backend
    setTimeout(() => setLoading(false), 500); // Simulate loading for UI feedback
  }

  async function handleEditCampaign(updated) {
    setLoading(true);
    const token = await getToken();
    await updateCampaign(updated.id, { name: updated.name, description: updated.description }, token);
    // Refresh campaigns after update
    const all = await getCampaigns();
    setCampaigns(all);
    if (user) {
      const userId = user.id;
      const joined = [];
      for (const c of all) {
        const members = await getCampaignMembers(c.id);
        if (members.includes(userId)) joined.push({ ...c, members });
      }
      setUserCampaigns(joined);
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
            <UserCampaigns campaigns={userCampaigns} activeId={activeId} onSetActive={handleSetActive} onEditCampaign={handleEditCampaign} />
          </section>
        </div>
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-600"></div>
          </div>
        )}
      </main>
    </div>
  );
}
