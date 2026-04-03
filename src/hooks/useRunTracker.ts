import { useState, useRef, useCallback, useEffect } from 'react'

export interface GeoPoint {
  lat: number
  lng: number
  timestamp: number
  accuracy: number
  speed: number | null // m/s from device GPS
}

export interface RunSplit {
  km: number
  time: number
  pace: string
}

export interface CompletedRun {
  id: string
  date: string
  distance: number
  duration: number
  avgPace: string
  route: GeoPoint[]
  splits: RunSplit[]
  calories: number
}

export type RunStatus = 'idle' | 'running' | 'paused' | 'finished'
export type GPSStatus = 'off' | 'searching' | 'locked' | 'weak' | 'error'

interface RunState {
  status: RunStatus
  gpsStatus: GPSStatus
  gpsError: string | null
  gpsAccuracy: number | null
  elapsed: number
  distance: number
  currentPace: string
  avgPace: string
  route: GeoPoint[]
  splits: RunSplit[]
  currentKmStart: number
}

const INITIAL_STATE: RunState = {
  status: 'idle',
  gpsStatus: 'off',
  gpsError: null,
  gpsAccuracy: null,
  elapsed: 0,
  distance: 0,
  currentPace: '--:--',
  avgPace: '--:--',
  route: [],
  splits: [],
  currentKmStart: 0,
}

function formatPace(secondsPerKm: number): string {
  if (!isFinite(secondsPerKm) || secondsPerKm <= 0 || secondsPerKm > 3600) return '--:--'
  const mins = Math.floor(secondsPerKm / 60)
  const secs = Math.floor(secondsPerKm % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function haversineDistance(p1: GeoPoint, p2: GeoPoint): number {
  const R = 6371000 // meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) // returns meters
}

// Accuracy threshold: reject GPS points worse than this (meters)
const MAX_ACCURACY = 25
// Minimum distance between points to count as movement (meters)
const MIN_MOVEMENT = 3
// Maximum distance between consecutive points (meters) — reject GPS jumps
const MAX_JUMP = 100
// Minimum speed to count as moving (m/s) — ~1.5 km/h, filters standing still
const MIN_SPEED = 0.4

export function useRunTracker() {
  const [state, setState] = useState<RunState>(INITIAL_STATE)
  const watchIdRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stateRef = useRef(state)
  const lastSplitKm = useRef(0)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  // Smoothed pace using exponential moving average
  const smoothedPaceRef = useRef<number | null>(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch { /* not critical */ }
  }, [])

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release()
      wakeLockRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      setState(prev => {
        const elapsed = prev.elapsed + 1
        // distance is in km, elapsed in seconds → sec/km = elapsed / distance
        const avgPace = prev.distance > 0.02
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

  const checkGPSPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, gpsStatus: 'error', gpsError: 'GPS not available on this device' }))
      return false
    }
    try {
      if ('permissions' in navigator) {
        const perm = await navigator.permissions.query({ name: 'geolocation' })
        if (perm.state === 'denied') {
          setState(prev => ({
            ...prev, gpsStatus: 'error',
            gpsError: 'Location permission denied. Enable it in Settings > Privacy > Location Services > Safari.',
          }))
          return false
        }
      }
    } catch { /* continue */ }
    return true
  }, [])

  const startGPS = useCallback(async () => {
    const ok = await checkGPSPermission()
    if (!ok) return

    setState(prev => ({ ...prev, gpsStatus: 'searching', gpsError: null }))
    smoothedPaceRef.current = null

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = pos.coords.accuracy
        const deviceSpeed = pos.coords.speed // m/s, null if unavailable

        const point: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
          accuracy,
          speed: deviceSpeed,
        }

        setState(prev => {
          // Determine GPS quality
          let gpsStatus: GPSStatus = 'locked'
          if (accuracy > MAX_ACCURACY) {
            gpsStatus = 'weak'
          }

          if (prev.status !== 'running') {
            return { ...prev, gpsStatus, gpsAccuracy: accuracy }
          }

          // Reject inaccurate points
          if (accuracy > MAX_ACCURACY * 2) {
            return { ...prev, gpsStatus: 'weak', gpsAccuracy: accuracy }
          }

          const route = [...prev.route, point]
          let distance = prev.distance // in km

          // Calculate distance from previous point
          if (prev.route.length > 0) {
            const lastPoint = prev.route[prev.route.length - 1]
            const deltaMeters = haversineDistance(lastPoint, point)
            const timeDelta = (point.timestamp - lastPoint.timestamp) / 1000

            // Only count movement if:
            // 1. Point is accurate enough
            // 2. Distance is realistic (not a GPS jump)
            // 3. There's actual movement (not standing still)
            // 4. Time has passed (not duplicate)
            if (
              accuracy <= MAX_ACCURACY &&
              deltaMeters >= MIN_MOVEMENT &&
              deltaMeters <= MAX_JUMP &&
              timeDelta > 0.5
            ) {
              // Additional check: if device reports speed, use it to validate
              if (deviceSpeed !== null && deviceSpeed >= 0) {
                const expectedDist = deviceSpeed * timeDelta
                // Only accept if calculated distance is within 3x of expected
                if (deltaMeters < expectedDist * 3 || expectedDist < 1) {
                  distance += deltaMeters / 1000
                }
              } else {
                // No device speed — use distance directly but check implied speed
                const impliedSpeed = deltaMeters / timeDelta
                if (impliedSpeed < 12) { // < 12 m/s = ~43 km/h, max reasonable running
                  distance += deltaMeters / 1000
                }
              }
            }
          }

          // Current pace calculation — prefer device GPS speed
          let currentPace = prev.currentPace
          if (deviceSpeed !== null && deviceSpeed >= MIN_SPEED) {
            // Device speed in m/s → convert to sec/km
            const paceSecPerKm = 1000 / deviceSpeed
            // Smooth with exponential moving average (alpha = 0.3)
            if (smoothedPaceRef.current === null) {
              smoothedPaceRef.current = paceSecPerKm
            } else {
              smoothedPaceRef.current = 0.3 * paceSecPerKm + 0.7 * smoothedPaceRef.current
            }
            currentPace = formatPace(smoothedPaceRef.current)
          } else if (deviceSpeed !== null && deviceSpeed < MIN_SPEED) {
            // Standing still or very slow
            currentPace = '--:--'
          }
          // If device speed unavailable, fall back to distance-based calculation
          else if (route.length >= 4) {
            // Use last 5 points that are accurate
            const recentGood = route
              .filter(p => p.accuracy <= MAX_ACCURACY)
              .slice(-6)
            if (recentGood.length >= 2) {
              let dist = 0
              for (let i = 1; i < recentGood.length; i++) {
                dist += haversineDistance(recentGood[i - 1], recentGood[i])
              }
              const time = (recentGood[recentGood.length - 1].timestamp - recentGood[0].timestamp) / 1000
              if (dist > 5 && time > 2) { // at least 5m over 2 seconds
                const paceSecPerKm = (time / dist) * 1000
                if (smoothedPaceRef.current === null) {
                  smoothedPaceRef.current = paceSecPerKm
                } else {
                  smoothedPaceRef.current = 0.3 * paceSecPerKm + 0.7 * smoothedPaceRef.current
                }
                currentPace = formatPace(smoothedPaceRef.current)
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
            return { ...prev, route, distance, currentPace, splits, currentKmStart: prev.elapsed, gpsStatus, gpsAccuracy: accuracy }
          }

          return { ...prev, route, distance, currentPace, gpsStatus, gpsAccuracy: accuracy }
        })
      },
      (err) => {
        let msg = 'GPS error'
        if (err.code === 1) msg = 'Location permission denied. Go to Settings > Privacy > Location Services > Safari and allow access.'
        else if (err.code === 2) msg = 'GPS unavailable. Make sure you are outdoors with a clear sky view.'
        else if (err.code === 3) msg = 'GPS timed out. Ensure Location Services are enabled.'
        setState(prev => ({ ...prev, gpsStatus: 'error', gpsError: msg }))
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000, // only accept positions from last 1 second
        timeout: 10000,
      }
    )
    watchIdRef.current = id
  }, [checkGPSPermission])

  const stopGPS = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  const start = useCallback(async () => {
    smoothedPaceRef.current = null
    setState(prev => ({ ...prev, status: 'running' }))
    startTimer()
    await startGPS()
    await requestWakeLock()
  }, [startTimer, startGPS, requestWakeLock])

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
    releaseWakeLock()
    const s = stateRef.current
    const distKm = Math.round(s.distance * 100) / 100
    const run: CompletedRun = {
      id: `run-${Date.now()}`,
      date: new Date().toISOString(),
      distance: distKm,
      duration: s.elapsed,
      avgPace: distKm > 0 ? formatPace(s.elapsed / distKm) : '--:--',
      route: s.route,
      splits: s.splits,
      calories: Math.round(distKm * 62),
    }
    setState(prev => ({ ...prev, status: 'finished' }))
    return run
  }, [stopTimer, stopGPS, releaseWakeLock])

  const reset = useCallback(() => {
    stopTimer()
    stopGPS()
    releaseWakeLock()
    lastSplitKm.current = 0
    smoothedPaceRef.current = null
    setState(INITIAL_STATE)
  }, [stopTimer, stopGPS, releaseWakeLock])

  useEffect(() => {
    return () => {
      stopTimer()
      stopGPS()
      releaseWakeLock()
    }
  }, [stopTimer, stopGPS, releaseWakeLock])

  return {
    ...state,
    start,
    pause,
    resume,
    finish,
    reset,
  }
}
