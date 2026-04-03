import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' })
  }

  try {
    const { after, before, per_page } = req.query
    const params = new URLSearchParams()
    if (after) params.set('after', String(after))
    if (before) params.set('before', String(before))
    params.set('per_page', String(per_page || 30))

    const url = `https://www.strava.com/api/v3/athlete/activities?${params.toString()}`

    const response = await fetch(url, {
      headers: { Authorization: authHeader },
    })

    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      return res.status(502).json({
        error: 'Invalid response from Strava',
        status: response.status,
        body: text.slice(0, 200),
      })
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || 'Strava API error',
        strava_errors: data.errors,
        status: response.status,
      })
    }

    return res.status(200).json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: 'Failed to fetch activities', detail: message })
  }
}
