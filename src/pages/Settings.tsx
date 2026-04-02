import { useState } from 'react'
import { motion } from 'framer-motion'
import type { AppState } from '../hooks/useAdaptivePlan'
import { computePaces } from '../data/paces'
import { VOLUME_RULES, RECOVERY_PRACTICES } from '../data/injuryWarnings'

interface SettingsProps {
  appState: AppState
  setAppState: (fn: (prev: AppState) => AppState) => void
}

export default function Settings({ appState, setAppState }: SettingsProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  const totalCompleted = Object.keys(appState.completedSessions).length
  const paceImprovement = Math.floor(totalCompleted / 15)
  const paces = computePaces(paceImprovement)

  const resetProgress = () => {
    setAppState(() => ({
      completedSessions: {},
      fatigueLog: {},
      settings: { raceDate: '2026-10-26', startDate: '2026-04-06' },
      totalCompletedCount: 0,
      weeklyMileageLog: {},
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
      <h2 className="font-heading" style={{
        fontWeight: 800, fontSize: 22, margin: '0 0 4px', color: 'var(--text)',
        letterSpacing: -0.5,
      }}>
        Settings
      </h2>
      <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
        Race info, pace zones & preferences
      </p>

      {/* Race info */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 10, letterSpacing: 0.3 }}>
          RACE DETAILS
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Event</span>
          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Dublin Marathon 2026</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Date</span>
          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>October 26, 2026</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Goal Time</span>
          <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>Sub 4:00:00</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Plan Start</span>
          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>April 6, 2026</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Duration</span>
          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>26 Weeks</span>
        </div>
      </div>

      {/* Runner profile */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 10, letterSpacing: 0.3 }}>
          RUNNER PROFILE
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Current 5K</span>
          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>24:44</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Current 10K</span>
          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>53:39</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Longest Run</span>
          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>15km (1:27)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Injury Note</span>
          <span style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>Ankle (recurring)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Rest Day</span>
          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Sunday (always)</span>
        </div>
      </div>

      {/* Pace zones */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 10, letterSpacing: 0.3 }}>
          CURRENT PACE ZONES
          {paceImprovement > 0 && (
            <span style={{ color: 'var(--green)', marginLeft: 8 }}>
              (-{paceImprovement * 5}s/km gained)
            </span>
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
            <span style={{
              fontFamily: "'Outfit', sans-serif", fontWeight: 700,
              fontSize: 14, color: z.color,
            }}>
              {z.range}/km
            </span>
          </div>
        ))}
      </div>

      {/* Volume rules */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 10, letterSpacing: 0.3 }}>
          VOLUME PROGRESSION RULES
        </div>
        {VOLUME_RULES.map((rule, i) => (
          <div key={i} className="list-item">{rule}</div>
        ))}
      </div>

      {/* Recovery practices */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 10, letterSpacing: 0.3 }}>
          RECOVERY PRACTICES
        </div>
        {RECOVERY_PRACTICES.map((item, i) => (
          <div key={i} className="list-item">{item}</div>
        ))}
      </div>

      {/* Adaptive logic info */}
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

      {/* Stats */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 10, letterSpacing: 0.3 }}>
          SESSION STATS
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Total Completed</span>
          <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>{totalCompleted}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Pace Improvements</span>
          <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700 }}>{paceImprovement}x</span>
        </div>
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
            fontWeight: 700, fontSize: 14, letterSpacing: 0.5,
            cursor: 'pointer',
          }}
        >
          RESET ALL PROGRESS
        </motion.button>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={resetProgress}
            style={{
              flex: 1, padding: 16, borderRadius: 14,
              border: 'none', background: 'var(--red)',
              color: 'white', fontFamily: "'Outfit', sans-serif",
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            CONFIRM RESET
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowConfirm(false)}
            style={{
              flex: 1, padding: 16, borderRadius: 14,
              border: '1px solid var(--bg4)', background: 'var(--bg2)',
              color: 'var(--text)', fontFamily: "'Outfit', sans-serif",
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            CANCEL
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}
