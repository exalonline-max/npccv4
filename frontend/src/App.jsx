import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import ChatPanel from './chat/ChatPanel'

export default function App(){
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">NPC Chatter v4</h1>
        <div>
          <SignedOut><SignInButton /></SignedOut>
          <SignedIn><UserButton /></SignedIn>
        </div>
      </header>

      <SignedIn><ChatPanel campaignId="12345" /></SignedIn>
      <SignedOut><p className="text-sm opacity-80">Please sign in to join campaign chat.</p></SignedOut>
    </div>
  )
}
