import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AppState, RaceResult } from '../hooks/useAdaptivePlan'
import { computePaces } from '../data/paces'
import { VOLUME_RULES, RECOVERY_PRACTICES } from '../data/injuryWarnings'

interface SettingsProps {
  appState: AppState
  setAppState: (fn: (prev: AppState) => AppState) => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1px solid var(--bg4)', background: 'var(--bg3)',
  color: 'var(--text)', fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block', fontWeight: 600,
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%238B95A8\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M8 11L3 6h10z\'/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
}

export default function Settings({ appState, setAppState }: SettingsProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [showRaceForm, setShowRaceForm] = useState(false)
  const [newRace, setNewRace] = useState({ distance: '5K', time: '', date: '', customDistance: '' })

  const profile = appState.userProfile
  const totalCompleted = Object.keys(appState.completedSessions).length
  const paceImprovement = Math.floor(totalCompleted / 15)
  const paces = computePaces(paceImprovement, profile.fiveKTime)

  const updateProfile = (field: string, value: string | number) => {
    setAppState(prev => ({
      ...prev,
      userProfile: { ...prev.userProfile, [field]: value },
    }))
  }

  const addRaceResult = () => {
    if (!newRace.time) return
    const result: RaceResult = {
      id: Date.now().toString(),
      distance: newRace.distance,
      customDistance: newRace.distance === 'Custom' ? newRace.customDistance : undefined,
      time: newRace.time,
      date: newRace.date || new Date().toISOString().split('T')[0],
      isPB: false,
    }

    // Check if PB for 5K or 10K and auto-update paces
    if (newRace.distance === '5K' && newRace.time) {
      const parts = newRace.time.split(':').map(Number)
      const newSec = (parts.length === 3 ? parts[0] * 3600 : 0) + (parts.length >= 2 ? parts[parts.length - 2] * 60 : 0) + (parts[parts.length - 1] || 0)
      const oldParts = profile.fiveKTime.split(':').map(Number)
      const oldSec = (oldParts.length === 3 ? oldParts[0] * 3600 : 0) + (oldParts.length >= 2 ? oldParts[oldParts.length - 2] * 60 : 0) + (oldParts[oldParts.length - 1] || 0)
      if (newSec < oldSec) {
        result.isPB = true
        updateProfile('fiveKTime', newRace.time)
      }
    }

    setAppState(prev => ({
      ...prev,
      raceResults: [...prev.raceResults, result],
    }))
    setNewRace({ distance: '5K', time: '', date: '', customDistance: '' })
    setShowRaceForm(false)
  }

  const deleteRace = (id: string) => {
    setAppState(prev => ({
      ...prev,
      raceResults: prev.raceResults.filter(r => r.id !== id),
    }))
  }

  const resetProgress = () => {
    setAppState(prev => ({
      ...prev,
      completedSessions: {},
      fatigueLog: {},
      totalCompletedCount: 0,
      weeklyMileageLog: {},
      unlockedBadges: {},
    }))
    setShowConfirm(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '20px 20px 24px' }}
    >
      <h2 className="font-heading" style={{ fontWeight: 800, fontSize: 22, margin: '0 0 4px', color: 'var(--text)', letterSpacing: -0.5 }}>
        Settings
      </h2>
      <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
        Edit your profile, race details & pace zones
      </p>

      {/* Race Details */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 12, letterSpacing: 0.5 }}>
          RACE DETAILS
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={labelStyle}>Race Name</label>
            <input style={inputStyle} value={profile.raceName} onChange={e => updateProfile('raceName', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Race Date</label>
              <input style={inputStyle} type="date" value={profile.raceDate} onChange={e => updateProfile('raceDate', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Goal Time</label>
              <input style={inputStyle} value={profile.goalTime} placeholder="3:59:59" onChange={e => updateProfile('goalTime', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Plan Start Date</label>
            <input style={inputStyle} type="date" value={profile.startDate} onChange={e => updateProfile('startDate', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Personal Bests */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700, marginBottom: 12, letterSpacing: 0.5 }}>
          PERSONAL BESTS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>5K Time (mm:ss)</label>
            <input style={inputStyle} value={profile.fiveKTime} placeholder="24:44" onChange={e => updateProfile('fiveKTime', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>10K Time (mm:ss)</label>
            <input style={inputStyle} value={profile.tenKTime} placeholder="53:39" onChange={e => updateProfile('tenKTime', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Half Marathon (h:mm:ss)</label>
            <input style={inputStyle} value={profile.halfMarathonTime} placeholder="Not set" onChange={e => updateProfile('halfMarathonTime', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Longest Run (km)</label>
            <input style={inputStyle} type="number" value={profile.longestRun} onChange={e => updateProfile('longestRun', parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'var(--bg)', fontSize: 11, color: 'var(--text2)' }}>
          Pace zones auto-calculate from your 5K time. Update it when you get a new PB!
        </div>
      </div>

      {/* Availability */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 700, marginBottom: 12, letterSpacing: 0.5 }}>
          AVAILABILITY
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Rest Day</label>
            <select style={selectStyle} value={profile.restDay} onChange={e => updateProfile('restDay', e.target.value)}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Long Run Day</label>
            <select style={selectStyle} value={profile.longRunDay} onChange={e => updateProfile('longRunDay', e.target.value)}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <label style={labelStyle}>Runs Per Week: {profile.runsPerWeek}</label>
          <input
            type="range" min={3} max={6} value={profile.runsPerWeek}
            onChange={e => updateProfile('runsPerWeek', parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text2)' }}>
            <span>3</span><span>4</span><span>5</span><span>6</span>
          </div>
        </div>
      </div>

      {/* Injury Notes */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700, marginBottom: 12, letterSpacing: 0.5 }}>
          INJURY NOTES
        </div>
        <textarea
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          value={profile.injuryNotes}
          placeholder="Note any injuries or areas of concern..."
          onChange={e => updateProfile('injuryNotes', e.target.value)}
        />
      </div>

      {/* Pace Zones */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 10, letterSpacing: 0.3 }}>
          CURRENT PACE ZONES
          {paceImprovement > 0 && (
            <span style={{ color: 'var(--green)', marginLeft: 8 }}>(-{paceImprovement * 5}s/km gained)</span>
          )}
        </div>
        {[
          { label: 'Easy', range: paces.easyRange, color: 'var(--green)' },
          { label: 'Marathon', range: paces.marathonRange, color: 'var(--yellow)' },
          { label: 'Tempo', range: paces.tempoRange, color: 'var(--red)' },
          { label: 'Interval', range: paces.intervalRange, color: 'var(--red)' },
          { label: 'Recovery', range: `${paces.recovery}+`, color: 'var(--purple)' },
        ].map((z) => (
          <div key={z.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0', borderBottom: '1px solid var(--bg4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: z.color }} />
              <span style={{ fontSize: 13, color: 'var(--text)' }}>{z.label}</span>
            </div>
            <span className="font-heading" style={{ fontWeight: 700, fontSize: 14, color: z.color }}>
              {z.range}/km
            </span>
          </div>
        ))}
      </div>

      {/* Race Results */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 700, letterSpacing: 0.5 }}>
            RACE RESULTS
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRaceForm(!showRaceForm)}
            style={{
              padding: '6px 12px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: 'white',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {showRaceForm ? 'CANCEL' : '+ ADD RESULT'}
          </motion.button>
        </div>

        <AnimatePresence>
          {showRaceForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginBottom: 12 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px', background: 'var(--bg)', borderRadius: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={labelStyle}>Distance</label>
                    <select style={selectStyle} value={newRace.distance} onChange={e => setNewRace(p => ({ ...p, distance: e.target.value }))}>
                      <option value="5K">5K</option>
                      <option value="10K">10K</option>
                      <option value="Half Marathon">Half Marathon</option>
                      <option value="Marathon">Marathon</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Time</label>
                    <input style={inputStyle} value={newRace.time} placeholder="24:44" onChange={e => setNewRace(p => ({ ...p, time: e.target.value }))} />
                  </div>
                </div>
                {newRace.distance === 'Custom' && (
                  <div>
                    <label style={labelStyle}>Custom Distance</label>
                    <input style={inputStyle} value={newRace.customDistance} placeholder="e.g. 15km" onChange={e => setNewRace(p => ({ ...p, customDistance: e.target.value }))} />
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Date</label>
                  <input style={inputStyle} type="date" value={newRace.date} onChange={e => setNewRace(p => ({ ...p, date: e.target.value }))} />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={addRaceResult}
                  style={{
                    padding: 12, borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, var(--accent), #FF4500)',
                    color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  }}
                >
                  SAVE RESULT
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {appState.raceResults.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', padding: 16 }}>
            No race results yet. Log your parkruns and races!
          </div>
        ) : (
          appState.raceResults.map((r) => (
            <div key={r.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid var(--bg4)',
            }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                  {r.distance === 'Custom' ? r.customDistance : r.distance}
                  {r.isPB && <span style={{ color: 'var(--green)', marginLeft: 6, fontSize: 10, fontWeight: 700 }}>PB!</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{r.date}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="font-heading" style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
                  {r.time}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => deleteRace(r.id)}
                  style={{
                    width: 24, height: 24, borderRadius: 6, border: 'none',
                    background: 'var(--bg4)', color: 'var(--text2)',
                    fontSize: 12, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', minHeight: 24,
                  }}
                >
                  x
                </motion.button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Volume rules */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 10, letterSpacing: 0.3 }}>
          VOLUME PROGRESSION RULES
        </div>
        {VOLUME_RULES.map((rule, i) => <div key={i} className="list-item">{rule}</div>)}
      </div>

      {/* Recovery */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 10, letterSpacing: 0.3 }}>
          RECOVERY PRACTICES
        </div>
        {RECOVERY_PRACTICES.map((item, i) => <div key={i} className="list-item">{item}</div>)}
      </div>

      {/* Adaptive logic */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 10, letterSpacing: 0.3 }}>
          ADAPTIVE PLAN LOGIC
        </div>
        <div className="list-item">Miss 2+ sessions → next week volume -15%</div>
        <div className="list-item">Fatigue: Tired → volume -10%</div>
        <div className="list-item">Fatigue: Exhausted → volume -20%</div>
        <div className="list-item">Every 15 completed sessions → paces improve 5s/km</div>
        <div className="list-item">Adjustments stack but never below 60% of planned volume</div>
      </div>

      {/* Reset */}
      {!showConfirm ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowConfirm(true)}
          style={{
            width: '100%', padding: 16, borderRadius: 14,
            border: '1px solid var(--red)', background: 'transparent',
            color: 'var(--red)', fontFamily: "'Outfit', sans-serif",
            fontWeight: 700, fontSize: 14, letterSpacing: 0.5, cursor: 'pointer',
          }}
        >
          RESET ALL PROGRESS
        </motion.button>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={resetProgress}
            style={{ flex: 1, padding: 16, borderRadius: 14, border: 'none', background: 'var(--red)', color: 'white', fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            CONFIRM RESET
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowConfirm(false)}
            style={{ flex: 1, padding: 16, borderRadius: 14, border: '1px solid var(--bg4)', background: 'var(--bg2)', color: 'var(--text)', fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            CANCEL
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}
