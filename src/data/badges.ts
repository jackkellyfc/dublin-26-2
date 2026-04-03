export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: string
}

export const BADGES: Badge[] = [
  { id: 'first-run', name: 'First Run', description: 'Complete your first session', icon: '🎯', category: 'Milestones' },
  { id: 'week-one', name: 'Week One Done', description: 'Complete all sessions in Week 1', icon: '🏅', category: 'Milestones' },
  { id: '25km', name: '25km Club', description: 'Log 25km total', icon: '🥉', category: 'Distance' },
  { id: '50km', name: '50km Club', description: 'Log 50km total', icon: '🥈', category: 'Distance' },
  { id: '100km', name: '100km Club', description: 'Log 100km total', icon: '🥇', category: 'Distance' },
  { id: '200km', name: '200km Club', description: 'Log 200km total', icon: '💎', category: 'Distance' },
  { id: '500km', name: '500km Club', description: 'Log 500km total', icon: '👑', category: 'Distance' },
  { id: 'tempo-5', name: 'Tempo King', description: 'Complete 5 tempo sessions', icon: '⚡', category: 'Session Types' },
  { id: 'long-10', name: 'Long Run Legend', description: 'Complete 10 long runs', icon: '🏔️', category: 'Session Types' },
  { id: 'speed-5', name: 'Speed Demon', description: 'Complete 5 interval sessions', icon: '🔥', category: 'Session Types' },
  { id: 'iron-legs', name: 'Iron Legs', description: 'Complete 10 strength sessions', icon: '🏋️', category: 'Session Types' },
  { id: 'streak-7', name: 'Streak Machine', description: 'Hit a 7-day streak', icon: '🔥', category: 'Consistency' },
  { id: 'streak-14', name: 'Unstoppable', description: 'Hit a 14-day streak', icon: '💪', category: 'Consistency' },
  { id: 'consistent', name: 'Consistent', description: 'Complete 80%+ sessions in a 4-week block', icon: '📈', category: 'Consistency' },
  { id: 'base-done', name: 'Base Builder', description: 'Complete Phase 1 (Base Building)', icon: '🧱', category: 'Phases' },
  { id: 'endurance-done', name: 'Endurance Engine', description: 'Complete Phase 2 (Endurance)', icon: '🚂', category: 'Phases' },
  { id: 'peak-done', name: 'Peak Performer', description: 'Complete Phase 3 (Peak)', icon: '⛰️', category: 'Phases' },
  { id: 'race-ready', name: 'Race Ready', description: 'Enter the taper phase', icon: '🏁', category: 'Phases' },
  { id: 'ten-sessions', name: 'Getting Started', description: 'Complete 10 sessions', icon: '✅', category: 'Milestones' },
  { id: 'fifty-sessions', name: 'Halfway Hero', description: 'Complete 50 sessions', icon: '🌟', category: 'Milestones' },
]

export interface BadgeCheck {
  totalKm: number
  totalSessions: number
  tempoSessions: number
  longSessions: number
  intervalSessions: number
  strengthSessions: number
  currentStreak: number
  currentWeekIdx: number
  weekCompletionRates: number[] // percentage per 4-week block
  completedSessions: Record<string, boolean>
  week1AllDone: boolean
}

export const checkBadges = (stats: BadgeCheck): string[] => {
  const unlocked: string[] = []

  if (stats.totalSessions >= 1) unlocked.push('first-run')
  if (stats.totalSessions >= 10) unlocked.push('ten-sessions')
  if (stats.totalSessions >= 50) unlocked.push('fifty-sessions')
  if (stats.week1AllDone) unlocked.push('week-one')
  if (stats.totalKm >= 25) unlocked.push('25km')
  if (stats.totalKm >= 50) unlocked.push('50km')
  if (stats.totalKm >= 100) unlocked.push('100km')
  if (stats.totalKm >= 200) unlocked.push('200km')
  if (stats.totalKm >= 500) unlocked.push('500km')
  if (stats.tempoSessions >= 5) unlocked.push('tempo-5')
  if (stats.longSessions >= 10) unlocked.push('long-10')
  if (stats.intervalSessions >= 5) unlocked.push('speed-5')
  if (stats.strengthSessions >= 10) unlocked.push('iron-legs')
  if (stats.currentStreak >= 7) unlocked.push('streak-7')
  if (stats.currentStreak >= 14) unlocked.push('streak-14')
  if (stats.weekCompletionRates.some(r => r >= 80)) unlocked.push('consistent')
  if (stats.currentWeekIdx >= 8) unlocked.push('base-done')
  if (stats.currentWeekIdx >= 16) unlocked.push('endurance-done')
  if (stats.currentWeekIdx >= 22) unlocked.push('peak-done')
  if (stats.currentWeekIdx >= 22) unlocked.push('race-ready')

  return unlocked
}
