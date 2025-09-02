import { useEffect, useRef, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
// Ably client import removed for clean re-implementation

export default function ChatPanel({ campaignId }){
  const { getToken } = useAuth()
  const { user } = useUser()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [presentUsers, setPresentUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
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
          await channel.presence.enter({ userId: user.id, name: user.fullName, avatar: user.imageUrl })
        } catch (e) {
          // presence enter can fail if not authorized; don't crash the UI
          console.warn('[ChatPanel] presence.enter failed', e)
        }
        // Subscribe to presence updates
        const updatePresence = async () => {
          try {
            const members = await channel.presence.get()
            setPresentUsers(members.map(m => ({
              userId: m.clientId || m.data?.userId,
              name: m.data?.name || m.clientId,
              avatar: m.data?.avatar || '',
            })))
          } catch (e) {
            setPresentUsers([])
          }
        }
        channel.presence.subscribe('enter', updatePresence)
        channel.presence.subscribe('leave', updatePresence)
        channel.presence.subscribe('update', updatePresence)
        updatePresence()

        try {
          channel.subscribe('chat', (msg) => setMessages(m => [...m, { type: 'chat', ...msg.data }]))
          channel.subscribe('system', (msg) => setMessages(m => [...m, { type: 'system', ...msg.data }]))
          channel.subscribe('dice', (msg) => setMessages(m => [...m, { type: 'dice', ...msg.data }]))
          channel.subscribe('typing', (msg) => {
            const { userId, name } = msg.data || {}
            setTypingUsers(prev => {
              const filtered = prev.filter(u => u.userId !== userId)
              return [...filtered, { userId, name }]
            })
            // Remove typing indicator after 2s
            setTimeout(() => {
              setTypingUsers(prev => prev.filter(u => u.userId !== userId))
            }, 2000)
          })
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
    // Optimistic UI update: show message immediately
    setMessages(m => [...m, { type: 'chat', user: user.fullName || user.username, text: text.trim(), ts: new Date().toISOString(), optimistic: true }])
    if (typeof ch.publish === 'function') {
      await ch.publish('chat', { user: user.fullName || user.username, text: text.trim(), ts: new Date().toISOString() })
    } else {
      console.warn('[ChatPanel] channel.publish is not a function', ch)
    }
    setText("")
  }

  return (
    <div className="border rounded-xl p-3 space-y-3">
      {/* Presence user list */}
      <div className="flex gap-2 items-center mb-2 flex-wrap">
        {presentUsers.length > 0 ? (
          presentUsers.map(u => (
            <div key={u.userId} className="flex items-center gap-1 px-2 py-1 bg-neutral-200 rounded">
              {u.avatar ? (
                <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full border" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white">?</span>
              )}
              <span className="text-xs font-medium">{u.name}</span>
            </div>
          ))
        ) : (
          <span className="text-xs text-gray-400">No users online</span>
        )}
      </div>
      <div className="h-72 overflow-y-auto bg-neutral-100 rounded p-2">
        {messages.map((m, i) => (
          <div key={i} className="text-sm py-1">
            {m.type === 'chat' && <><b>{m.user}</b>: {m.text}</>}
            {m.type === 'system' && <em className="opacity-70">{m.text}</em>}
            {m.type === 'dice' && <code>🎲 {m.result}</code>}
          </div>
        ))}
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="text-xs text-gray-500 italic mt-2">
            {typingUsers.map(u => u.name).join(', ')} typing...
          </div>
        )}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input
          className="input input-bordered flex-1"
          value={text}
          onChange={e => {
            setText(e.target.value)
            // Broadcast typing event
            const ch = channelRef.current
            if (ch && typeof ch.publish === 'function') {
              ch.publish('typing', { userId: user.id, name: user.fullName })
            }
          }}
          placeholder="Say something…"
        />
        <button className="btn btn-primary" type="submit">Send</button>
      </form>
    </div>
  )
}
