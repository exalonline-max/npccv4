import { ClerkProvider, SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedIn>
        <div className="flex items-center justify-center h-screen">
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
