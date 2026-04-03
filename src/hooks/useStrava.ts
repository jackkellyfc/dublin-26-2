import { useState, useCallback, useEffect } from 'react'

// Strava OAuth config - client ID is public, secret stays server-side
const STRAVA_CLIENT_ID = '219954'
const STRAVA_REDIRECT_URI = typeof window !== 'undefined'
  ? `${window.location.origin}/settings`
  : ''
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize'
const STRAVA_SCOPE = 'read,activity:read_all,activity:write'

export interface StravaAthlete {
  id: number
  firstname: string
  lastname: string
  profile: string // avatar URL
  city: string
  country: string
}

export interface StravaTokens {
  access_token: string
  refresh_token: string
  expires_at: number // unix timestamp
  athlete: StravaAthlete
}

export interface StravaActivity {
  id: number
  name: string
  type: string // 'Run', 'Walk', etc.
  sport_type: string
  distance: number // meters
  moving_time: number // seconds
  elapsed_time: number
  start_date: string // ISO
  start_date_local: string
  average_speed: number // m/s
  max_speed: number
  average_heartrate?: number
  max_heartrate?: number
  total_elevation_gain: number
  kudos_count: number
  achievement_count: number
}

const STORAGE_KEY = 'dublin262-strava'

function loadTokens(): StravaTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveTokens(tokens: StravaTokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

function clearTokens() {
  localStorage.removeItem(STORAGE_KEY)
}

export function useStrava() {
  const [tokens, setTokens] = useState<StravaTokens | null>(loadTokens)
  const [activities, setActivities] = useState<StravaActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const isConnected = !!tokens?.access_token
  const athlete = tokens?.athlete || null

  // Check if token is expired and refresh if needed
  const getValidToken = useCallback(async (): Promise<string | null> => {
    if (!tokens) return null

    const now = Math.floor(Date.now() / 1000)
    if (tokens.expires_at > now + 60) {
      return tokens.access_token
    }

    // Token expired, refresh it
    try {
      const res = await fetch('/api/strava-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: tokens.refresh_token,
        }),
      })

      if (!res.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await res.json()
      const updated: StravaTokens = {
        ...tokens,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
      }
      saveTokens(updated)
      setTokens(updated)
      return updated.access_token
    } catch (err) {
      setError('Session expired. Please reconnect Strava.')
      disconnect()
      return null
    }
  }, [tokens])

  // Start OAuth flow
  const connect = useCallback(() => {
    const params = new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      redirect_uri: STRAVA_REDIRECT_URI,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: STRAVA_SCOPE,
    })
    window.location.href = `${STRAVA_AUTH_URL}?${params.toString()}`
  }, [])

  // Handle OAuth callback (exchange code for tokens)
  const handleCallback = useCallback(async (code: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/strava-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Authentication failed')
      }

      const data = await res.json()
      const newTokens: StravaTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        athlete: data.athlete,
      }
      saveTokens(newTokens)
      setTokens(newTokens)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setLoading(false)
    }
  }, [])

  // Disconnect
  const disconnect = useCallback(() => {
    clearTokens()
    setTokens(null)
    setActivities([])
    setError(null)
  }, [])

  // Fetch recent activities
  const fetchActivities = useCallback(async (_afterDate?: string) => {
    setSyncing(true)
    setError(null)
    try {
      const token = await getValidToken()
      if (!token) {
        setError('Not authenticated. Try disconnecting and reconnecting.')
        return []
      }

      // Fetch last 90 days of activities (don't filter by plan start date)
      const ninetyDaysAgo = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000)
      const params = new URLSearchParams({
        per_page: '50',
        after: String(ninetyDaysAgo),
      })

      const res = await fetch(`/api/strava-activities?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const errBody = await res.text()
        console.error('Strava API error:', res.status, errBody)
        throw new Error(`Strava returned ${res.status}. Try disconnecting and reconnecting.`)
      }

      const data: StravaActivity[] = await res.json()
      // Filter to runs only
      const runs = data.filter(a => a.type === 'Run' || a.sport_type === 'Run')
      setActivities(runs)
      return runs
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
      return []
    } finally {
      setSyncing(false)
    }
  }, [getValidToken])

  // Auto-handle OAuth callback on page load
  useEffect(() => {
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const scope = url.searchParams.get('scope')
    if (code && scope) {
      // Clean the URL
      url.searchParams.delete('code')
      url.searchParams.delete('scope')
      url.searchParams.delete('state')
      window.history.replaceState({}, '', url.pathname)
      handleCallback(code)
    }
  }, [handleCallback])

  return {
    isConnected,
    athlete,
    tokens,
    activities,
    loading,
    syncing,
    error,
    connect,
    disconnect,
    fetchActivities,
    handleCallback,
  }
}

// Helper: convert Strava activity to a format useful for matching
export function stravaToRun(activity: StravaActivity) {
  const distKm = activity.distance / 1000
  const paceSecsPerKm = activity.moving_time / distKm
  const paceMins = Math.floor(paceSecsPerKm / 60)
  const paceSecs = Math.floor(paceSecsPerKm % 60)
  return {
    stravaId: activity.id,
    date: activity.start_date_local.split('T')[0], // YYYY-MM-DD
    distance: Math.round(distKm * 100) / 100,
    duration: activity.moving_time,
    avgPace: `${paceMins}:${paceSecs.toString().padStart(2, '0')}`,
    name: activity.name,
    elevation: activity.total_elevation_gain,
    heartrate: activity.average_heartrate,
    kudos: activity.kudos_count,
  }
}
