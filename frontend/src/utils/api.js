// Utility functions for frontend API calls to backend

export async function getCampaigns() {
  const res = await fetch('/api/campaigns', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return await res.json();
}

export async function createCampaign(data, token) {
  const res = await fetch('/api/campaigns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to create campaign');
  return await res.json();
}

export async function joinCampaign(id, token) {
  const res = await fetch(`/api/campaigns/${id}/join`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to join campaign');
  return await res.json();
}

export async function getCampaignMembers(id) {
  const res = await fetch(`/api/campaigns/${id}/members`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch members');
  return await res.json();
}
