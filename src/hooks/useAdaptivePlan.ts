import { useMemo } from 'react'
import { generateTrainingPlan } from '../data/trainingPlan'
import type { TrainingPlan } from '../data/trainingPlan'
import { getMonday } from '../utils/dates'

export const RACE_DATE = new Date(2026, 9, 26)
export const START_DATE = getMonday(new Date('2026-04-06'))

export interface UserProfile {
  name: string
  fiveKTime: string
  tenKTime: string
  halfMarathonTime: string
  longestRun: number
  goalTime: string
  raceName: string
  raceDate: string
  startDate: string
  restDay: string
  longRunDay: string
  runsPerWeek: number
  injuryNotes: string
}

export interface RaceResult {
  id: string
  distance: string
  customDistance?: string
  time: string
  date: string
  isPB: boolean
}

export interface CompletedRunRecord {
  id: string
  date: string
  distance: number
  duration: number
  avgPace: string
  splits: { km: number; time: number; pace: string }[]
  calories: number
}

export interface AppState {
  completedSessions: Record<string, boolean>
  fatigueLog: Record<string, string>
  settings: { raceDate: string; startDate: string }
  totalCompletedCount: number
  weeklyMileageLog: Record<string, number>
  userProfile: UserProfile
  raceResults: RaceResult[]
  unlockedBadges: Record<string, string> // badgeId -> date unlocked
  runHistory: CompletedRunRecord[]
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'User',
  fiveKTime: '24:44',
  tenKTime: '53:39',
  halfMarathonTime: '',
  longestRun: 15,
  goalTime: '3:59:59',
  raceName: 'Dublin Marathon',
  raceDate: '2026-10-26',
  startDate: '2026-04-06',
  restDay: 'Sun',
  longRunDay: 'Thu',
  runsPerWeek: 4,
  injuryNotes: 'Recurring ankle pain during and after runs',
}

export const DEFAULT_APP_STATE: AppState = {
  completedSessions: {},
  fatigueLog: {},
  settings: { raceDate: '2026-10-26', startDate: '2026-04-06' },
  totalCompletedCount: 0,
  weeklyMileageLog: {},
  userProfile: DEFAULT_USER_PROFILE,
  raceResults: [],
  unlockedBadges: {},
  runHistory: [],
}

interface UseAdaptivePlanArgs {
  appState: AppState
  selectedWeek: number
}

export const useAdaptivePlan = ({ appState, selectedWeek }: UseAdaptivePlanArgs): TrainingPlan => {
  const fatigueLevel = appState.fatigueLog[`week${selectedWeek + 1}`] || 'normal'
  const totalCompleted = Object.keys(appState.completedSessions).length
  const paceImprovement = Math.floor(totalCompleted / 15)
  const fiveKTime = appState.userProfile?.fiveKTime || '24:44'

  const raceDate = appState.userProfile?.raceDate
    ? new Date(appState.userProfile.raceDate)
    : RACE_DATE
  const startDate = appState.userProfile?.startDate
    ? getMonday(new Date(appState.userProfile.startDate))
    : START_DATE

  const missedRuns = useMemo(() => {
    const plan = generateTrainingPlan(startDate, raceDate, { fatigueLevel, fiveKTime })
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
  }, [selectedWeek, appState.completedSessions, fatigueLevel, startDate, raceDate, fiveKTime])

  return useMemo(
    () =>
      generateTrainingPlan(startDate, raceDate, {
        missedRuns,
        fatigueLevel,
        paceImprovement,
        fiveKTime,
      }),
    [missedRuns, fatigueLevel, paceImprovement, startDate, raceDate, fiveKTime],
  )
}
