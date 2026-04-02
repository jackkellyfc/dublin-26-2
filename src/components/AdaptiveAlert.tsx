import { motion } from 'framer-motion'

interface AdaptiveAlertProps {
  type: 'missed' | 'tired' | 'exhausted' | 'improved'
  missedCount?: number
}

export default function AdaptiveAlert({ type, missedCount = 0 }: AdaptiveAlertProps) {
  const configs = {
    missed: {
      icon: '⚡',
      title: 'Plan Adjusted',
      color: 'var(--accent)',
      text: `You've missed ${missedCount} sessions this week. Next week's volume has been reduced by 15% to keep you on track safely.`,
    },
    tired: {
      icon: '😓',
      title: 'Fatigue Detected',
      color: 'var(--yellow)',
      text: 'Feeling tired — this week\'s targets reduced by 10%. Focus on easy effort and recovery.',
    },
    exhausted: {
      icon: '😴',
      title: 'Exhaustion Flagged',
      color: 'var(--red)',
      text: 'Targets cut by 20%. Consider an extra rest day. Prioritise sleep and nutrition above all.',
    },
    improved: {
      icon: '🚀',
      title: 'Paces Improved!',
      color: 'var(--green)',
      text: 'Great consistency! Your target paces have been updated by 5 sec/km.',
    },
  }

  const c = configs[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="adaptive-card"
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: 6,
      }}>
        <span style={{ fontSize: 16 }}>{c.icon}</span>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 600, fontSize: 13, color: c.color,
        }}>{c.title}</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{c.text}</p>
    </motion.div>
  )
}
