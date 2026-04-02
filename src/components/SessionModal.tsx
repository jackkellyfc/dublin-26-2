import { motion, AnimatePresence } from 'framer-motion'
import type { Session } from '../data/trainingPlan'
import { TYPE_COLORS, TYPE_LABELS } from '../data/paces'
import { formatTime } from '../utils/paceUtils'
import { WARMUP, COOLDOWN } from '../data/strengthRoutines'

interface SessionModalProps {
  session: Session | null
  completed: boolean
  onClose: () => void
  onToggle: () => void
}

export default function SessionModal({ session, completed, onClose, onToggle }: SessionModalProps) {
  if (!session) return null

  const color = TYPE_COLORS[session.type] || '#475569'
  const label = TYPE_LABELS[session.type] || session.type.toUpperCase()
  const isRunning = ['easy', 'long', 'tempo', 'intervals', 'recovery'].includes(session.type)
  const isLong = session.type === 'long' && session.distance >= 15

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-handle" />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56,
              background: `${color}18`,
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
              border: `1px solid ${color}30`,
            }}>
              {session.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="type-badge" style={{ background: color }}>{label}</span>
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>{session.day}</span>
              </div>
              <h3 style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700, fontSize: 20, margin: 0,
                color: 'var(--text)',
              }}>
                {session.name}
              </h3>
            </div>
          </div>

          {/* Stats row */}
          {session.distance > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10, marginBottom: 20,
            }}>
              <div className="stat-card">
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>
                  {session.distance}<span style={{ fontSize: 12, color: 'var(--text2)' }}>km</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>DISTANCE</div>
              </div>
              <div className="stat-card">
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>
                  {session.pace}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>PACE</div>
              </div>
              <div className="stat-card">
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>
                  {formatTime(session.est)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2 }}>EST. TIME</div>
              </div>
            </div>
          )}

          {/* Purpose */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600, fontSize: 13, color: 'var(--accent)',
              marginBottom: 6, letterSpacing: 0.5,
            }}>PURPOSE</h4>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>{session.purpose}</p>
          </div>

          {/* Warm-up */}
          {isRunning && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600, fontSize: 13, color: 'var(--green)',
                marginBottom: 8, letterSpacing: 0.5,
              }}>WARM-UP</h4>
              {WARMUP.map((item, i) => (
                <div key={i} className="list-item">{item}</div>
              ))}
            </div>
          )}

          {/* Cool-down */}
          {isRunning && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600, fontSize: 13, color: 'var(--purple)',
                marginBottom: 8, letterSpacing: 0.5,
              }}>COOL-DOWN</h4>
              {COOLDOWN.map((item, i) => (
                <div key={i} className="list-item">{item}</div>
              ))}
            </div>
          )}

          {/* Fuelling */}
          {isLong && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 600, fontSize: 13, color: 'var(--yellow)',
                marginBottom: 8, letterSpacing: 0.5,
              }}>FUELLING</h4>
              <div className="list-item">Take a gel or energy chews every 30 min after the first hour</div>
              <div className="list-item">Sip water every 15-20 min — don't wait until thirsty</div>
              <div className="list-item">Practice race-day nutrition on every long run</div>
            </div>
          )}

          {/* Mark complete */}
          {session.type !== 'rest' && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onToggle}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 14,
                border: 'none',
                background: completed
                  ? 'var(--bg4)'
                  : 'linear-gradient(135deg, var(--accent), #FF4500)',
                color: 'white',
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                letterSpacing: 0.5,
                cursor: 'pointer',
              }}
            >
              {completed ? 'MARK INCOMPLETE' : 'MARK COMPLETE'}
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
