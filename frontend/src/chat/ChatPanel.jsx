import { useEffect, useRef, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { createAblyRealtime } from './ablyClient'

export default function ChatPanel({ campaignId }){
  const { getToken } = useAuth()
  const { user } = useUser()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const channelName = `campaign:${campaignId}`
  const clientRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    let client, channel
    let mounted = true

    (async () => {
      console.debug('[ChatPanel] mount for', channelName)
      try {
        client = createAblyRealtime(() => getToken(), channelName)
        await client.connection.once('connected')

        if (!mounted) {
          // If the effect was cleaned up while we were connecting, close the client
          try { client.close() } catch (e) {/* ignore */}
          return
        }

        channel = client.channels.get(channelName)
        try {
          await channel.presence.enter({ userId: user.id, name: user.fullName })
        } catch (e) {
          // presence enter can fail if not authorized; don't crash the UI
          console.warn('[ChatPanel] presence.enter failed', e)
        }

        try {
          channel.subscribe('chat', (msg) => setMessages(m => [...m, { type: 'chat', ...msg.data }]))
          channel.subscribe('system', (msg) => setMessages(m => [...m, { type: 'system', ...msg.data }]))
          channel.subscribe('dice', (msg) => setMessages(m => [...m, { type: 'dice', ...msg.data }]))
        } catch (e) {
          console.warn('[ChatPanel] subscribe failed', e)
        }

        try {
          const page = await channel.history({ limit: 25 })
          const history = []
          page.items.reverse().forEach(i => history.push({ type: i.name, ...i.data }))
          setMessages(history)
        } catch (e) {
          console.warn('[ChatPanel] history fetch failed', e)
        }

        clientRef.current = client
        channelRef.current = channel
      } catch (err) {
        console.error('[ChatPanel] connect error', err)
      }
    })()

    return () => {
      mounted = false
      console.debug('[ChatPanel] unmount for', channelName)
      try {
        if (channelRef.current) { channelRef.current.presence.leave() }
      } catch (e) { /* ignore */ }
      try {
        if (clientRef.current) { clientRef.current.close() }
      } catch (e) { /* ignore */ }
      clientRef.current = null
      channelRef.current = null
    }
  }, [channelName, getToken, user])

  const send = async (e) => {
    e.preventDefault()
    const ch = channelRef.current
    if(!ch || !text.trim()) return
    if (typeof ch.publish === 'function') {
      await ch.publish('chat', { user: user.fullName || user.username, text: text.trim(), ts: new Date().toISOString() })
    } else {
      console.warn('[ChatPanel] channel.publish is not a function', ch)
    }
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
