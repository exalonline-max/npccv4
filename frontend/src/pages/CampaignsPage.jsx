import React, { useEffect, useState } from 'react'
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'

function normalizeBase(raw){
  const fallback = import.meta.env.VITE_API_BASE || ''
  const base = (raw || fallback).replace(/\/+$/,'').replace(/\/api$/i,'')
  return base || ''
}

export default function CampaignsPage(){
  const [campaigns, setCampaigns] = useState([])
  const [joined, setJoined] = useState(() => {
    try{ return JSON.parse(localStorage.getItem('npc:joinedCampaigns')||'[]') }catch(e){return []}
  })
  const [newName, setNewName] = useState('')
  const { getToken } = useAuth()

  const apiBaseRaw = import.meta.env.VITE_API_BASE || ''
  const apiBase = normalizeBase(apiBaseRaw)
  const apiPrefix = apiBase ? `${apiBase}/api` : '/api'

  useEffect(() => {
    (async ()=>{
      try{
        const res = await fetch(`${apiPrefix}/campaigns`, { headers: { Accept: 'application/json' } })
        if(res.ok){
          const data = await res.json()
          setCampaigns(data)
          return
        }
      }catch(e){ /* ignore, keep empty */ }
      // fallback to localStorage
      try{ const raw = localStorage.getItem('npc:campaigns'); setCampaigns(raw?JSON.parse(raw):[]) }catch(e){ setCampaigns([]) }
    })()
  }, [])

  useEffect(()=>{ localStorage.setItem('npc:joinedCampaigns', JSON.stringify(joined)) }, [joined])

  const createCampaign = async () => {
    if(!newName.trim()) return
    const token = await getToken({ template: 'backend' }).catch(()=>null)
    try{
      const res = await fetch(`${apiPrefix}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token?{ Authorization: `Bearer ${token}` }:{}) },
        body: JSON.stringify({ name: newName.trim() })
      })
      if(res.ok){
        const created = await res.json()
        setCampaigns(c=>[created,...c])
        setJoined(j=>[created.id, ...j.filter(x=>x!==created.id)])
        setNewName('')
        return
      }
      // else fall through
    }catch(e){ /* ignore */ }
    // fallback: local create
    const id = Math.random().toString(36).slice(2,9)
    const entry = { id, name: newName.trim() }
    setCampaigns(c=>[entry,...c])
    setJoined(j=>[entry.id, ...j.filter(x=>x!==entry.id)])
    setNewName('')
  }

  const joinCampaign = async (id) => {
    const token = await getToken({ template: 'backend' }).catch(()=>null)
    try{
      await fetch(`${apiPrefix}/campaigns/${id}/join`, {
        method: 'POST',
        headers: { ...(token?{ Authorization: `Bearer ${token}` }:{}) }
      })
    }catch(e){ /* ignore */ }
    setJoined(j=> j.includes(id) ? j : [id, ...j])
  }

  const myCampaigns = campaigns.filter(c=> joined.includes(c.id))
  const available = campaigns.filter(c=> !joined.includes(c.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Campaigns</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-4 flex gap-2">
              <input className="input flex-1" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="New campaign name" />
              <SignedIn>
                <button className="btn btn-primary" onClick={createCampaign}>Create</button>
              </SignedIn>
              <SignedOut>
                <button className="btn btn-primary opacity-60" disabled>Create</button>
              </SignedOut>
            </div>

            <h3 className="text-sm font-medium mb-2">Available Campaigns</h3>
            <div className="space-y-2">
              {available.length === 0 && <p className="text-sm opacity-70">No available campaigns.</p>}
              {available.map(c=> (
                <div key={c.id} className="p-3 rounded border flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs opacity-60">campaign:{c.id}</div>
                  </div>
                  <div>
                    <SignedIn>
                      <button className="btn btn-sm" onClick={()=>joinCampaign(c.id)}>Join</button>
                    </SignedIn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-white p-4">
            <h3 className="text-sm font-semibold mb-2">My Campaigns</h3>
            <div className="space-y-2">
              {myCampaigns.length === 0 && <p className="text-sm opacity-70">You haven't joined any campaigns yet.</p>}
              {myCampaigns.map(c=> (
                <div key={c.id} className="p-2 rounded border">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs opacity-60">campaign:{c.id}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
