import { useEffect, useState } from 'react'

export default function CampaignMenu({ value, onChange }){
  const [campaigns, setCampaigns] = useState([])

  useEffect(() => {
    (async () => {
      // Normalize API base to avoid double /api when env already includes it
  const rawBase = import.meta.env.VITE_API_BASE || ''
  // Defensive fallback: if no build-time API base is provided, prefer the
  // currently known-working backend hostname. This only applies when the
  // env isn't set (e.g., forget to configure Render). If Render is set,
  // it will take precedence.
  const fallbackHost = 'https://npcchatter-backend-wll0.onrender.com'
  const base = (rawBase || fallbackHost).replace(/\/+$/,'').replace(/\/api$/i, '')
  const apiUrl = `${base}/api/campaigns`

      // Try server-side first
      try{
        const res = await fetch(apiUrl, { headers: { 'Accept': 'application/json' } })
        if(res.ok){
          const data = await res.json()
          setCampaigns(data)
          return
        }
      }catch(e){ /* fall back to local */ }

      try{
        const raw = localStorage.getItem('npc:campaigns')
        setCampaigns(raw ? JSON.parse(raw) : [])
      }catch(e){ setCampaigns([]) }
      
      // Ensure the currently selected campaign (if any) appears in the list.
      // This prevents the UI from saying "No campaigns yet" while an active
      // campaign is selected in the sidebar (stored under 'npc:selectedCampaign').
      try{
        const sel = localStorage.getItem('npc:selectedCampaign')
        if(sel){
          setCampaigns(prev => {
            if(!prev || prev.some(c => c.id === sel)) return prev || []
            const entry = { id: sel, name: `campaign:${sel}` }
            return [entry, ...(prev || [])]
          })
        }
      }catch(e){ /* ignore storage errors */ }
    })()
  }, [])

  useEffect(() => { localStorage.setItem('npc:campaigns', JSON.stringify(campaigns)) }, [campaigns])

  // Note: creation/joining flows removed — one chat per campaign. Selecting a
  // campaign from the list grants access to the chat (if the user is a member).

  return (
    <div>
      <div className="space-y-2">
        {campaigns.length === 0 && <p className="text-sm opacity-70">No campaigns yet.</p>}
        {campaigns.map(c => (
          <div key={c.id} onClick={() => { if (typeof onChange === 'function') onChange(c.id) }} className="p-2 rounded border flex items-center justify-between cursor-pointer hover:bg-gray-50">
            <div>
              <div className="text-sm font-medium">{c.name}</div>
              <div className="text-xs opacity-60">campaign:{c.id}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
