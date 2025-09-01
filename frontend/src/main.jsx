import React from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './styles.css'

// Install development runtime error watcher to capture more context for
// 'true is not a function' style errors. Only load in Vite dev mode.
if (import.meta.env.DEV) {
  try { import('./dev/errorWatch').then(m => m.installErrorWatch && m.installErrorWatch()) } catch(e) { /* ignore */ }
}

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={clerkPubKey}>
    <App />
  </ClerkProvider>
)
