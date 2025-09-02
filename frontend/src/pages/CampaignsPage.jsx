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
  getCampaignMembers
} from '../utils/api';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const { user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, [user]);

  async function handleJoin(id) {
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
  }

  async function handleCreate(data) {
    const token = await getToken();
    await createCampaign(data, token);
    const all = await getCampaigns();
    setCampaigns(all);
  }

  function handleSetActive(id) {
    setActiveId(id);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <Topbar />
      <main className="px-2 py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="bg-gray-800 rounded-lg shadow-lg p-4 border border-yellow-900 flex flex-col items-center">
            <h2 className="text-2xl font-extrabold text-yellow-300 mb-2 tracking-wider">Create</h2>
            <p className="text-sm text-yellow-100 mb-4 italic">Forge a new adventure</p>
            <CreateCampaignForm onCreate={handleCreate} />
          </section>
          <section className="bg-gray-800 rounded-lg shadow-lg p-4 border border-green-900 flex flex-col items-center">
            <h2 className="text-2xl font-extrabold text-green-300 mb-2 tracking-wider">Join</h2>
            <p className="text-sm text-green-100 mb-4 italic">Browse open campaigns</p>
            <CampaignList campaigns={campaigns} onJoin={handleJoin} />
          </section>
          <section className="bg-gray-800 rounded-lg shadow-lg p-4 border border-blue-900 flex flex-col items-center">
            <h2 className="text-2xl font-extrabold text-blue-300 mb-2 tracking-wider">Play</h2>
            <p className="text-sm text-blue-100 mb-4 italic">Your active adventures</p>
            <UserCampaigns campaigns={userCampaigns} activeId={activeId} onSetActive={handleSetActive} />
          </section>
        </div>
      </main>
    </div>
  );
}
