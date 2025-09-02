import { ClerkProvider, SignedIn, SignedOut, SignIn } from '@clerk/clerk-react';
import CampaignsPage from './pages/CampaignsPage';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedIn>
        <CampaignsPage />
      </SignedIn>
      <SignedOut>
        <div className="flex items-center justify-center h-screen">
          <SignIn />
        </div>
      </SignedOut>
    </ClerkProvider>
  );
}
