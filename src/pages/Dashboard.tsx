import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CountdownRing from '../components/CountdownRing'
import FatigueCheck from '../components/FatigueCheck'
import MileageBar from '../components/MileageBar'
import AdaptiveAlert from '../components/AdaptiveAlert'
import SessionCard from '../components/SessionCard'
import SessionModal from '../components/SessionModal'
import { useAdaptivePlan, RACE_DATE, START_DATE } from '../hooks/useAdaptivePlan'
import type { AppState } from '../hooks/useAdaptivePlan'
import { useState } from 'react'
import { addDays } from '../utils/dates'

interface DashboardProps {
  appState: AppState
  setAppState: (fn: (prev: AppState) => AppState) => void
}

export default function Dashboard({ appState, setAppState }: DashboardProps) {
  const [selectedSession, setSelectedSession] = useState<number | null>(null)

  // Determine current week index
  const currentWeekIdx = useMemo(() => {
    const now = Date.now()
    const weeksSinceStart = Math.floor((now - START_DATE.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return Math.max(0, Math.min(weeksSinceStart, 25))
  }, [])

  const plan = useAdaptivePlan({ appState, selectedWeek: currentWeekIdx })
  const currentWeek = plan.weeks[currentWeekIdx]

  if (!currentWeek) return null

  const fatigueLevel = appState.fatigueLog[`week${currentWeekIdx + 1}`] || 'normal'

  const weekCompletedKm = currentWeek.sessions.reduce((sum, s) =>
    sum + (appState.completedSessions[`week${currentWeekIdx + 1}-${s.day}`] ? s.distance : 0), 0)

  // Today's session
  const todayDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const todayName = todayDayNames[new Date().getDay()]
  const todaySession = currentWeek.sessions.find(s => s.day === todayName)
  const todayCompleted = todaySession ? !!appState.completedSessions[`week${currentWeekIdx + 1}-${todaySession.day}`] : false

  // Missed runs count
  const missedRuns = useMemo(() => {
    const now = new Date()
    const runningSessions = currentWeek.sessions.filter(s => s.type !== 'rest' && s.type !== 'strength')
    let missed = 0
    runningSessions.forEach(s => {
      const dayIdx = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(s.day)
      const sessionDate = addDays(currentWeek.startDate, dayIdx)
      if (sessionDate < now && !appState.completedSessions[`week${currentWeekIdx + 1}-${s.day}`]) {
        missed++
      }
    })
    return missed
  }, [currentWeek, appState.completedSessions, currentWeekIdx])

  const toggleSession = (day: string) => {
    const key = `week${currentWeekIdx + 1}-${day}`
    setAppState(prev => {
      const next = { ...prev.completedSessions }
      if (next[key]) delete next[key]
      else next[key] = true
      return { ...prev, completedSessions: next }
    })
  }

  const setFatigue = (level: string) => {
    setAppState(prev => ({
      ...prev,
      fatigueLog: { ...prev.fatigueLog, [`week${currentWeekIdx + 1}`]: level },
    }))
  }

  const totalCompleted = Object.keys(appState.completedSessions).length
  const paceImprovement = Math.floor(totalCompleted / 15)

  const modalSession = selectedSession !== null ? currentWeek.sessions[selectedSession] : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '20px 20px 24px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 className="gradient-text font-heading" style={{
            fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: 0,
          }}>
            DUBLIN 26.2
          </h1>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
            Week {currentWeek.weekNumber} · {currentWeek.phase}
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, var(--accent), #FF4500)',
          padding: '6px 14px', borderRadius: 20,
          fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
          color: 'white', fontFamily: "'Outfit', sans-serif",
        }}>
          SUB 4:00
        </div>
      </div>

      {/* Countdown */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
        <CountdownRing raceDate={RACE_DATE} startDate={START_DATE} />
      </div>

      {/* Phase indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
      }}>
        <span className="phase-dot" style={{ background: currentWeek.phaseColor }} />
        <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
          {currentWeek.phase}
        </span>
        {currentWeek.isDownWeek && <span className="down-badge">DOWN WEEK</span>}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text2)' }}>
          {currentWeek.targetKm}km target
        </span>
      </div>

      {/* Mileage */}
      <div style={{ marginBottom: 16 }}>
        <MileageBar completed={weekCompletedKm} target={currentWeek.targetKm} />
      </div>

      {/* Fatigue */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
        <FatigueCheck value={fatigueLevel} onChange={setFatigue} />
      </div>

      {/* Adaptive alerts */}
      <AnimatePresence>
        {missedRuns >= 2 && <AdaptiveAlert type="missed" missedCount={missedRuns} />}
        {fatigueLevel === 'high' && <AdaptiveAlert type="tired" />}
        {fatigueLevel === 'very_high' && <AdaptiveAlert type="exhausted" />}
        {paceImprovement > 0 && <AdaptiveAlert type="improved" />}
      </AnimatePresence>

      {/* Today's session hero */}
      {todaySession && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 8, letterSpacing: 0.3 }}>
            TODAY'S SESSION
          </div>
          <SessionCard
            session={todaySession}
            completed={todayCompleted}
            onClick={() => {
              const idx = currentWeek.sessions.indexOf(todaySession)
              setSelectedSession(idx)
            }}
            onToggle={(e) => {
              e.stopPropagation()
              toggleSession(todaySession.day)
            }}
          />
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        <div className="stat-card">
          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 22, color: 'var(--text)' }}>
            {totalCompleted}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>COMPLETED</div>
        </div>
        <div className="stat-card">
          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 22, color: 'var(--green)' }}>
            {Object.entries(appState.completedSessions)
              .reduce((sum, [k]) => {
                const weekNum = parseInt(k.split('-')[0].replace('week', ''))
                const w = plan.weeks[weekNum - 1]
                if (!w) return sum
                const s = w.sessions.find(s => k.endsWith(`-${s.day}`))
                return sum + (s ? s.distance : 0)
              }, 0)}km
          </div>
          <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>TOTAL KM</div>
        </div>
        <div className="stat-card">
          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 22, color: 'var(--accent)' }}>
            W{currentWeek.weekNumber}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>CURRENT</div>
        </div>
      </div>

      {/* This week */}
      <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 8, letterSpacing: 0.3 }}>
        THIS WEEK
      </div>
      {currentWeek.sessions.map((s, i) => (
        <SessionCard
          key={s.day}
          session={s}
          completed={!!appState.completedSessions[`week${currentWeekIdx + 1}-${s.day}`]}
          index={i}
          onClick={() => setSelectedSession(i)}
          onToggle={(e) => {
            e.stopPropagation()
            toggleSession(s.day)
          }}
        />
      ))}

      {/* Modal */}
      {modalSession && (
        <SessionModal
          session={modalSession}
          completed={!!appState.completedSessions[`week${currentWeekIdx + 1}-${modalSession.day}`]}
          onClose={() => setSelectedSession(null)}
          onToggle={() => {
            toggleSession(modalSession.day)
            setSelectedSession(null)
          }}
        />
      )}
    </motion.div>
  )
}
