import { motion } from 'framer-motion'
import type { Session } from '../data/trainingPlan'
import { TYPE_COLORS, TYPE_LABELS } from '../data/paces'
import { formatTime } from '../utils/paceUtils'

interface SessionCardProps {
  session: Session
  completed: boolean
  index?: number
  onClick: () => void
  onToggle: (e: React.MouseEvent) => void
}

export default function SessionCard({ session, completed, index = 0, onClick, onToggle }: SessionCardProps) {
  const color = TYPE_COLORS[session.type] || '#475569'
  const label = TYPE_LABELS[session.type] || session.type.toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className={`session-card ${completed ? 'completed' : ''}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Icon */}
      <div style={{
        width: 48, height: 48, flexShrink: 0,
        background: `${color}18`,
        borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
        border: `1px solid ${color}30`,
      }}>
        {session.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
            {session.day}
          </span>
          <span
            className="type-badge"
            style={{ background: color }}
          >
            {label}
          </span>
        </div>
        <div style={{
          fontFamily: "'Outfit', sans-serif", fontWeight: 600,
          fontSize: 15, marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {session.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          {session.distance > 0
            ? `${session.distance}km · ${session.pace} · ~${formatTime(session.est)}`
            : session.est > 0
            ? `${session.est} min`
            : 'Full rest'}
        </div>
      </div>

      {/* Check button */}
      {session.type !== 'rest' && (
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onToggle}
          style={{
            width: 30, height: 30, borderRadius: '50%',
            border: completed ? 'none' : '2px solid var(--bg4)',
            background: completed ? 'var(--green)' : 'transparent',
            color: completed ? 'white' : 'transparent',
            fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {completed ? '✓' : ''}
        </motion.button>
      )}
    </motion.div>
  )
}
