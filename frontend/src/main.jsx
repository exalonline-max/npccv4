import React from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './styles.css'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={clerkPubKey}>
    <App />
  </ClerkProvider>
)
