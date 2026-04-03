import { useRef, useCallback, useState } from 'react'

export interface AudioCoachConfig {
  announceKmSplits: boolean
  announcePaceAlerts: boolean
  announceEncouragement: boolean
  targetPace?: string // mm:ss per km
  voice: 'male' | 'female'
  volume: number // 0-1
}

export const DEFAULT_COACH_CONFIG: AudioCoachConfig = {
  announceKmSplits: true,
  announcePaceAlerts: true,
  announceEncouragement: true,
  voice: 'female',
  volume: 0.9,
}

const ENCOURAGEMENTS = [
  "You're doing amazing, keep it up!",
  "Strong pace! Stay steady.",
  "Looking great out there!",
  "You've got this! Keep pushing.",
  "Brilliant running, stay focused.",
  "Feel the rhythm, own the road!",
  "Every step gets you closer to Dublin!",
  "You're building marathon strength right now.",
  "That's the pace of a sub-4 marathoner!",
  "Champion mentality, keep going!",
]

function parsePace(pace: string): number {
  const [m, s] = pace.split(':').map(Number)
  return m * 60 + (s || 0)
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  if (m === 0) return `${s} seconds`
  if (s === 0) return `${m} minute${m > 1 ? 's' : ''}`
  return `${m} minute${m > 1 ? 's' : ''} ${s} second${s > 1 ? 's' : ''}`
}

export function useAudioCoach() {
  const [config, setConfig] = useState<AudioCoachConfig>(DEFAULT_COACH_CONFIG)
  const [enabled, setEnabled] = useState(true)
  const lastKmAnnounced = useRef(0)
  const lastEncouragementTime = useRef(0)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  const getSynth = useCallback(() => {
    if (!synthRef.current && typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
    }
    return synthRef.current
  }, [])

  const speak = useCallback((text: string, priority = false) => {
    const synth = getSynth()
    if (!synth || !enabled) return

    if (priority) {
      synth.cancel() // interrupt current speech for priority announcements
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.volume = config.volume
    utterance.rate = 1.0
    utterance.pitch = config.voice === 'female' ? 1.1 : 0.9

    // Try to pick a matching voice
    const voices = synth.getVoices()
    const preferred = voices.find(v =>
      v.lang.startsWith('en') &&
      (config.voice === 'female' ? v.name.toLowerCase().includes('female') || v.name.includes('Samantha') || v.name.includes('Karen') : v.name.toLowerCase().includes('male') || v.name.includes('Daniel') || v.name.includes('Alex'))
    ) || voices.find(v => v.lang.startsWith('en'))

    if (preferred) utterance.voice = preferred

    synth.speak(utterance)
  }, [getSynth, config.volume, config.voice, enabled])

  const announceStart = useCallback(() => {
    speak("Let's go! Run started. Good luck out there!", true)
    lastKmAnnounced.current = 0
    lastEncouragementTime.current = Date.now()
  }, [speak])

  const announcePause = useCallback(() => {
    speak("Run paused. Take a breather.")
  }, [speak])

  const announceResume = useCallback(() => {
    speak("Let's go again! Run resumed.")
  }, [speak])

  const announceKmSplit = useCallback((km: number, splitTime: number, totalDistance: number, totalElapsed: number, avgPace: string) => {
    if (!config.announceKmSplits) return
    if (km <= lastKmAnnounced.current) return
    lastKmAnnounced.current = km

    const splitPace = formatDuration(splitTime)
    let msg = `Kilometre ${km} complete. Split time: ${splitPace}.`

    if (avgPace !== '--:--') {
      const [m, s] = avgPace.split(':')
      msg += ` Average pace: ${m} minutes ${s} per K.`
    }

    msg += ` Total distance: ${totalDistance.toFixed(1)} K.`
    msg += ` Total time: ${formatDuration(totalElapsed)}.`

    // Pace alert
    if (config.announcePaceAlerts && config.targetPace) {
      const targetSec = parsePace(config.targetPace)
      const currentSec = splitTime
      if (currentSec > targetSec + 15) {
        msg += " You're falling behind target pace. Try to pick it up!"
      } else if (currentSec < targetSec - 10) {
        msg += " You're ahead of target pace. Great work, but watch your energy."
      } else {
        msg += " Right on target pace. Perfect!"
      }
    }

    speak(msg, true)
  }, [config.announceKmSplits, config.announcePaceAlerts, config.targetPace, speak])

  const maybeEncourage = useCallback((_elapsed: number) => {
    if (!config.announceEncouragement) return
    const now = Date.now()
    // Encourage every ~5 minutes
    if (now - lastEncouragementTime.current > 300000) {
      lastEncouragementTime.current = now
      const msg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
      speak(msg)
    }
  }, [config.announceEncouragement, speak])

  const announceFinish = useCallback((distance: number, elapsed: number, avgPace: string) => {
    const distStr = distance.toFixed(2)
    const timeStr = formatDuration(elapsed)
    speak(
      `Run complete! You covered ${distStr} kilometres in ${timeStr}. Average pace: ${avgPace.replace(':', ' minutes ')} per K. Great job out there!`,
      true
    )
  }, [speak])

  const stopSpeaking = useCallback(() => {
    const synth = getSynth()
    if (synth) synth.cancel()
  }, [getSynth])

  return {
    config,
    setConfig,
    enabled,
    setEnabled,
    speak,
    announceStart,
    announcePause,
    announceResume,
    announceKmSplit,
    maybeEncourage,
    announceFinish,
    stopSpeaking,
  }
}
