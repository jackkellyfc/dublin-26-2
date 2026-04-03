import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization' })

  try {
    const { name, type, start_date_local, elapsed_time, distance, description } = req.body || {}

    const response = await fetch('https://www.strava.com/api/v3/activities', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name || 'Training Run',
        type: type || 'Run',
        sport_type: 'Run',
        start_date_local: start_date_local,
        elapsed_time: elapsed_time,
        distance: distance,
        description: description || '',
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      return res.status(response.status).json(data)
    }
    return res.status(201).json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ error: 'Upload failed', detail: message })
  }
}
