import { useState, useRef, useCallback, useEffect } from 'react'

export interface GeoPoint {
  lat: number
  lng: number
  timestamp: number
}

export interface RunSplit {
  km: number
  time: number // seconds for this km
  pace: string // mm:ss
}

export interface CompletedRun {
  id: string
  date: string
  distance: number // km
  duration: number // seconds
  avgPace: string // mm:ss
  route: GeoPoint[]
  splits: RunSplit[]
  calories: number
}

export type RunStatus = 'idle' | 'running' | 'paused' | 'finished'

interface RunState {
  status: RunStatus
  elapsed: number // seconds
  distance: number // km
  currentPace: string
  avgPace: string
  route: GeoPoint[]
  splits: RunSplit[]
  currentKmStart: number // elapsed time when current km started
}

const INITIAL_STATE: RunState = {
  status: 'idle',
  elapsed: 0,
  distance: 0,
  currentPace: '--:--',
  avgPace: '--:--',
  route: [],
  splits: [],
  currentKmStart: 0,
}

function formatPace(secondsPerKm: number): string {
  if (!isFinite(secondsPerKm) || secondsPerKm <= 0) return '--:--'
  const mins = Math.floor(secondsPerKm / 60)
  const secs = Math.floor(secondsPerKm % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function haversineDistance(p1: GeoPoint, p2: GeoPoint): number {
  const R = 6371 // km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function useRunTracker() {
  const [state, setState] = useState<RunState>(INITIAL_STATE)
  const watchIdRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef(state)
  const lastSplitKm = useRef(0)

  // Keep ref in sync
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const startTimer = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      setState(prev => {
        const elapsed = prev.elapsed + 1
        // Recalculate avg pace
        const avgPace = prev.distance > 0.01
          ? formatPace(elapsed / prev.distance)
          : '--:--'
        return { ...prev, elapsed, avgPace }
      })
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startGPS = useCallback(() => {
    if (!navigator.geolocation) return

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const point: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
        }

        setState(prev => {
          if (prev.status !== 'running') return prev

          const route = [...prev.route, point]
          let distance = prev.distance

          if (prev.route.length > 0) {
            const lastPoint = prev.route[prev.route.length - 1]
            const delta = haversineDistance(lastPoint, point)
            // Filter out GPS jitter (ignore jumps > 200m or < 1m)
            if (delta > 0.001 && delta < 0.2) {
              distance += delta
            }
          }

          // Current pace from last 30 seconds of movement
          let currentPace = prev.currentPace
          if (route.length >= 3) {
            const now = Date.now()
            const recent = route.filter(p => now - p.timestamp < 30000)
            if (recent.length >= 2) {
              let recentDist = 0
              for (let i = 1; i < recent.length; i++) {
                recentDist += haversineDistance(recent[i - 1], recent[i])
              }
              const recentTime = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000
              if (recentDist > 0.005) {
                currentPace = formatPace(recentTime / recentDist)
              }
            }
          }

          // Check for km splits
          const splits = [...prev.splits]
          const currentKm = Math.floor(distance)
          if (currentKm > lastSplitKm.current && distance > 0) {
            const splitTime = prev.elapsed - prev.currentKmStart
            splits.push({
              km: currentKm,
              time: splitTime,
              pace: formatPace(splitTime),
            })
            lastSplitKm.current = currentKm
            return { ...prev, route, distance, currentPace, splits, currentKmStart: prev.elapsed }
          }

          return { ...prev, route, distance, currentPace }
        })
      },
      (err) => {
        console.warn('GPS error:', err.message)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    )
    watchIdRef.current = id
  }, [])

  const stopGPS = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    setState(prev => ({ ...prev, status: 'running' }))
    startTimer()
    startGPS()
  }, [startTimer, startGPS])

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, status: 'paused' }))
    stopTimer()
  }, [stopTimer])

  const resume = useCallback(() => {
    setState(prev => ({ ...prev, status: 'running' }))
    startTimer()
  }, [startTimer])

  const finish = useCallback((): CompletedRun => {
    stopTimer()
    stopGPS()
    const s = stateRef.current
    const run: CompletedRun = {
      id: `run-${Date.now()}`,
      date: new Date().toISOString(),
      distance: Math.round(s.distance * 100) / 100,
      duration: s.elapsed,
      avgPace: s.distance > 0 ? formatPace(s.elapsed / s.distance) : '--:--',
      route: s.route,
      splits: s.splits,
      calories: Math.round(s.distance * 62), // rough estimate ~62 cal/km
    }
    setState(prev => ({ ...prev, status: 'finished' }))
    return run
  }, [stopTimer, stopGPS])

  const reset = useCallback(() => {
    stopTimer()
    stopGPS()
    lastSplitKm.current = 0
    setState(INITIAL_STATE)
  }, [stopTimer, stopGPS])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer()
      stopGPS()
    }
  }, [stopTimer, stopGPS])

  return {
    ...state,
    start,
    pause,
    resume,
    finish,
    reset,
  }
}
