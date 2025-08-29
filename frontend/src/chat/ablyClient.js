import * as Ably from 'ably'

const API_BASE = import.meta.env.VITE_API_BASE
const ABLY_AUTH_URL = import.meta.env.VITE_ABLY_AUTH_URL || `${API_BASE}/api/realtime/token`

export function createAblyRealtime(getToken){
  return new Ably.Realtime.Promise({
    authUrl: `${ABLY_AUTH_URL}?channel=campaign:12345`,
    authHeaders: async () => ({
      'Authorization': `Bearer ${await getToken()}`
    }),
    echoMessages: false,
    recover: 'connection',
  })
}
