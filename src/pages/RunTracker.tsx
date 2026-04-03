import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRunTracker } from '../hooks/useRunTracker'
import type { CompletedRun } from '../hooks/useRunTracker'
import { useAudioCoach } from '../hooks/useAudioCoach'
import type { AppState, CompletedRunRecord } from '../hooks/useAdaptivePlan'

interface Props {
  appState: AppState
  setAppState: React.Dispatch<React.SetStateAction<AppState>>
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatDistance(km: number): string {
  return km.toFixed(2)
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function RunTracker({ appState, setAppState }: Props) {
  const tracker = useRunTracker()
  const coach = useAudioCoach()
  const [view, setView] = useState<'ready' | 'active' | 'summary'>('ready')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [completedRun, setCompletedRun] = useState<CompletedRun | null>(null)
  const [showCoachSettings, setShowCoachSettings] = useState(false)
  const prevSplitCount = useRef(0)
  const [uploadingToStrava, setUploadingToStrava] = useState(false)

  const runHistory: CompletedRunRecord[] = appState.runHistory || []

  // Stats from run history
  const totalRuns = runHistory.length
  const totalKm = runHistory.reduce((s, r) => s + r.distance, 0)
  const thisWeekRuns = runHistory.filter(r => {
    const d = new Date(r.date)
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1)
    weekStart.setHours(0, 0, 0, 0)
    return d >= weekStart
  })

  // Announce km splits
  useEffect(() => {
    if (tracker.splits.length > prevSplitCount.current) {
      const latest = tracker.splits[tracker.splits.length - 1]
      coach.announceKmSplit(latest.km, latest.time, tracker.distance, tracker.elapsed, tracker.avgPace)
      prevSplitCount.current = tracker.splits.length
    }
  }, [tracker.splits, tracker.distance, tracker.elapsed, tracker.avgPace, coach])

  // Periodic encouragement
  useEffect(() => {
    if (tracker.status === 'running') {
      coach.maybeEncourage(tracker.elapsed)
    }
  }, [tracker.elapsed, tracker.status, coach])

  const handleStart = useCallback(() => {
    setCountdown(3)
  }, [])

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      setCountdown(null)
      setView('active')
      tracker.start()
      coach.announceStart()
      prevSplitCount.current = 0
      return
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, tracker, coach])

  const handlePause = useCallback(() => {
    tracker.pause()
    coach.announcePause()
  }, [tracker, coach])

  const handleResume = useCallback(() => {
    tracker.resume()
    coach.announceResume()
  }, [tracker, coach])

  const handleFinish = useCallback(() => {
    const run = tracker.finish()
    coach.announceFinish(run.distance, run.duration, run.avgPace)
    setCompletedRun(run)

    const record: CompletedRunRecord = {
      id: run.id,
      date: run.date,
      distance: run.distance,
      duration: run.duration,
      avgPace: run.avgPace,
      splits: run.splits,
      calories: run.calories,
    }
    setAppState(prev => ({
      ...prev,
      runHistory: [...(prev.runHistory || []), record],
    }))

    setView('summary')
  }, [tracker, coach, setAppState])

  const handleDiscard = useCallback(() => {
    tracker.reset()
    setCompletedRun(null)
    setView('ready')
    coach.stopSpeaking()
  }, [tracker, coach])

  const handleNewRun = useCallback(() => {
    tracker.reset()
    setCompletedRun(null)
    setView('ready')
  }, [tracker])

  // Upload to Strava
  const uploadToStrava = useCallback(async () => {
    if (!completedRun) return
    setUploadingToStrava(true)
    try {
      const stravaData = localStorage.getItem('dublin262-strava')
      if (!stravaData) {
        alert('Connect Strava in Settings first to upload runs.')
        return
      }
      const tokens = JSON.parse(stravaData)

      const res = await fetch('/api/strava-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access_token}`,
        },
        body: JSON.stringify({
          name: `DUBLIN 26.2 Training Run`,
          type: 'Run',
          start_date_local: completedRun.date,
          elapsed_time: completedRun.duration,
          distance: completedRun.distance * 1000,
          description: `${completedRun.distance.toFixed(2)}km @ ${completedRun.avgPace}/km — tracked with DUBLIN 26.2`,
        }),
      })

      if (res.ok) {
        alert('Run uploaded to Strava!')
      } else {
        alert('Upload failed — try syncing from Strava instead.')
      }
    } catch {
      alert('Upload failed — check your connection.')
    } finally {
      setUploadingToStrava(false)
    }
  }, [completedRun])

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ padding: '20px 16px', minHeight: '100dvh' }}
    >
      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="countdown-overlay"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="countdown-number"
            >
              {countdown === 0 ? 'GO!' : countdown}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* READY VIEW */}
      {view === 'ready' && (
        <div>
          <h1 className="font-heading" style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
            <span className="gradient-text">Run</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
            Track your runs with GPS & audio coaching
          </p>

          {/* Weekly summary strip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
            <div className="run-stat-card-sm">
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{thisWeekRuns.length}</div>
              <div className="run-stat-label">THIS WEEK</div>
            </div>
            <div className="run-stat-card-sm">
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{totalKm.toFixed(1)}</div>
              <div className="run-stat-label">TOTAL KM</div>
            </div>
            <div className="run-stat-card-sm">
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--purple)' }}>{totalRuns}</div>
              <div className="run-stat-label">ALL RUNS</div>
            </div>
          </div>

          {/* Coach settings card */}
          <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowCoachSettings(!showCoachSettings)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,107,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  🎙️
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Audio Coach</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                    {coach.enabled ? 'On' : 'Off'} · {coach.config.voice} voice
                    {coach.config.targetPace ? ` · Target ${coach.config.targetPace}/km` : ''}
                  </div>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showCoachSettings ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <AnimatePresence>
              {showCoachSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden', marginTop: 14 }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <ToggleRow label="Audio Coach" checked={coach.enabled} onChange={coach.setEnabled} />
                    <ToggleRow label="KM Splits" checked={coach.config.announceKmSplits} onChange={(v) => coach.setConfig({ ...coach.config, announceKmSplits: v })} />
                    <ToggleRow label="Pace Alerts" checked={coach.config.announcePaceAlerts} onChange={(v) => coach.setConfig({ ...coach.config, announcePaceAlerts: v })} />
                    <ToggleRow label="Encouragement" checked={coach.config.announceEncouragement} onChange={(v) => coach.setConfig({ ...coach.config, announceEncouragement: v })} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text2)' }}>Voice</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(['female', 'male'] as const).map(v => (
                          <button
                            key={v}
                            onClick={() => coach.setConfig({ ...coach.config, voice: v })}
                            style={{
                              padding: '4px 12px', borderRadius: 8, border: 'none',
                              fontSize: 12, fontWeight: 600, minHeight: 32,
                              background: coach.config.voice === v ? 'var(--accent)' : 'var(--bg3)',
                              color: coach.config.voice === v ? 'white' : 'var(--text2)',
                            }}
                          >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Target Pace</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 5:40 per km"
                        value={coach.config.targetPace || ''}
                        onChange={(e) => coach.setConfig({ ...coach.config, targetPace: e.target.value || undefined })}
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8,
                          border: '1px solid var(--bg4)', background: 'var(--bg3)',
                          color: 'var(--text)', fontSize: 13, outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* How it works */}
          <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>How It Works</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, minWidth: 18 }}>1.</span>
                <span>Hit <strong style={{ color: 'var(--text)' }}>Start Run</strong> — GPS locks your location</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, minWidth: 18 }}>2.</span>
                <span>Run with <strong style={{ color: 'var(--text)' }}>Spotify playing</strong> — coach speaks over your music</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, minWidth: 18 }}>3.</span>
                <span>Get <strong style={{ color: 'var(--text)' }}>km splits & pace alerts</strong> in your ear</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, minWidth: 18 }}>4.</span>
                <span>Finish and <strong style={{ color: 'var(--text)' }}>upload to Strava</strong></span>
              </div>
            </div>
          </div>

          {/* Start button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="start-run-btn"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Start Run</span>
          </motion.button>

          {/* Run history */}
          {runHistory.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>
                Recent Runs
              </div>
              {[...runHistory].reverse().slice(0, 15).map((run) => (
                <motion.div
                  key={run.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card"
                  style={{ padding: 14, marginBottom: 8 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {run.id.startsWith('strava-') && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FC4C02">
                          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z"/>
                          <path d="M10.233 13.828L7.169 7.656 4.105 13.828h3.064l3.064-6.172 3.064 6.172h-3.064z" opacity="0.6"/>
                        </svg>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 700 }}>
                        {formatDateShort(run.date)}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'monospace' }}>
                      {formatTime(run.duration)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>{run.distance.toFixed(2)}</div>
                      <div style={{ fontSize: 9, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5 }}>KM</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>{run.avgPace}</div>
                      <div style={{ fontSize: 9, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5 }}>PACE /KM</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{run.calories}</div>
                      <div style={{ fontSize: 9, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5 }}>CAL</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {runHistory.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', marginTop: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏃</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>No runs yet</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                Start your first run or sync from Strava in Settings
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE RUN VIEW */}
      {view === 'active' && (
        <div className="run-active-view">
          {/* GPS + Status indicator */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <motion.div
              animate={{
                opacity: tracker.status === 'paused' ? [1, 0.3, 1] : 1,
              }}
              transition={{ repeat: tracker.status === 'paused' ? Infinity : 0, duration: 1.5 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 14px', borderRadius: 20,
                background: tracker.gpsStatus === 'error'
                  ? 'rgba(255,107,107,0.15)'
                  : tracker.gpsStatus === 'searching'
                    ? 'rgba(255,179,71,0.15)'
                    : tracker.status === 'paused'
                      ? 'rgba(255,179,71,0.15)'
                      : 'rgba(78,205,196,0.15)',
                fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
                color: tracker.gpsStatus === 'error'
                  ? 'var(--red)'
                  : tracker.gpsStatus === 'searching'
                    ? 'var(--yellow)'
                    : tracker.status === 'paused'
                      ? 'var(--yellow)'
                      : 'var(--green)',
              }}
            >
              <motion.div
                animate={{ scale: tracker.gpsStatus === 'searching' ? [1, 1.3, 1] : 1 }}
                transition={{ repeat: tracker.gpsStatus === 'searching' ? Infinity : 0, duration: 1 }}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: tracker.gpsStatus === 'error' ? 'var(--red)'
                    : tracker.gpsStatus === 'searching' ? 'var(--yellow)'
                      : tracker.status === 'paused' ? 'var(--yellow)' : 'var(--green)',
                }}
              />
              {tracker.gpsStatus === 'error' ? 'GPS ERROR'
                : tracker.gpsStatus === 'searching' ? 'FINDING GPS...'
                  : tracker.status === 'paused' ? 'PAUSED' : 'TRACKING'}
            </motion.div>
          </div>

          {/* GPS error message */}
          {tracker.gpsError && (
            <div style={{
              background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 12,
              fontSize: 12, color: 'var(--red)', textAlign: 'center', lineHeight: 1.5,
            }}>
              {tracker.gpsError}
            </div>
          )}

          {/* Main time display */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div className="font-heading" style={{ fontSize: 60, fontWeight: 900, letterSpacing: -3, lineHeight: 1 }}>
              {formatTime(tracker.elapsed)}
            </div>
          </div>

          {/* Primary stats - big and readable like Runna */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div className="run-stat-card" style={{ padding: '18px 14px' }}>
              <div className="run-stat-value gradient-text" style={{ fontSize: 36 }}>{formatDistance(tracker.distance)}</div>
              <div className="run-stat-label">DISTANCE (KM)</div>
            </div>
            <div className="run-stat-card" style={{ padding: '18px 14px' }}>
              <div className="run-stat-value" style={{ fontSize: 36 }}>{tracker.avgPace}</div>
              <div className="run-stat-label">AVG PACE /KM</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div className="run-stat-card-sm">
              <div style={{ fontSize: 18, fontWeight: 800 }}>{tracker.currentPace}</div>
              <div className="run-stat-label">NOW</div>
            </div>
            <div className="run-stat-card-sm">
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>
                {Math.round(tracker.distance * 62)}
              </div>
              <div className="run-stat-label">CAL</div>
            </div>
            <div className="run-stat-card-sm">
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--purple)' }}>
                {tracker.splits.length}
              </div>
              <div className="run-stat-label">SPLITS</div>
            </div>
          </div>

          {/* Latest split */}
          {tracker.splits.length > 0 && (
            <div style={{
              background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.15)',
              borderRadius: 12, padding: '10px 14px', marginBottom: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>
                KM {tracker.splits[tracker.splits.length - 1].km}
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', fontFamily: 'monospace' }}>
                {tracker.splits[tracker.splits.length - 1].pace}/km
              </span>
            </div>
          )}

          {/* Audio coach strip */}
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 24,
            padding: '8px 0',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>
              {coach.enabled ? '🎙️ Coach' : '🔇 Muted'}
            </span>
            <button
              onClick={() => coach.setEnabled(!coach.enabled)}
              style={{
                background: coach.enabled ? 'var(--accent)' : 'var(--bg4)',
                border: 'none', borderRadius: 12, padding: '4px 12px',
                color: 'white', fontSize: 10, fontWeight: 700, minHeight: 24,
              }}
            >
              {coach.enabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Control buttons */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
            {tracker.status === 'running' ? (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handlePause}
                className="run-control-btn pause"
                style={{ width: 80, height: 80, minHeight: 80 }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDiscard}
                  className="run-control-btn discard"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleResume}
                  className="run-control-btn resume"
                  style={{ width: 80, height: 80, minHeight: 80 }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleFinish}
                  className="run-control-btn finish"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.button>
              </>
            )}
          </div>
        </div>
      )}

      {/* SUMMARY VIEW */}
      {view === 'summary' && completedRun && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--green), #2BA89D)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(78,205,196,0.3)',
              }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-heading"
              style={{ fontSize: 26, fontWeight: 900 }}
            >
              Great Run!
            </motion.h2>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
              {new Date(completedRun.date).toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Big distance highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            style={{ textAlign: 'center', marginBottom: 20 }}
          >
            <div className="font-heading gradient-text" style={{ fontSize: 56, fontWeight: 900, lineHeight: 1 }}>
              {completedRun.distance.toFixed(2)}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 600, letterSpacing: 1 }}>KILOMETRES</div>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            <div className="run-stat-card" style={{ padding: 14 }}>
              <div className="run-stat-value" style={{ fontSize: 20 }}>{formatTime(completedRun.duration)}</div>
              <div className="run-stat-label">TIME</div>
            </div>
            <div className="run-stat-card" style={{ padding: 14 }}>
              <div className="run-stat-value" style={{ fontSize: 20 }}>{completedRun.avgPace}</div>
              <div className="run-stat-label">PACE</div>
            </div>
            <div className="run-stat-card" style={{ padding: 14 }}>
              <div className="run-stat-value" style={{ fontSize: 20, color: 'var(--green)' }}>{completedRun.calories}</div>
              <div className="run-stat-label">CAL</div>
            </div>
          </div>

          {/* Splits */}
          {completedRun.splits.length > 0 && (
            <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Split Times</div>
              {completedRun.splits.map((split) => {
                const fastest = Math.min(...completedRun!.splits.map(s => s.time))
                const slowest = Math.max(...completedRun!.splits.map(s => s.time))
                const isFastest = split.time === fastest && completedRun!.splits.length > 1
                const isSlowest = split.time === slowest && completedRun!.splits.length > 1
                return (
                  <div key={split.km} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px solid var(--bg3)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>KM {split.km}</span>
                      {isFastest && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(78,205,196,0.15)', color: 'var(--green)', fontWeight: 700 }}>FASTEST</span>}
                      {isSlowest && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,107,107,0.15)', color: 'var(--red)', fontWeight: 700 }}>SLOWEST</span>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>{split.pace}/km</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Strava upload button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={uploadToStrava}
              disabled={uploadingToStrava}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #FC4C02, #FF6B35)',
                color: 'white', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: uploadingToStrava ? 0.7 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066l-2.084 4.116z"/>
                <path d="M10.233 13.828L7.169 7.656 4.105 13.828h3.064l3.064-6.172 3.064 6.172h-3.064z" opacity="0.6"/>
              </svg>
              {uploadingToStrava ? 'Uploading...' : 'Upload to Strava'}
            </motion.button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleDiscard}
                style={{
                  flex: 1, padding: '14px', borderRadius: 12, border: '1px solid var(--bg4)',
                  background: 'transparent', color: 'var(--text2)', fontSize: 14, fontWeight: 700,
                }}
              >
                Discard
              </button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleNewRun}
                style={{
                  flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  color: 'white', fontSize: 14, fontWeight: 700,
                }}
              >
                Done
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none',
          background: checked ? 'var(--accent)' : 'var(--bg4)',
          position: 'relative', padding: 0, minHeight: 24, transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          position: 'absolute', top: 3,
          left: checked ? 23 : 3, transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
}
