import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, grant_type, refresh_token } = req.body || {}

  const clientId = process.env.STRAVA_CLIENT_ID
  const clientSecret = process.env.STRAVA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Strava credentials not configured' })
  }

  try {
    const body: Record<string, string> = {
      client_id: clientId,
      client_secret: clientSecret,
    }

    if (grant_type === 'refresh_token' && refresh_token) {
      body.grant_type = 'refresh_token'
      body.refresh_token = refresh_token
    } else if (code) {
      body.grant_type = 'authorization_code'
      body.code = code
    } else {
      return res.status(400).json({ error: 'Missing code or refresh_token' })
    }

    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: 'Token exchange failed' })
  }
}
