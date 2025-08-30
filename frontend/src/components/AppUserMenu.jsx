import React from 'react'
import { UserButton } from '@clerk/clerk-react'

export default function AppUserMenu() {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link label="Campaigns" href="/campaigns" />
        <UserButton.Link label="Character Sheet" href="/character" />
        <UserButton.Link label="Preferences" href="/preferences" />
      </UserButton.MenuItems>
    </UserButton>
  )
}
