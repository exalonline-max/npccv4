import React, { useState, useEffect } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'

function Nav({ open = false, onLinkClick = () => {} }) {
  const linkClass = ({ isActive }) => (isActive ? 'underline font-medium' : 'hover:underline')
  const safeOnLink = (...args) => { if (typeof onLinkClick === 'function') onLinkClick(...args) }

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-6 text-sm opacity-90">
  <NavLink to="/" className={linkClass} onClick={safeOnLink}>Home</NavLink>
  <NavLink to="/app/campaigns" className={linkClass} onClick={safeOnLink}>Campaigns</NavLink>
  <NavLink to="/app/character" className={linkClass} onClick={safeOnLink}>Character Sheet</NavLink>
  <NavLink to="/app/preferences" className={linkClass} onClick={safeOnLink}>Preferences</NavLink>
      </nav>

      {/* Mobile nav (shows when open=true) */}
      <nav className={`md:hidden ${open ? 'block' : 'hidden'} mt-2 border-t pt-2`}> 
        <ul className="flex flex-col gap-2 text-sm px-2">
          <li>
            <NavLink to="/" className={({ isActive }) => (isActive ? 'block px-3 py-2 rounded bg-gray-100 font-medium' : 'block px-3 py-2 rounded hover:bg-gray-50')} onClick={safeOnLink}>Home</NavLink>
          </li>
          <li>
            <NavLink to="/app/campaigns" className={({ isActive }) => (isActive ? 'block px-3 py-2 rounded bg-gray-100 font-medium' : 'block px-3 py-2 rounded hover:bg-gray-50')} onClick={safeOnLink}>Campaigns</NavLink>
          </li>
          <li>
            <NavLink to="/app/character" className={({ isActive }) => (isActive ? 'block px-3 py-2 rounded bg-gray-100 font-medium' : 'block px-3 py-2 rounded hover:bg-gray-50')} onClick={safeOnLink}>Character Sheet</NavLink>
          </li>
          <li>
            <NavLink to="/app/preferences" className={({ isActive }) => (isActive ? 'block px-3 py-2 rounded bg-gray-100 font-medium' : 'block px-3 py-2 rounded hover:bg-gray-50')} onClick={safeOnLink}>Preferences</NavLink>
          </li>
        </ul>
      </nav>
    </>
  )
}

function Brand() {
  return (
    <Link to="/" aria-label="Home" className="flex items-center gap-3">
      <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-cyan-500 grid place-items-center text-white font-black">N</div>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">NPC Chatter</h1>
          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">beta</span>
        </div>
        <p className="text-xs opacity-70 -mt-0.5">Tools for DMs & Players</p>
      </div>
    </Link>
  )
}

function Header() {
  const { user } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brand />
        </div>

  <div className="flex-1" />

        <div className="flex items-center gap-3">
          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setMobileOpen(v => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </button>

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

      {/* Mobile nav container placed after header content for layout flow */}
      <div className="mx-auto max-w-6xl px-4">
        <Nav open={mobileOpen} onLinkClick={() => setMobileOpen(false)} />
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

import ChatPanel from './chat/components/ChatPanel'
import CampaignMenu from './campaigns/CampaignMenu'
import CampaignsPage from './campaigns/CampaignsPage'

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
  const navigate = (typeof window !== 'undefined' ? null : null)
  // We'll use useEffect + window navigation to avoid importing router hooks at top-level in case
  // this file is evaluated outside of a Router in some tests. When inside the Router, useHistory
  // is available — but keep a simple client-side redirect here.
  useEffect(() => {
    try {
      const sel = localStorage.getItem('npc:selectedCampaign')
      if (!sel) {
        // Only redirect if we're not already on the campaigns page
        if (!window.location.pathname.startsWith('/app/campaigns')) {
          window.location.href = '/app/campaigns'
        }
      }
    } catch (e) {
      // ignore (e.g., SSR or localStorage not available)
    }
  }, [])

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
