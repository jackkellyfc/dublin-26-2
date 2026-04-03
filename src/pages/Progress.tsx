import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { useAdaptivePlan, START_DATE } from '../hooks/useAdaptivePlan'
import type { AppState } from '../hooks/useAdaptivePlan'
import { PHASES, BASE_WEEKLY_KM } from '../data/trainingPlan'
import { BADGES, checkBadges } from '../data/badges'

interface ProgressProps {
  appState: AppState
}

export default function Progress({ appState }: ProgressProps) {
  const plan = useAdaptivePlan({ appState, selectedWeek: 0 })
  const totalCompleted = Object.keys(appState.completedSessions).length

  const mileageData = useMemo(() => {
    return plan.weeks.map((w, i) => {
      const actual = w.sessions.reduce((sum, s) =>
        sum + (appState.completedSessions[`week${i + 1}-${s.day}`] ? s.distance : 0), 0)
      return { name: `W${i + 1}`, target: BASE_WEEKLY_KM[i], actual, phase: w.phase, color: w.phaseColor }
    })
  }, [plan.weeks, appState.completedSessions])

  const paceData = useMemo(() => {
    const data = []
    for (let i = 0; i <= 5; i++) {
      const imp = i * 5
      data.push({ milestone: `${i * 15} done`, easy: 6 * 60 + 30 - imp, marathon: 5 * 60 + 40 - imp, tempo: 5 * 60 + 35 - imp })
    }
    return data
  }, [])

  const totalSessions = plan.weeks.reduce((sum, w) => sum + w.sessions.filter(s => s.type !== 'rest').length, 0)
  const completionPct = totalSessions > 0 ? Math.round((totalCompleted / totalSessions) * 100) : 0

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

  const streak = useMemo(() => {
    let count = 0
    const now = new Date()
    for (let d = 0; d < 60; d++) {
      const date = new Date(now)
      date.setDate(date.getDate() - d)
      const weeksSince = Math.floor((date.getTime() - START_DATE.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const dayName = dayNames[date.getDay()]
      if (dayName === 'Sun') continue
      const key = `week${weeksSince + 1}-${dayName}`
      if (appState.completedSessions[key]) count++
      else if (d > 0) break
    }
    return count
  }, [appState.completedSessions])

  const currentWeekIdx = Math.max(0, Math.min(
    Math.floor((Date.now() - START_DATE.getTime()) / (7 * 24 * 60 * 60 * 1000)), 25))

  // Badge calculations
  const sessionTypeCounts = useMemo(() => {
    const counts = { tempo: 0, long: 0, intervals: 0, strength: 0 }
    Object.keys(appState.completedSessions).forEach(k => {
      const weekNum = parseInt(k.split('-')[0].replace('week', ''))
      const dayName = k.split('-')[1]
      const w = plan.weeks[weekNum - 1]
      if (!w) return
      const s = w.sessions.find(s => s.day === dayName)
      if (s && s.type in counts) counts[s.type as keyof typeof counts]++
    })
    return counts
  }, [appState.completedSessions, plan.weeks])

  const week1Sessions = plan.weeks[0]?.sessions.filter(s => s.type !== 'rest') || []
  const week1AllDone = week1Sessions.every(s => appState.completedSessions[`week1-${s.day}`])

  const unlockedBadgeIds = useMemo(() => checkBadges({
    totalKm,
    totalSessions: totalCompleted,
    tempoSessions: sessionTypeCounts.tempo,
    longSessions: sessionTypeCounts.long,
    intervalSessions: sessionTypeCounts.intervals,
    strengthSessions: sessionTypeCounts.strength,
    currentStreak: streak,
    currentWeekIdx,
    weekCompletionRates: [],
    completedSessions: appState.completedSessions,
    week1AllDone,
  }), [totalKm, totalCompleted, sessionTypeCounts, streak, currentWeekIdx, appState.completedSessions, week1AllDone])

  const ringSize = 100
  const ringStroke = 8
  const ringRadius = (ringSize - ringStroke) / 2
  const ringCircum = 2 * Math.PI * ringRadius
  const ringOffset = ringCircum * (1 - completionPct / 100)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '20px 20px 24px' }}
    >
      <h2 className="font-heading" style={{ fontWeight: 800, fontSize: 22, margin: '0 0 4px', color: 'var(--text)', letterSpacing: -0.5 }}>
        Progress
      </h2>
      <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>Track your journey to Dublin</p>

      {/* GPS Run Stats */}
      {(appState.runHistory?.length || 0) > 0 && (
        <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#FC4C02', fontWeight: 700, marginBottom: 12, letterSpacing: 0.5 }}>
            TRACKED RUNS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="font-heading" style={{ fontWeight: 800, fontSize: 22, color: 'var(--accent)' }}>
                {appState.runHistory.length}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5 }}>RUNS</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="font-heading" style={{ fontWeight: 800, fontSize: 22, color: 'var(--green)' }}>
                {appState.runHistory.reduce((s, r) => s + r.distance, 0).toFixed(1)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5 }}>KM</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="font-heading" style={{ fontWeight: 800, fontSize: 22, color: 'var(--yellow)' }}>
                {(() => {
                  const runs = appState.runHistory.filter(r => r.avgPace && r.avgPace !== '--:--')
                  if (runs.length === 0) return '--:--'
                  const totalSec = runs.reduce((s, r) => {
                    const [m, sec] = r.avgPace.split(':').map(Number)
                    return s + m * 60 + (sec || 0)
                  }, 0)
                  const avg = totalSec / runs.length
                  return `${Math.floor(avg / 60)}:${Math.floor(avg % 60).toString().padStart(2, '0')}`
                })()}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5 }}>AVG PACE</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ position: 'relative', width: ringSize, height: ringSize, margin: '0 auto 8px' }}>
            <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="var(--bg4)" strokeWidth={ringStroke} />
              <motion.circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="var(--green)" strokeWidth={ringStroke} strokeLinecap="round" strokeDasharray={ringCircum} initial={{ strokeDashoffset: ringCircum }} animate={{ strokeDashoffset: ringOffset }} transition={{ duration: 1, ease: 'easeOut' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 22, color: 'var(--green)' }}>
              {completionPct}%
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600 }}>COMPLETION</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="stat-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="font-heading" style={{ fontWeight: 700, fontSize: 22, color: 'var(--accent)' }}>{totalKm}km</div>
            <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>TOTAL LOGGED</div>
          </div>
          <div className="stat-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="font-heading" style={{ fontWeight: 700, fontSize: 22, color: 'var(--yellow)' }}>{streak}</div>
            <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>DAY STREAK</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        <div className="stat-card">
          <div className="font-heading" style={{ fontWeight: 700, fontSize: 22, color: 'var(--text)' }}>{totalCompleted}</div>
          <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>SESSIONS DONE</div>
        </div>
        <div className="stat-card">
          <div className="font-heading" style={{ fontWeight: 700, fontSize: 22, color: 'var(--purple)' }}>{Math.floor(totalCompleted / 15) * 5}s</div>
          <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>PACE GAINED/KM</div>
        </div>
      </div>

      {/* Badges */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.3 }}>ACHIEVEMENTS</div>
          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
            {unlockedBadgeIds.length}/{BADGES.length}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {BADGES.slice(0, 12).map((badge) => {
            const unlocked = unlockedBadgeIds.includes(badge.id)
            return (
              <motion.div
                key={badge.id}
                whileTap={{ scale: 0.95 }}
                style={{
                  textAlign: 'center', padding: '10px 4px',
                  borderRadius: 12,
                  background: unlocked ? `var(--bg3)` : 'var(--bg)',
                  border: `1px solid ${unlocked ? 'var(--accent)' : 'var(--bg4)'}`,
                  opacity: unlocked ? 1 : 0.4,
                  cursor: 'pointer',
                  position: 'relative',
                }}
                title={`${badge.name}: ${badge.description}`}
              >
                <div style={{ fontSize: 24, marginBottom: 2 }}>
                  {unlocked ? badge.icon : '🔒'}
                </div>
                <div style={{ fontSize: 8, color: unlocked ? 'var(--text)' : 'var(--text2)', fontWeight: 600, lineHeight: 1.2 }}>
                  {badge.name}
                </div>
                {unlocked && (
                  <div style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 12, height: 12, borderRadius: '50%',
                    background: 'var(--green)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 7, color: 'white', fontWeight: 700,
                  }}>
                    ✓
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
        {BADGES.length > 12 && (
          <div style={{ fontSize: 10, color: 'var(--text2)', textAlign: 'center', marginTop: 8 }}>
            +{BADGES.length - 12} more badges to unlock
          </div>
        )}
      </div>

      {/* Phase timeline */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 10, letterSpacing: 0.3 }}>PHASE PROGRESS</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {PHASES.map((phase, pi) => {
            let startW = 0
            for (let i = 0; i < pi; i++) startW += PHASES[i].weeks
            const isActive = currentWeekIdx >= startW && currentWeekIdx < startW + phase.weeks
            const isPast = currentWeekIdx >= startW + phase.weeks
            return (
              <div key={phase.name} style={{ flex: phase.weeks, textAlign: 'center' }}>
                <div style={{ height: 6, borderRadius: 3, background: isPast ? phase.color : isActive ? `${phase.color}80` : 'var(--bg4)', marginBottom: 6, position: 'relative', overflow: 'hidden' }}>
                  {isActive && (
                    <motion.div initial={{ width: 0 }} animate={{ width: `${((currentWeekIdx - startW + 1) / phase.weeks) * 100}%` }} transition={{ duration: 0.8 }} style={{ height: '100%', background: phase.color, borderRadius: 3 }} />
                  )}
                </div>
                <div style={{ fontSize: 9, color: isActive ? phase.color : 'var(--text2)', fontWeight: isActive ? 700 : 400 }}>{phase.name}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly mileage chart */}
      <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 12, letterSpacing: 0.3 }}>WEEKLY MILEAGE</div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={mileageData} barGap={1}>
              <XAxis dataKey="name" tick={{ fill: '#8B95A8', fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill: '#8B95A8', fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: '#1C2130', border: '1px solid #252B3B', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: '#E8ECF4' }} />
              <Bar dataKey="target" fill="#252B3B" radius={[3, 3, 0, 0]} />
              <Bar dataKey="actual" fill="#FF6B35" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text2)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#252B3B' }} />Target
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text2)' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)' }} />Actual
          </div>
        </div>
      </div>

      {/* Pace trend chart */}
      <div className="glass-card" style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 12, letterSpacing: 0.3 }}>PACE IMPROVEMENT TIMELINE</div>
        <div style={{ width: '100%', height: 180 }}>
          <ResponsiveContainer>
            <LineChart data={paceData}>
              <CartesianGrid stroke="#252B3B" strokeDasharray="3 3" />
              <XAxis dataKey="milestone" tick={{ fill: '#8B95A8', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8B95A8', fontSize: 9 }} axisLine={false} tickLine={false} width={35} domain={['dataMin - 10', 'dataMax + 10']} reversed tickFormatter={(v: number) => `${Math.floor(v / 60)}:${(v % 60).toString().padStart(2, '0')}`} />
              <Tooltip contentStyle={{ background: '#1C2130', border: '1px solid #252B3B', borderRadius: 8, fontSize: 12 }} formatter={(v) => { const n = Number(v); return [`${Math.floor(n / 60)}:${(n % 60).toString().padStart(2, '0')}/km`] }} />
              <Line type="monotone" dataKey="easy" stroke="#4ECDC4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="marathon" stroke="#FFB347" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="tempo" stroke="#FF6B6B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text2)' }}><div style={{ width: 10, height: 3, borderRadius: 2, background: '#4ECDC4' }} />Easy</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text2)' }}><div style={{ width: 10, height: 3, borderRadius: 2, background: '#FFB347' }} />Marathon</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text2)' }}><div style={{ width: 10, height: 3, borderRadius: 2, background: '#FF6B6B' }} />Tempo</div>
        </div>
      </div>
    </motion.div>
  )
}
