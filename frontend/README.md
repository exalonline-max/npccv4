# NPC Chatter Frontend

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file in the `frontend` folder with your environment variables:
   ```env
   VITE_API_BASE=https://your-backend-url.onrender.com
   VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx
   VITE_ABLY_AUTH_URL=https://your-backend-url.onrender.com/api/realtime/token
   VITE_ABLY_PUBLISHABLE_KEY=ably-key-here
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables
- `VITE_API_BASE`: Backend API base URL
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk publishable key
- `VITE_ABLY_AUTH_URL`: Ably auth endpoint
- `VITE_ABLY_PUBLISHABLE_KEY`: Ably public key

## Structure
- `src/chat/components`: Chat UI components
- `src/campaigns`: Campaigns logic and components
- `src/auth`: Authentication components
- `src/pages`: Main pages
- `src/layout`: Layout and navigation
- `src/utils`: Utility functions

## Integrations
- Clerk for authentication
- Ably for realtime chat
- Tailwind CSS for styling

---
For more details, see the backend README and environment setup.
