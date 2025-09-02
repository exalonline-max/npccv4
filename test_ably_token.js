import fetch from 'node-fetch'

// Replace with a valid Clerk JWT for testing
const CLERK_JWT = process.env.TEST_CLERK_JWT || '<YOUR_CLERK_JWT>'
const ABLY_AUTH_URL = process.env.TEST_ABLY_AUTH_URL || 'https://npcchatter-backend-wll0.onrender.com/api/realtime/token?channel=campaign:test'

async function testAblyTokenEndpoint() {
  const res = await fetch(ABLY_AUTH_URL, {
    headers: {
      'Authorization': `Bearer ${CLERK_JWT}`,
      'Accept': 'application/json'
    }
  })
  const data = await res.json().catch(() => null)
  if (res.ok && data && data.keyName && data.mac) {
    console.log('✅ Ably token endpoint success:', data)
  } else {
    console.error('❌ Ably token endpoint failed:', res.status, data)
  }
}

testAblyTokenEndpoint()
