import { motion } from 'framer-motion'

interface MileageBarProps {
  completed: number
  target: number
  label?: string
}

export default function MileageBar({ completed, target, label = 'Weekly Progress' }: MileageBarProps) {
  const pct = target > 0 ? Math.min(100, (completed / target) * 100) : 0

  return (
    <div style={{
      background: 'var(--bg2)',
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: 'var(--text2)', marginBottom: 8,
      }}>
        <span>{label}</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>
          {completed} / {target} km
        </span>
      </div>
      <div style={{
        height: 6, background: 'var(--bg4)',
        borderRadius: 3, overflow: 'hidden',
      }}>
        <motion.div
          className="mileage-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 5 }}>
        <span style={{ fontSize: 10, color: 'var(--text2)' }}>{Math.round(pct)}% complete</span>
      </div>
    </div>
  )
}
