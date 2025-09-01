import React, { useState, useEffect } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

function Nav() {
  return (
    <nav className="hidden md:flex items-center gap-6 text-sm opacity-90">
      <Link to="/app/campaigns" className="hover:underline">Campaigns</Link>
      <Link to="/app/character" className="hover:underline">Character Sheet</Link>
      <Link to="/app/preferences" className="hover:underline">Preferences</Link>
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-cyan-500 grid place-items-center text-white font-black">N</div>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">NPC Chatter</h1>
          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">beta</span>
        </div>
        <p className="text-xs opacity-70 -mt-0.5">Tools for DMs & Players</p>
      </div>
    </div>
  )
}

function Header() {
  const { user } = useUser()
  return (
    <header className="sticky top-0 z-10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Brand />
        <Nav />
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton>
              <button className="px-3 py-1.5 rounded border hover:bg-gray-50 text-sm">Sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <span className="hidden sm:block text-xs opacity-70">{user?.primaryEmailAddress?.emailAddress}</span>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}

function DevEnvBadge(){
  if (import.meta.env.MODE !== 'development') return null
  const base = import.meta.env.VITE_API_BASE || ''
  return (
    <div className="fixed bottom-3 right-3 text-[10px] px-2 py-1 rounded bg-gray-900 text-white/90 opacity-80">
      dev • API: {base}
    </div>
  )
}

import ChatPanel from './chat/ChatPanel'
import CampaignMenu from './components/CampaignMenu'
import CampaignsPage from './pages/CampaignsPage'

export default function App(){
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Routes>
            <Route path="/app/campaigns" element={<CampaignsPage />} />
            <Route path="/app/*" element={<AppShell />} />
            <Route path="/" element={<AppShell />} />
          </Routes>
        </main>
        <DevEnvBadge />
      </div>
    </BrowserRouter>
  )
}

function AppShell(){
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Chat / Main content */}
      <section className="lg:col-span-8">
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <p className="text-xs opacity-70">Channel: {`campaign:${localStorage.getItem('npc:selectedCampaign') || 'none'}`}</p>
            </div>
          </div>
          <div className="p-4">
            <SignedIn>
              <CampaignMenuWrapper />
            </SignedIn>
            <SignedOut>
              <p className="text-sm opacity-80">Please sign in to join campaign chat.</p>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Right: Sidebar placeholders */}
      <aside className="lg:col-span-4 space-y-6">
        <div className="rounded-xl border bg-white shadow-sm p-4">
          <h3 className="text-sm font-semibold mb-2">Active Campaign</h3>
          <ActiveCampaignPanel />
        </div>

        <div className="rounded-xl border bg-white shadow-sm p-4">
          <h3 className="text-sm font-semibold mb-2">Modules</h3>
          <ul className="text-sm opacity-80 space-y-2 pl-0">
            <li className="p-2 rounded border bg-gray-50">Quests</li>
            <li className="p-2 rounded border bg-gray-50">Achievements</li>
            <li className="p-2 rounded border bg-gray-50">Worldmap</li>
            <li className="p-2 rounded border bg-gray-50">Translator</li>
          </ul>
        </div>

        <div className="rounded-xl border bg-white shadow-sm p-4">
          <h3 className="text-sm font-semibold mb-2">Widgets</h3>
          <p className="text-sm opacity-80">Design quick toggles & counters (e.g., Rage, Transformations). Coming soon.</p>
        </div>
      </aside>
    </main>
  )
}


function CampaignMenuWrapper(){
  const [selected, setSelected] = useState(() => {
    return localStorage.getItem('npc:selectedCampaign') || null
  })

  useEffect(() => {
    if(selected) localStorage.setItem('npc:selectedCampaign', selected)
  }, [selected])

  return (
    <div>
      <div className="mb-4">
        <CampaignMenu value={selected} onChange={id => setSelected(id)} />
      </div>
      {selected ? <ChatPanel campaignId={selected} /> : <p className="text-sm opacity-80">Select or create a campaign to join the chat.</p>}
    </div>
  )
}

function ActiveCampaignPanel(){
  const sel = localStorage.getItem('npc:selectedCampaign')
  return (
    <div>
      {sel ? (
        <div className="text-sm opacity-80">You’re viewing <span className="font-medium">campaign:{sel}</span></div>
      ) : (
        <div className="text-sm opacity-80">No campaign selected. Create or join one.</div>
      )}
    </div>
  )
}
