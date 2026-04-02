import { motion } from 'framer-motion'

interface FatigueCheckProps {
  value: string
  onChange: (v: string) => void
}

const OPTIONS = [
  { value: 'normal', label: 'Good', emoji: '⚡', color: 'var(--green)' },
  { value: 'high', label: 'Tired', emoji: '😓', color: 'var(--yellow)' },
  { value: 'very_high', label: 'Exhausted', emoji: '😴', color: 'var(--red)' },
]

export default function FatigueCheck({ value, onChange }: FatigueCheckProps) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 8, fontWeight: 600, letterSpacing: 0.3 }}>
        HOW ARE YOU FEELING?
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {OPTIONS.map((opt) => {
          const active = value === opt.value
          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(opt.value)}
              style={{
                flex: 1,
                padding: '10px 8px',
                borderRadius: 12,
                border: `1.5px solid ${active ? opt.color : 'var(--bg4)'}`,
                background: active ? `${opt.color}18` : 'var(--bg2)',
                color: active ? opt.color : 'var(--text2)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                transition: 'all 0.15s ease',
                minHeight: 60,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 18 }}>{opt.emoji}</span>
              <span>{opt.label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
