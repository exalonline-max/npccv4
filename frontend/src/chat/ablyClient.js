import * as Ably from 'ably'

const API_BASE = import.meta.env.VITE_API_BASE
const ABLY_AUTH_URL = import.meta.env.VITE_ABLY_AUTH_URL || `${API_BASE}/api/realtime/token`

export function createAblyRealtime(getToken, channel){
  return new Ably.Realtime.Promise({
    // Use authCallback so we can include the Clerk JWT in the Authorization header
    // when fetching a token request from our backend.
    authCallback: (tokenParams, callback) => {
      (async () => {
        try {
          const tokenRes = await fetch(`${ABLY_AUTH_URL}?channel=${encodeURIComponent(channel)}`, {
            headers: { 'Authorization': `Bearer ${await getToken()}` }
          })
          if(!tokenRes.ok){
            const text = await tokenRes.text()
            throw new Error(`Auth request failed: ${tokenRes.status} ${text}`)
          }
          const tokenRequest = await tokenRes.json()
          callback(null, tokenRequest)
        } catch(err){
          callback(err)
        }
      })()
    },
    echoMessages: false,
    recover: 'connection',
  })
}

// Example Clerk UserButton with custom menu items
// You can move this into your layout/header file as needed
import { UserButton } from "@clerk/clerk-react";

export function AppUserMenu() {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link label="Campaigns" href="/campaigns" />
        <UserButton.Link label="Character Sheet" href="/character" />
        <UserButton.Link label="Preferences" href="/preferences" />
      </UserButton.MenuItems>
    </UserButton>
  );
}
