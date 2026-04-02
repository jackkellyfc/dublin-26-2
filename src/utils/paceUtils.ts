export const paceToSeconds = (pace: string): number => {
  const [m, s] = pace.split(':').map(Number)
  return m * 60 + s
}

export const secondsToPace = (sec: number): string => {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const formatTime = (mins: number): string => {
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export const formatPace = (pace: string): string => `${pace}/km`
