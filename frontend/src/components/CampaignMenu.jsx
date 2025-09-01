import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

export default function CampaignMenu({ value, onChange }){
  const [campaigns, setCampaigns] = useState([])
  const [newName, setNewName] = useState('')
  const { getToken } = useAuth()

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

  const create = async () => {
    if(!newName.trim()) return
    // Try server-side create
  try{
  const rawBase = import.meta.env.VITE_API_BASE || ''
  const fallbackHost = 'https://npcchatter-backend-wll0.onrender.com'
  const base = (rawBase || fallbackHost).replace(/\/+$/,'').replace(/\/api$/i, '')
  const apiUrl = `${base}/api/campaigns`
  const token = await getToken({ template: 'backend' }).catch(()=>null)
  const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: newName.trim() })
      })
      if(res.ok){
        const created = await res.json()
        setCampaigns(c => [created, ...c])
        setNewName('')
        onChange && onChange(created.id)
        return
      }
    }catch(e){ /* ignore -> fallback */ }

    // fallback local
    const id = Math.random().toString(36).slice(2,9)
    const entry = { id, name: newName.trim() }
    setCampaigns(c => [entry, ...c])
    setNewName('')
    onChange && onChange(entry.id)
  }

  const join = async (id) => {
  try{
  const rawBase = import.meta.env.VITE_API_BASE || ''
  const fallbackHost = 'https://npcchatter-backend-wll0.onrender.com'
  const base = (rawBase || fallbackHost).replace(/\/+$/,'').replace(/\/api$/i, '')
  const apiUrl = `${base}/api/campaigns/${id}/join`
  const token = await getToken({ template: 'backend' }).catch(()=>null)
  await fetch(apiUrl, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
    }catch(e){ /* ignore */ }
    onChange && onChange(id)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <input className="input input-sm flex-1" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="New campaign name" />
        <button className="btn btn-sm btn-primary" onClick={create}>Create</button>
      </div>

      <div className="space-y-2">
        {campaigns.length === 0 && <p className="text-sm opacity-70">No campaigns yet. Create one to get started.</p>}
        {campaigns.map(c => (
          <div key={c.id} className="p-2 rounded border flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{c.name}</div>
              <div className="text-xs opacity-60">campaign:{c.id}</div>
            </div>
            <div>
              <button className="btn btn-xs" onClick={() => join(c.id)}>Join</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
