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

export default function RunTracker({ appState, setAppState }: Props) {
  const tracker = useRunTracker()
  const coach = useAudioCoach()
  const [view, setView] = useState<'ready' | 'active' | 'summary'>('ready')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [completedRun, setCompletedRun] = useState<CompletedRun | null>(null)
  const [showCoachSettings, setShowCoachSettings] = useState(false)
  const prevSplitCount = useRef(0)
  const [showHistory, setShowHistory] = useState(false)

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

  // Countdown logic
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

    // Save to run history in appState (strip route to save localStorage space)
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

  const runHistory: CompletedRunRecord[] = appState.runHistory || []

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
          <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24 }}>
            GPS tracking with live audio coaching
          </p>

          {/* Coach settings card */}
          <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => setShowCoachSettings(!showCoachSettings)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>🎙️</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Audio Coach</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                    {coach.enabled ? 'On' : 'Off'} · {coach.config.voice} voice
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
                    <ToggleRow label="KM Split Announcements" checked={coach.config.announceKmSplits} onChange={(v) => coach.setConfig({ ...coach.config, announceKmSplits: v })} />
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
                              padding: '4px 12px',
                              borderRadius: 8,
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 600,
                              background: coach.config.voice === v ? 'var(--accent)' : 'var(--bg3)',
                              color: coach.config.voice === v ? 'white' : 'var(--text2)',
                              minHeight: 32,
                            }}
                          >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Target Pace (per km)</span>
                        <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                          {coach.config.targetPace || 'Not set'}
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 5:40"
                        value={coach.config.targetPace || ''}
                        onChange={(e) => coach.setConfig({ ...coach.config, targetPace: e.target.value || undefined })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--bg4)',
                          background: 'var(--bg3)',
                          color: 'var(--text)',
                          fontSize: 13,
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick tips */}
          <div className="glass-card" style={{ padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Before You Start</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
              <div>• Make sure GPS/Location is enabled</div>
              <div>• Keep your phone in your hand or armband</div>
              <div>• Audio coach works with music playing</div>
              <div>• Screen can be locked — tracking continues</div>
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
            <div style={{ marginTop: 24 }}>
              <button
                onClick={() => setShowHistory(!showHistory)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text)', fontSize: 16, fontWeight: 700, marginBottom: 12, padding: 0 }}
              >
                Recent Runs
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    {[...runHistory].reverse().slice(0, 10).map((run) => (
                      <div key={run.id} className="glass-card" style={{ padding: 14, marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>
                            {new Date(run.date).toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{formatTime(run.duration)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{run.distance.toFixed(2)}</div>
                            <div style={{ fontSize: 10, color: 'var(--text2)' }}>KM</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>{run.avgPace}</div>
                            <div style={{ fontSize: 10, color: 'var(--text2)' }}>AVG PACE</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>{run.calories}</div>
                            <div style={{ fontSize: 10, color: 'var(--text2)' }}>CAL</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE RUN VIEW */}
      {view === 'active' && (
        <div className="run-active-view">
          {/* Status indicator */}
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <motion.div
              animate={{ opacity: tracker.status === 'paused' ? [1, 0.3, 1] : 1 }}
              transition={{ repeat: tracker.status === 'paused' ? Infinity : 0, duration: 1.5 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 14px',
                borderRadius: 20,
                background: tracker.status === 'paused' ? 'rgba(255,179,71,0.15)' : 'rgba(78,205,196,0.15)',
                fontSize: 12,
                fontWeight: 700,
                color: tracker.status === 'paused' ? 'var(--yellow)' : 'var(--green)',
                letterSpacing: 1,
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: tracker.status === 'paused' ? 'var(--yellow)' : 'var(--green)',
              }} />
              {tracker.status === 'paused' ? 'PAUSED' : 'TRACKING'}
            </motion.div>
          </div>

          {/* Main time display */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div className="font-heading" style={{ fontSize: 56, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
              {formatTime(tracker.elapsed)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, letterSpacing: 1 }}>DURATION</div>
          </div>

          {/* Primary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div className="run-stat-card">
              <div className="run-stat-value gradient-text">{formatDistance(tracker.distance)}</div>
              <div className="run-stat-label">KM</div>
            </div>
            <div className="run-stat-card">
              <div className="run-stat-value">{tracker.avgPace}</div>
              <div className="run-stat-label">AVG PACE</div>
            </div>
          </div>

          {/* Secondary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div className="run-stat-card-sm">
              <div style={{ fontSize: 20, fontWeight: 800 }}>{tracker.currentPace}</div>
              <div className="run-stat-label">CURRENT PACE</div>
            </div>
            <div className="run-stat-card-sm">
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>
                {Math.round(tracker.distance * 62)}
              </div>
              <div className="run-stat-label">CALORIES</div>
            </div>
          </div>

          {/* Splits */}
          {tracker.splits.length > 0 && (
            <div className="glass-card" style={{ padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Splits</div>
              {tracker.splits.map((split) => (
                <div key={split.km} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 0', borderBottom: '1px solid var(--bg3)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>KM {split.km}</span>
                  <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{split.pace}/km</span>
                </div>
              ))}
            </div>
          )}

          {/* Audio coach indicator */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20,
            fontSize: 11, color: 'var(--text2)',
          }}>
            <span>{coach.enabled ? '🎙️ Coach On' : '🔇 Coach Off'}</span>
            <span>·</span>
            <button
              onClick={() => coach.setEnabled(!coach.enabled)}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, fontWeight: 600, minHeight: 'auto', padding: 0 }}
            >
              {coach.enabled ? 'Mute' : 'Unmute'}
            </button>
          </div>

          {/* Control buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {tracker.status === 'running' ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePause}
                className="run-control-btn pause"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDiscard}
                  className="run-control-btn discard"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResume}
                  className="run-control-btn resume"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFinish}
                  className="run-control-btn finish"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
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
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <h2 className="font-heading" style={{ fontSize: 24, fontWeight: 800 }}>Run Complete!</h2>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
              {new Date(completedRun.date).toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            <div className="run-stat-card" style={{ padding: 14 }}>
              <div className="run-stat-value gradient-text" style={{ fontSize: 22 }}>{completedRun.distance.toFixed(2)}</div>
              <div className="run-stat-label">KM</div>
            </div>
            <div className="run-stat-card" style={{ padding: 14 }}>
              <div className="run-stat-value" style={{ fontSize: 22 }}>{formatTime(completedRun.duration)}</div>
              <div className="run-stat-label">TIME</div>
            </div>
            <div className="run-stat-card" style={{ padding: 14 }}>
              <div className="run-stat-value" style={{ fontSize: 22 }}>{completedRun.avgPace}</div>
              <div className="run-stat-label">PACE</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <div className="run-stat-card-sm">
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{completedRun.calories}</div>
              <div className="run-stat-label">CALORIES</div>
            </div>
            <div className="run-stat-card-sm">
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--purple)' }}>{completedRun.splits.length}</div>
              <div className="run-stat-label">KM SPLITS</div>
            </div>
          </div>

          {/* Splits detail */}
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
          <div style={{ display: 'flex', gap: 12 }}>
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
              New Run
            </motion.button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* Toggle row component */
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
