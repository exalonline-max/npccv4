import { UserButton } from '@clerk/clerk-react';

export default function Topbar() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="NPC Chatter Logo" className="h-10 w-10 rounded-full border border-gray-300" />
        <span className="text-2xl font-bold text-gray-800 tracking-tight">NPC Chatter</span>
      </div>
      <UserButton afterSignOutUrl="/" />
    </header>
  );
}
