import { useEffect, useRef, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
// Ably client import removed for clean re-implementation

export default function ChatPanel({ campaignId }){
  const { getToken } = useAuth()
  const { user } = useUser()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  // Ably client state removed for clean re-implementation

  useEffect(() => {
    // Ably client logic removed for clean re-implementation
    // TODO: Re-implement Ably connection and subscriptions
  }, [getToken, user])

  const send = async (e) => {
  // Ably send logic removed for clean re-implementation
  e.preventDefault()
  setText("")
  }

  return (
    <div className="border rounded-xl p-3 space-y-3">
      <div className="h-72 overflow-y-auto bg-neutral-100 rounded p-2">
        {messages.map((m, i) => (
          <div key={i} className="text-sm py-1">
            {m.type === 'chat' && <><b>{m.user}</b>: {m.text}</>}
            {m.type === 'system' && <em className="opacity-70">{m.text}</em>}
            {m.type === 'dice' && <code>🎲 {m.result}</code>}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input className="input input-bordered flex-1" value={text} onChange={e=>setText(e.target.value)} placeholder="Say something…" />
        <button className="btn btn-primary" type="submit">Send</button>
      </form>
    </div>
  )
}
