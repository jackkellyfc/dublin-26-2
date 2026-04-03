import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import WeekSelector from '../components/WeekSelector'
import SessionCard from '../components/SessionCard'
import SessionModal from '../components/SessionModal'
import MileageBar from '../components/MileageBar'
import CelebrationModal from '../components/CelebrationModal'
import { useAdaptivePlan, START_DATE } from '../hooks/useAdaptivePlan'
import type { AppState } from '../hooks/useAdaptivePlan'
import { useWeekNavigation } from '../hooks/useWeekNavigation'
import { formatDate } from '../utils/dates'

interface CalendarProps {
  appState: AppState
  setAppState: (fn: (prev: AppState) => AppState) => void
}

export default function Calendar({ appState, setAppState }: CalendarProps) {
  const [selectedSession, setSelectedSession] = useState<number | null>(null)
  const [celebrationSession, setCelebrationSession] = useState<number | null>(null)

  const initialWeek = useMemo(() => {
    const weeksSinceStart = Math.floor((Date.now() - START_DATE.getTime()) / (7 * 24 * 60 * 60 * 1000))
    return Math.max(0, Math.min(weeksSinceStart, 25))
  }, [])

  const { selectedWeek, goToWeek } = useWeekNavigation(26, initialWeek)
  const plan = useAdaptivePlan({ appState, selectedWeek })
  const currentWeek = plan.weeks[selectedWeek]

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

  const weekCompletedKm = currentWeek.sessions.reduce((sum, s) =>
    sum + (appState.completedSessions[`week${selectedWeek + 1}-${s.day}`] ? s.distance : 0), 0)

  const toggleSession = useCallback((day: string) => {
    const key = `week${selectedWeek + 1}-${day}`
    const wasCompleted = !!appState.completedSessions[key]

    setAppState(prev => {
      const next = { ...prev.completedSessions }
      if (next[key]) delete next[key]
      else next[key] = true
      return { ...prev, completedSessions: next }
    })

    if (!wasCompleted) {
      const idx = currentWeek.sessions.findIndex(s => s.day === day)
      const session = currentWeek.sessions[idx]
      if (session && session.type !== 'rest') {
        setCelebrationSession(idx)
      }
    }
  }, [selectedWeek, appState.completedSessions, setAppState, currentWeek])

  const modalSession = selectedSession !== null ? currentWeek.sessions[selectedSession] : null
  const celebSession = celebrationSession !== null ? currentWeek.sessions[celebrationSession] : null

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '20px 20px 24px' }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 className="font-heading" style={{
          fontWeight: 800, fontSize: 22, margin: 0, color: 'var(--text)',
          letterSpacing: -0.5,
        }}>
          Calendar
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
          26-week training plan
        </p>
      </div>

      {/* Week selector */}
      <div style={{ marginBottom: 16 }}>
        <WeekSelector weeks={plan.weeks} selectedWeek={selectedWeek} onSelect={goToWeek} />
      </div>

      {/* Week info */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="font-heading" style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)' }}>
              Week {currentWeek.weekNumber}
            </span>
            <span className="type-badge" style={{ background: currentWeek.phaseColor }}>
              {currentWeek.phase.toUpperCase()}
            </span>
            {currentWeek.isDownWeek && <span className="down-badge">DOWN</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
            {formatDate(currentWeek.startDate)} — {formatDate(currentWeek.endDate)}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="font-heading" style={{ fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>
            {currentWeek.targetKm}km
          </div>
          <div style={{ fontSize: 10, color: 'var(--text2)' }}>target</div>
        </div>
      </div>

      {/* Mileage */}
      <div style={{ marginBottom: 16 }}>
        <MileageBar completed={weekCompletedKm} target={currentWeek.targetKm} />
      </div>

      {/* Sessions */}
      {currentWeek.sessions.map((s, i) => (
        <SessionCard
          key={s.day}
          session={s}
          completed={!!appState.completedSessions[`week${selectedWeek + 1}-${s.day}`]}
          index={i}
          onClick={() => setSelectedSession(i)}
          onToggle={(e) => {
            e.stopPropagation()
            toggleSession(s.day)
          }}
        />
      ))}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => goToWeek(selectedWeek - 1)}
          disabled={selectedWeek <= 0}
          style={{
            flex: 1, padding: 14, borderRadius: 12,
            border: '1px solid var(--bg4)', background: 'var(--bg2)',
            color: selectedWeek > 0 ? 'var(--text)' : 'var(--text2)',
            fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 13,
            opacity: selectedWeek > 0 ? 1 : 0.4,
            cursor: selectedWeek > 0 ? 'pointer' : 'default',
          }}
        >
          Previous Week
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => goToWeek(selectedWeek + 1)}
          disabled={selectedWeek >= 25}
          style={{
            flex: 1, padding: 14, borderRadius: 12,
            border: 'none',
            background: selectedWeek < 25 ? 'linear-gradient(135deg, var(--accent), #FF4500)' : 'var(--bg4)',
            color: 'white',
            fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 13,
            opacity: selectedWeek < 25 ? 1 : 0.4,
            cursor: selectedWeek < 25 ? 'pointer' : 'default',
          }}
        >
          Next Week
        </motion.button>
      </div>

      {/* Modal */}
      {modalSession && (
        <SessionModal
          session={modalSession}
          completed={!!appState.completedSessions[`week${selectedWeek + 1}-${modalSession.day}`]}
          onClose={() => setSelectedSession(null)}
          onToggle={() => {
            toggleSession(modalSession.day)
            setSelectedSession(null)
          }}
        />
      )}

      {/* Celebration */}
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
