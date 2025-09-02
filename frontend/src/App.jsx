import { ClerkProvider, SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedIn>
        <div className="flex flex-col items-center justify-center h-screen gap-6">
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" />
            <span className="text-lg">Signed in!</span>
          </div>
          <h1 className="text-3xl font-bold">Welcome to NPC Chatter</h1>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex items-center justify-center h-screen">
          <SignIn />
        </div>
      </SignedOut>
    </ClerkProvider>
  );
}
