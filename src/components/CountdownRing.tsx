import { motion } from 'framer-motion'
import { weeksUntil, daysUntil } from '../utils/dates'

interface CountdownRingProps {
  raceDate: Date
  startDate: Date
}

export default function CountdownRing({ raceDate, startDate }: CountdownRingProps) {
  const totalDays = Math.ceil((raceDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
  const daysLeft = daysUntil(raceDate)
  const weeksLeft = weeksUntil(raceDate)
  const progress = Math.max(0, Math.min(1, 1 - daysLeft / totalDays))

  const size = 140
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bg4)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#FF8F5E" />
            </linearGradient>
          </defs>
        </svg>
        {/* Centre text */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 1,
        }}>
          <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: 32,
            lineHeight: 1,
            color: 'var(--text)',
          }}>{weeksLeft}</span>
          <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>WEEKS</span>
          <span style={{ fontSize: 10, color: 'var(--text2)' }}>{daysLeft % 7}d left</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>
          DUBLIN MARATHON
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>Oct 26, 2026 · Sub-4:00 Goal</div>
      </div>
    </div>
  )
}
