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

export const BASE_PACES = {
  easy: '6:30',
  tempo: '5:35',
  marathon: '5:40',
  interval: '5:05',
}

export const computePaces = (paceImprovement = 0): PaceZones => {
  const imp = paceImprovement * 5
  const easySec = paceToSeconds(BASE_PACES.easy) - imp
  const tempoSec = paceToSeconds(BASE_PACES.tempo) - imp
  const marathonSec = paceToSeconds(BASE_PACES.marathon) - imp
  const intervalSec = paceToSeconds(BASE_PACES.interval) - imp

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
