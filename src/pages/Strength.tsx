import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ExerciseCard from '../components/ExerciseCard'
import { STRENGTH_ROUTINES, WARMUP, COOLDOWN } from '../data/strengthRoutines'
import { INJURY_WARNINGS, ANKLE_PROTOCOL } from '../data/injuryWarnings'

export default function Strength() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggle = (id: string) => setExpandedSection(prev => prev === id ? null : id)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      style={{ padding: '20px 20px 24px' }}
    >
      <h2 className="font-heading" style={{
        fontWeight: 800, fontSize: 22, margin: '0 0 4px', color: 'var(--text)',
        letterSpacing: -0.5,
      }}>
        Strength & Mobility
      </h2>
      <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 20 }}>
        Ankle-focused routines for marathon prep
      </p>

      {/* Routines */}
      {Object.values(STRENGTH_ROUTINES).map((routine) => (
        <div key={routine.id} className="glass-card" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 className="font-heading" style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', margin: 0 }}>
                {routine.name}
              </h3>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>
                {routine.duration} · {routine.frequency}
              </div>
            </div>
            <div style={{
              background: 'var(--blue)', color: 'white',
              padding: '4px 10px', borderRadius: 8,
              fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
            }}>
              {routine.exercises.length} EXERCISES
            </div>
          </div>
          {routine.exercises.map((ex, i) => (
            <ExerciseCard key={ex.name} name={ex.name} sets={ex.sets} notes={ex.notes} index={i} />
          ))}
        </div>
      ))}

      {/* Warm-up */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => toggle('warmup')}
        className="glass-card"
        style={{
          width: '100%', padding: 16, marginBottom: 8,
          border: 'none', textAlign: 'left',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(20, 24, 32, 0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
        }}
      >
        <span className="font-heading" style={{ fontWeight: 600, fontSize: 14 }}>
          Warm-Up Protocol
        </span>
        <span style={{ color: 'var(--green)', fontSize: 18, transform: expandedSection === 'warmup' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▾
        </span>
      </motion.button>
      <AnimatePresence>
        {expandedSection === 'warmup' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: 8 }}
          >
            <div style={{ padding: '0 4px 8px' }}>
              {WARMUP.map((item, i) => (
                <div key={i} className="list-item">{item}</div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cool-down */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => toggle('cooldown')}
        className="glass-card"
        style={{
          width: '100%', padding: 16, marginBottom: 8,
          border: 'none', textAlign: 'left',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(20, 24, 32, 0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
        }}
      >
        <span className="font-heading" style={{ fontWeight: 600, fontSize: 14 }}>
          Cool-Down Protocol
        </span>
        <span style={{ color: 'var(--purple)', fontSize: 18, transform: expandedSection === 'cooldown' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▾
        </span>
      </motion.button>
      <AnimatePresence>
        {expandedSection === 'cooldown' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: 8 }}
          >
            <div style={{ padding: '0 4px 8px' }}>
              {COOLDOWN.map((item, i) => (
                <div key={i} className="list-item">{item}</div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ankle Protocol */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => toggle('ankle')}
        className="glass-card"
        style={{
          width: '100%', padding: 16, marginBottom: 14,
          border: 'none', textAlign: 'left',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(20, 24, 32, 0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: 'var(--radius)',
          color: 'var(--text)',
        }}
      >
        <span className="font-heading" style={{ fontWeight: 600, fontSize: 14 }}>
          Ankle Conditioning Protocol
        </span>
        <span style={{ color: 'var(--accent)', fontSize: 18, transform: expandedSection === 'ankle' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▾
        </span>
      </motion.button>
      <AnimatePresence>
        {expandedSection === 'ankle' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: 14 }}
          >
            <div style={{ padding: '0 4px 8px' }}>
              {ANKLE_PROTOCOL.map((item, i) => (
                <div key={i} className="list-item">{item}</div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Injury warnings */}
      <div style={{ marginTop: 8 }}>
        <div style={{
          fontSize: 11, color: 'var(--red)', fontWeight: 700, marginBottom: 10,
          letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 14 }}>⚠️</span> INJURY WARNING SIGNS
        </div>
        {INJURY_WARNINGS.map((w, i) => (
          <motion.div
            key={i}
            className="warning-card"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div style={{
              fontFamily: "'Outfit', sans-serif", fontWeight: 600,
              fontSize: 13, color: 'var(--text)', marginBottom: 4,
            }}>
              {w.sign}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              {w.action}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
