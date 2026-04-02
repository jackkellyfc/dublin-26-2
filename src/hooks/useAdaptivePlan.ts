import { useMemo } from 'react'
import { generateTrainingPlan } from '../data/trainingPlan'
import type { TrainingPlan } from '../data/trainingPlan'
import { getMonday } from '../utils/dates'

export const RACE_DATE = new Date(2026, 9, 26) // October 26 2026
export const START_DATE = getMonday(new Date('2026-04-06'))

export interface AppState {
  completedSessions: Record<string, boolean>
  fatigueLog: Record<string, string>
  settings: { raceDate: string; startDate: string }
  totalCompletedCount: number
  weeklyMileageLog: Record<string, number>
}

export const DEFAULT_APP_STATE: AppState = {
  completedSessions: {},
  fatigueLog: {},
  settings: { raceDate: '2026-10-26', startDate: '2026-04-06' },
  totalCompletedCount: 0,
  weeklyMileageLog: {},
}

interface UseAdaptivePlanArgs {
  appState: AppState
  selectedWeek: number
}

export const useAdaptivePlan = ({ appState, selectedWeek }: UseAdaptivePlanArgs): TrainingPlan => {
  const fatigueLevel = appState.fatigueLog[`week${selectedWeek + 1}`] || 'normal'
  const totalCompleted = Object.keys(appState.completedSessions).length
  const paceImprovement = Math.floor(totalCompleted / 15)

  // Count missed runs in selected week
  const missedRuns = useMemo(() => {
    const plan = generateTrainingPlan(START_DATE, RACE_DATE, { fatigueLevel })
    const week = plan.weeks[selectedWeek]
    if (!week) return 0
    const runningSessions = week.sessions.filter(s => s.type !== 'rest' && s.type !== 'strength')
    const now = new Date()
    const pastSessions = runningSessions.filter(s => {
      const dayIdx = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(s.day)
      const sessionDate = new Date(week.startDate)
      sessionDate.setDate(sessionDate.getDate() + dayIdx)
      return sessionDate < now
    })
    const completed = runningSessions.filter(s => appState.completedSessions[`week${selectedWeek + 1}-${s.day}`])
    return Math.max(0, pastSessions.length - completed.length)
  }, [selectedWeek, appState.completedSessions, fatigueLevel])

  return useMemo(
    () =>
      generateTrainingPlan(START_DATE, RACE_DATE, {
        missedRuns,
        fatigueLevel,
        paceImprovement,
      }),
    [missedRuns, fatigueLevel, paceImprovement],
  )
}
