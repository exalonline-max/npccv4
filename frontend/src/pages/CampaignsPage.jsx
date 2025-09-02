import { useUser, useAuth } from '@clerk/clerk-react';
import {
  getCampaigns,
  createCampaign,
  joinCampaign,
  getCampaignMembers,
} from '../utils/api';

  const [campaigns, setCampaigns] = useState([]);
  const [userCampaigns, setUserCampaigns] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const { user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    async function load() {
      const all = await getCampaigns();
      setCampaigns(all);
      // Get campaigns the user is a member of
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
    // Refresh user campaigns
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
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <main className="px-4 py-8">
        <CreateCampaignForm onCreate={handleCreate} />
        <CampaignList campaigns={campaigns} onJoin={handleJoin} />
        <UserCampaigns campaigns={userCampaigns} activeId={activeId} onSetActive={handleSetActive} />
      </main>
    </div>
  );
