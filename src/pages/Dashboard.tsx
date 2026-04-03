import { useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CountdownRing from '../components/CountdownRing'
import FatigueCheck from '../components/FatigueCheck'
import MileageBar from '../components/MileageBar'
import AdaptiveAlert from '../components/AdaptiveAlert'
import SessionCard from '../components/SessionCard'
import SessionModal from '../components/SessionModal'
import CelebrationModal from '../components/CelebrationModal'
import { useAdaptivePlan, RACE_DATE, START_DATE } from '../hooks/useAdaptivePlan'
import type { AppState } from '../hooks/useAdaptivePlan'
import { addDays } from '../utils/dates'
import { getDailyQuote } from '../data/quotes'

interface DashboardProps {
  appState: AppState
  setAppState: (fn: (prev: AppState) => AppState) => void
}

export default function Dashboard({ appState, setAppState }: DashboardProps) {
  const [selectedSession, setSelectedSession] = useState<number | null>(null)
  const [celebrationSession, setCelebrationSession] = useState<number | null>(null)

  const raceDate = appState.userProfile?.raceDate ? new Date(appState.userProfile.raceDate) : RACE_DATE
  const startDate = appState.userProfile?.startDate ? new Date(appState.userProfile.startDate) : START_DATE

  const currentWeekIdx = useMemo(() => {
    const weeksSinceStart = Math.floor((Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return Math.max(0, Math.min(weeksSinceStart, 25))
  }, [startDate])

  const plan = useAdaptivePlan({ appState, selectedWeek: currentWeekIdx })
  const currentWeek = plan.weeks[currentWeekIdx]

  const totalCompleted = Object.keys(appState.completedSessions).length

  const totalKm = useMemo(() => {
    return Object.entries(appState.completedSessions).reduce((sum, [k]) => {
      const weekNum = parseInt(k.split('-')[0].replace('week', ''))
      const dayName = k.split('-')[1]
      const w = plan.weeks[weekNum - 1]
      if (!w) return sum
      const s = w.sessions.find(s => s.day === dayName)
      return sum + (s ? s.distance : 0)
    }, 0)
  }, [appState.completedSessions, plan.weeks])

  if (!currentWeek) return null

  const fatigueLevel = appState.fatigueLog[`week${currentWeekIdx + 1}`] || 'normal'
  const weekCompletedKm = currentWeek.sessions.reduce((sum, s) =>
    sum + (appState.completedSessions[`week${currentWeekIdx + 1}-${s.day}`] ? s.distance : 0), 0)

  const todayDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const todayName = todayDayNames[new Date().getDay()]
  const todaySession = currentWeek.sessions.find(s => s.day === todayName)
  const todayCompleted = todaySession ? !!appState.completedSessions[`week${currentWeekIdx + 1}-${todaySession.day}`] : false

  const missedRuns = useMemo(() => {
    const now = new Date()
    const runningSessions = currentWeek.sessions.filter(s => s.type !== 'rest' && s.type !== 'strength')
    let missed = 0
    runningSessions.forEach(s => {
      const dayIdx = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(s.day)
      const sessionDate = addDays(currentWeek.startDate, dayIdx)
      if (sessionDate < now && !appState.completedSessions[`week${currentWeekIdx + 1}-${s.day}`]) missed++
    })
    return missed
  }, [currentWeek, appState.completedSessions, currentWeekIdx])

  const toggleSession = useCallback((day: string) => {
    const key = `week${currentWeekIdx + 1}-${day}`
    const wasCompleted = !!appState.completedSessions[key]

    setAppState(prev => {
      const next = { ...prev.completedSessions }
      if (next[key]) delete next[key]
      else next[key] = true
      return { ...prev, completedSessions: next }
    })

    // Show celebration when marking complete (not uncompleting)
    if (!wasCompleted) {
      const idx = currentWeek.sessions.findIndex(s => s.day === day)
      const session = currentWeek.sessions[idx]
      if (session && session.type !== 'rest') {
        setCelebrationSession(idx)
      }
    }
  }, [currentWeekIdx, appState.completedSessions, setAppState, currentWeek])

  const setFatigue = (level: string) => {
    setAppState(prev => ({
      ...prev,
      fatigueLog: { ...prev.fatigueLog, [`week${currentWeekIdx + 1}`]: level },
    }))
  }

  const paceImprovement = Math.floor(totalCompleted / 15)
  const modalSession = selectedSession !== null ? currentWeek.sessions[selectedSession] : null
  const celebSession = celebrationSession !== null ? currentWeek.sessions[celebrationSession] : null
  const quote = getDailyQuote()

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
          <h1 className="gradient-text font-heading" style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
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
          SUB {appState.userProfile?.goalTime?.split(':').slice(0, 2).join(':') || '4:00'}
        </div>
      </div>

      {/* Daily Quote */}
      <div className="glass-card" style={{ padding: 14, marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
          "{quote.quote}"
        </p>
        <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, margin: '4px 0 0' }}>— {quote.author}</p>
      </div>

      {/* Countdown */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
        <CountdownRing raceDate={raceDate} startDate={startDate} />
      </div>

      {/* Phase indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span className="phase-dot" style={{ background: currentWeek.phaseColor }} />
        <span className="font-heading" style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
          {currentWeek.phase}
        </span>
        {currentWeek.isDownWeek && <span className="down-badge">DOWN WEEK</span>}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text2)' }}>{currentWeek.targetKm}km target</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <MileageBar completed={weekCompletedKm} target={currentWeek.targetKm} />
      </div>

      <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
        <FatigueCheck value={fatigueLevel} onChange={setFatigue} />
      </div>

      <AnimatePresence>
        {missedRuns >= 2 && <AdaptiveAlert type="missed" missedCount={missedRuns} />}
        {fatigueLevel === 'high' && <AdaptiveAlert type="tired" />}
        {fatigueLevel === 'very_high' && <AdaptiveAlert type="exhausted" />}
        {paceImprovement > 0 && <AdaptiveAlert type="improved" />}
      </AnimatePresence>

      {/* Today's session */}
      {todaySession && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 8, letterSpacing: 0.3 }}>TODAY'S SESSION</div>
          <SessionCard
            session={todaySession}
            completed={todayCompleted}
            onClick={() => setSelectedSession(currentWeek.sessions.indexOf(todaySession))}
            onToggle={(e) => { e.stopPropagation(); toggleSession(todaySession.day) }}
          />
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        <div className="stat-card">
          <div className="font-heading" style={{ fontWeight: 700, fontSize: 22, color: 'var(--text)' }}>{totalCompleted}</div>
          <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>COMPLETED</div>
        </div>
        <div className="stat-card">
          <div className="font-heading" style={{ fontWeight: 700, fontSize: 22, color: 'var(--green)' }}>{totalKm}km</div>
          <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>TOTAL KM</div>
        </div>
        <div className="stat-card">
          <div className="font-heading" style={{ fontWeight: 700, fontSize: 22, color: 'var(--accent)' }}>W{currentWeek.weekNumber}</div>
          <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>CURRENT</div>
        </div>
      </div>

      {/* This week */}
      <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 8, letterSpacing: 0.3 }}>THIS WEEK</div>
      {currentWeek.sessions.map((s, i) => (
        <SessionCard
          key={s.day}
          session={s}
          completed={!!appState.completedSessions[`week${currentWeekIdx + 1}-${s.day}`]}
          index={i}
          onClick={() => setSelectedSession(i)}
          onToggle={(e) => { e.stopPropagation(); toggleSession(s.day) }}
        />
      ))}

      {/* Session detail modal */}
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

      {/* Celebration modal */}
      {celebSession && (
        <CelebrationModal
          session={celebSession}
          totalCompleted={totalCompleted + 1}
          totalKm={totalKm + celebSession.distance}
          onClose={() => setCelebrationSession(null)}
        />
      )}
    </motion.div>
  )
}
