import { paceToSeconds, secondsToPace } from '../utils/paceUtils'

export interface PaceZones {
  easy: string
  easyRange: string
  tempo: string
  tempoRange: string
  marathon: string
  marathonRange: string
  interval: string
  intervalRange: string
  recovery: string
}

// Default base paces derived from 5K of 24:44
export const DEFAULT_5K_TIME = '24:44'

/**
 * Calculate all pace zones from a 5K time using Jack Daniels-style ratios.
 * The 5K pace is the anchor — all other zones derive from it.
 */
export const computePacesFrom5K = (fiveKTime: string): { easy: string; tempo: string; marathon: string; interval: string } => {
  // 5K time in seconds (total)
  const parts = fiveKTime.split(':').map(Number)
  let totalSec: number
  if (parts.length === 3) {
    totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    totalSec = parts[0] * 60 + parts[1]
  } else {
    totalSec = 24 * 60 + 44 // default
  }

  const fiveKPace = totalSec / 5 // sec per km

  return {
    easy: secondsToPace(Math.round(fiveKPace * 1.32)),       // ~32% slower than 5K pace
    tempo: secondsToPace(Math.round(fiveKPace * 1.13)),      // ~13% slower
    marathon: secondsToPace(Math.round(fiveKPace * 1.15)),   // ~15% slower
    interval: secondsToPace(Math.round(fiveKPace * 1.02)),   // ~2% slower (close to 5K pace)
  }
}

export const computePaces = (paceImprovement = 0, fiveKTime?: string): PaceZones => {
  const base = fiveKTime ? computePacesFrom5K(fiveKTime) : {
    easy: '6:30',
    tempo: '5:35',
    marathon: '5:40',
    interval: '5:05',
  }

  const imp = paceImprovement * 5
  const easySec = paceToSeconds(base.easy) - imp
  const tempoSec = paceToSeconds(base.tempo) - imp
  const marathonSec = paceToSeconds(base.marathon) - imp
  const intervalSec = paceToSeconds(base.interval) - imp

  return {
    easy: secondsToPace(easySec),
    easyRange: `${secondsToPace(easySec - 10)}-${secondsToPace(easySec + 15)}`,
    tempo: secondsToPace(tempoSec),
    tempoRange: `${secondsToPace(tempoSec - 5)}-${secondsToPace(tempoSec + 5)}`,
    marathon: secondsToPace(marathonSec),
    marathonRange: `${secondsToPace(marathonSec - 5)}-${secondsToPace(marathonSec + 10)}`,
    interval: secondsToPace(intervalSec),
    intervalRange: `${secondsToPace(intervalSec - 5)}-${secondsToPace(intervalSec + 5)}`,
    recovery: secondsToPace(easySec + 25),
  }
}

export const TYPE_COLORS: Record<string, string> = {
  easy: '#4ECDC4',
  long: '#FFB347',
  tempo: '#FF6B6B',
  intervals: '#FF6B6B',
  recovery: '#A78BFA',
  strength: '#60A5FA',
  rest: '#475569',
}

export const TYPE_LABELS: Record<string, string> = {
  easy: 'EASY',
  long: 'LONG',
  tempo: 'TEMPO',
  intervals: 'SPEED',
  recovery: 'RECOVERY',
  strength: 'STRENGTH',
  rest: 'REST',
}
