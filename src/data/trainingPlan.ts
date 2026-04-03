import { paceToSeconds } from '../utils/paceUtils'
import { addDays } from '../utils/dates'
import { computePaces } from './paces'
import type { PaceZones } from './paces'

export interface Session {
  day: string
  type: string
  name: string
  distance: number
  pace: string
  purpose: string
  icon: string
  est: number
  warmup?: string
  cooldown?: string
  fuelling?: string
}

export interface Week {
  weekNumber: number
  phase: string
  phaseColor: string
  startDate: Date
  endDate: Date
  targetKm: number
  isDownWeek: boolean
  sessions: Session[]
}

export interface Phase {
  name: string
  weeks: number
  color: string
}

export interface TrainingPlan {
  weeks: Week[]
  paces: PaceZones
  phases: Phase[]
}

export const PHASES: Phase[] = [
  { name: 'Base Building', weeks: 8, color: '#4ECDC4' },
  { name: 'Endurance', weeks: 8, color: '#FFB347' },
  { name: 'Peak', weeks: 6, color: '#FF6B6B' },
  { name: 'Taper', weeks: 4, color: '#A78BFA' },
]

export const BASE_WEEKLY_KM = [
  15, 18, 20, 17, 22, 25, 28, 24,
  30, 33, 37, 30, 40, 43, 47, 40,
  50, 55, 58, 48, 55, 60,
  45, 35, 28, 22,
]

const generateWeekSessions = (
  weekIdx: number,
  phaseIdx: number,
  targetKm: number,
  paces: PaceZones,
): Session[] => {
  const easy = paceToSeconds(paces.easy)
  const tempo = paceToSeconds(paces.tempo)
  const marathon = paceToSeconds(paces.marathon)
  const interval = paceToSeconds(paces.interval)
  const recovery = paceToSeconds(paces.recovery)

  if (phaseIdx === 0) {
    // BASE BUILDING — 4 running sessions
    const easyDist1 = Math.max(3, Math.round(targetKm * 0.2))
    const easyDist2 = Math.max(3, Math.round(targetKm * 0.2))
    const recDist = Math.max(2, Math.round(targetKm * 0.12))
    // Long run gets the remainder so total === targetKm
    const longDist = Math.max(5, targetKm - easyDist1 - easyDist2 - recDist)

    return [
      { day: 'Mon', type: 'easy', name: 'Easy Run', distance: easyDist1, pace: paces.easyRange, purpose: 'Build aerobic base at conversational effort. Keep heart rate in Zone 2.', icon: '🏃', est: Math.round(easyDist1 * easy / 60) },
      { day: 'Tue', type: 'strength', name: 'Leg Strength + Ankle Work', distance: 0, pace: '-', purpose: 'Squats, lunges, calf raises, ankle stability drills. 40 minutes.', icon: '🏋️', est: 40 },
      { day: 'Wed', type: 'easy', name: 'Easy Run', distance: easyDist2, pace: paces.easyRange, purpose: 'Relaxed aerobic effort. Focus on smooth, efficient form.', icon: '🏃', est: Math.round(easyDist2 * easy / 60) },
      { day: 'Thu', type: 'long', name: 'Long Run', distance: longDist, pace: paces.easyRange, purpose: 'Weekly long effort. Run by feel — slow and steady. Walk breaks OK if needed.', icon: '🏔️', est: Math.round(longDist * easy / 60) },
      { day: 'Fri', type: 'recovery', name: 'Recovery Run', distance: recDist, pace: `${paces.recovery}+`, purpose: 'Very easy shake-out. Keep this genuinely slow. Less than 30 minutes.', icon: '🚶', est: Math.round(recDist * recovery / 60) },
      { day: 'Sat', type: 'strength', name: 'Ankle & Mobility', distance: 0, pace: '-', purpose: 'Ankle strengthening circuit, hip mobility, foam rolling. 30 minutes.', icon: '🧘', est: 30 },
      { day: 'Sun', type: 'rest', name: 'Rest Day', distance: 0, pace: '-', purpose: 'Full rest. Sauna/cold plunge recovery. No running.', icon: '😴', est: 0 },
    ]
  }

  if (phaseIdx === 1) {
    // ENDURANCE — 5 running sessions
    const tempoDist = Math.max(5, Math.round(targetKm * 0.18))
    const easyDist1 = Math.max(4, Math.round(targetKm * 0.18))
    const easyDist2 = Math.max(4, Math.round(targetKm * 0.15))
    const recDist = Math.max(3, Math.round(targetKm * 0.1))
    const longDist = Math.max(8, targetKm - tempoDist - easyDist1 - easyDist2 - recDist)

    return [
      { day: 'Mon', type: 'easy', name: 'Easy Run', distance: easyDist1, pace: paces.easyRange, purpose: 'Aerobic maintenance. Smooth and relaxed.', icon: '🏃', est: Math.round(easyDist1 * easy / 60) },
      { day: 'Tue', type: 'strength', name: 'Leg Strength + Ankle Work', distance: 0, pace: '-', purpose: 'Heavier squats, Bulgarian split squats, single-leg calf raises, banded ankle work.', icon: '🏋️', est: 45 },
      { day: 'Wed', type: 'tempo', name: 'Tempo Run', distance: tempoDist, pace: paces.tempoRange, purpose: `${Math.round(tempoDist * 0.25)}km warm-up, ${Math.round(tempoDist * 0.5)}km at tempo, ${Math.round(tempoDist * 0.25)}km cool-down. Controlled discomfort.`, icon: '⚡', est: Math.round(tempoDist * tempo / 60) },
      { day: 'Thu', type: 'long', name: 'Long Run', distance: longDist, pace: paces.easyRange, purpose: `Build to ${longDist}km. Even pacing throughout. Practice fuelling every 30 min after 60 min.`, icon: '🏔️', est: Math.round(longDist * easy / 60) },
      { day: 'Fri', type: 'recovery', name: 'Recovery Run', distance: recDist, pace: `${paces.recovery}+`, purpose: 'Very easy. Flush legs out. Under 30 minutes.', icon: '🚶', est: Math.round(recDist * recovery / 60) },
      { day: 'Sat', type: 'easy', name: 'Easy Run + Strides', distance: easyDist2, pace: paces.easyRange, purpose: 'Easy run with 6x20s strides at the end. Full recovery between strides.', icon: '🏃', est: Math.round(easyDist2 * easy / 60) },
      { day: 'Sun', type: 'rest', name: 'Rest Day', distance: 0, pace: '-', purpose: 'Full rest. Recovery protocols. No running.', icon: '😴', est: 0 },
    ]
  }

  if (phaseIdx === 2) {
    // PEAK — 5 running sessions
    const intervalDist = Math.max(7, Math.round(targetKm * 0.14))
    const easyDist = Math.max(6, Math.round(targetKm * 0.18))
    const mpDist = Math.max(6, Math.round(targetKm * 0.12))
    const recDist = Math.max(3, Math.round(targetKm * 0.08))
    const longDist = Math.max(14, targetKm - intervalDist - easyDist - mpDist - recDist)

    return [
      { day: 'Mon', type: 'easy', name: 'Easy Run', distance: easyDist, pace: paces.easyRange, purpose: 'Aerobic maintenance. Keep it genuinely easy after the weekend.', icon: '🏃', est: Math.round(easyDist * easy / 60) },
      { day: 'Tue', type: 'intervals', name: 'Intervals', distance: intervalDist, pace: paces.intervalRange, purpose: `Warm up 2km, then 5x1km at ${paces.interval} with 90s jog recovery, cool down 2km.`, icon: '🔥', est: Math.round(intervalDist * interval / 60) + 10 },
      { day: 'Wed', type: 'tempo', name: 'Marathon Pace', distance: mpDist, pace: paces.marathonRange, purpose: `2km easy, ${Math.max(2, mpDist - 4)}km at marathon pace (${paces.marathon}), 2km easy. Race rehearsal.`, icon: '🎯', est: Math.round(mpDist * marathon / 60) },
      { day: 'Thu', type: 'long', name: 'Long Run', distance: longDist, pace: `${paces.easyRange} / last 4km at ${paces.marathon}`, purpose: `${longDist}km with final 4km at marathon pace. Practice negative splitting and race-day fuelling.`, icon: '🏔️', est: Math.round(longDist * easy / 60) },
      { day: 'Fri', type: 'recovery', name: 'Recovery Run', distance: recDist, pace: `${paces.recovery}+`, purpose: 'Shake-out. Truly easy. Prioritise sleep and nutrition today.', icon: '🚶', est: Math.round(recDist * recovery / 60) },
      { day: 'Sat', type: 'strength', name: 'Maintenance Strength', distance: 0, pace: '-', purpose: 'Lighter weights, higher reps. Ankle stability. Mobility work.', icon: '🏋️', est: 35 },
      { day: 'Sun', type: 'rest', name: 'Rest Day', distance: 0, pace: '-', purpose: 'Full rest. Recovery protocols.', icon: '😴', est: 0 },
    ]
  }

  // TAPER (phaseIdx === 3) — 4 running sessions
  const easyDist1 = Math.max(4, Math.round(targetKm * 0.25))
  const easyDist2 = Math.max(3, Math.round(targetKm * 0.2))
  const recDist = Math.max(2, Math.round(targetKm * 0.15))
  const longDist = Math.max(4, targetKm - easyDist1 - easyDist2 - recDist)

  return [
    { day: 'Mon', type: 'easy', name: 'Easy Run', distance: easyDist1, pace: paces.easyRange, purpose: 'Keep legs turning over. You\'ll feel restless — that\'s good.', icon: '🏃', est: Math.round(easyDist1 * easy / 60) },
    { day: 'Tue', type: 'rest', name: 'Rest / Walk', distance: 0, pace: '-', purpose: 'Light walk or full rest. Trust the taper.', icon: '🚶', est: 0 },
    { day: 'Wed', type: 'easy', name: 'Easy + 4xStrides', distance: easyDist2, pace: paces.easyRange, purpose: 'Short easy run with a few strides to keep neuromuscular pathways sharp.', icon: '🏃', est: Math.round(easyDist2 * easy / 60) },
    { day: 'Thu', type: 'long', name: weekIdx >= 24 ? 'Shakeout' : 'Medium Long Run', distance: longDist, pace: paces.easyRange, purpose: weekIdx >= 24 ? 'Just a short easy jog. You\'re ready.' : 'Shorter long run. Easy effort. Focus on form.', icon: '🏔️', est: Math.round(longDist * easy / 60) },
    { day: 'Fri', type: 'recovery', name: 'Recovery Run', distance: recDist, pace: `${paces.recovery}+`, purpose: 'Very short and slow. Pre-hydrate well.', icon: '🚶', est: Math.round(recDist * recovery / 60) },
    { day: 'Sat', type: 'rest', name: 'Rest / Mobility', distance: 0, pace: '-', purpose: 'Light mobility only. Prepare race kit and nutrition plan.', icon: '🧘', est: 20 },
    { day: 'Sun', type: 'rest', name: 'Rest Day', distance: 0, pace: '-', purpose: 'Full rest.', icon: '😴', est: 0 },
  ]
}

export interface PlanAdjustments {
  missedRuns?: number
  fatigueLevel?: string
  paceImprovement?: number
  fiveKTime?: string
}

export const generateTrainingPlan = (
  startDate: Date,
  raceDate: Date,
  adjustments: PlanAdjustments = {},
): TrainingPlan => {
  const { missedRuns = 0, fatigueLevel = 'normal', paceImprovement = 0, fiveKTime } = adjustments

  const paces = computePaces(paceImprovement, fiveKTime)

  let volumeMultiplier = 1
  if (missedRuns >= 2) volumeMultiplier *= 0.85
  if (fatigueLevel === 'high') volumeMultiplier *= 0.9
  if (fatigueLevel === 'very_high') volumeMultiplier *= 0.8
  volumeMultiplier = Math.max(0.6, volumeMultiplier)

  const totalWeeks = Math.ceil((raceDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
  const weeks: Week[] = []
  let weekStart = new Date(startDate)

  for (let w = 0; w < Math.min(totalWeeks, 26); w++) {
    let phaseIdx = 0
    let cumulative = 0
    for (let p = 0; p < PHASES.length; p++) {
      if (w < cumulative + PHASES[p].weeks) {
        phaseIdx = p
        break
      }
      cumulative += PHASES[p].weeks
    }

    const phase = PHASES[phaseIdx]
    const targetKm = Math.round((BASE_WEEKLY_KM[w] || 22) * volumeMultiplier)
    const isDownWeek = (w + 1) % 4 === 0

    const sessions = generateWeekSessions(w, phaseIdx, targetKm, paces)

    const weekEnd = addDays(weekStart, 6)

    weeks.push({
      weekNumber: w + 1,
      phase: phase.name,
      phaseColor: phase.color,
      startDate: new Date(weekStart),
      endDate: weekEnd,
      targetKm,
      isDownWeek,
      sessions,
    })

    weekStart = addDays(weekStart, 7)
  }

  return { weeks, paces, phases: PHASES }
}
