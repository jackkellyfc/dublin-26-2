import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Session } from '../data/trainingPlan'
import { formatTime } from '../utils/paceUtils'
import { getRandomCelebration } from '../data/quotes'

interface CelebrationModalProps {
  session: Session | null
  totalCompleted: number
  totalKm: number
  onClose: () => void
}

function Confetti({ canvas }: { canvas: HTMLCanvasElement | null }) {
  const animRef = useRef<number>(0)

  useEffect(() => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const colors = ['#FF6B35', '#FF8F5E', '#4ECDC4', '#FFB347', '#A78BFA', '#FF6B6B', '#60A5FA']
    const particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; rotation: number; vr: number }[] = []

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: canvas.height * 0.4,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 15 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let active = false

      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.3
        p.vx *= 0.99
        p.rotation += p.vr

        if (p.y < canvas.height + 20) active = true

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      })

      if (active) {
        animRef.current = requestAnimationFrame(animate)
      }
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [canvas])

  return null
}

export default function CelebrationModal({ session, totalCompleted, totalKm, onClose }: CelebrationModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  if (!session) return null

  const message = getRandomCelebration()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'linear-gradient(180deg, rgba(12,15,20,0.97) 0%, rgba(255,107,53,0.15) 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
        onClick={onClose}
      >
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
        <Confetti canvas={canvasRef.current} />

        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--green), #38b2ac)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48, color: 'white', marginBottom: 24,
            boxShadow: '0 0 40px rgba(78, 205, 196, 0.4)',
          }}
        >
          ✓
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-heading gradient-text"
          style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px', textAlign: 'center' }}
        >
          SESSION COMPLETE!
        </motion.h2>

        {/* Motivation */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{ fontSize: 16, color: 'var(--text)', textAlign: 'center', marginBottom: 24, fontWeight: 500 }}
        >
          {message}
        </motion.p>

        {/* Session summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card"
          style={{ padding: 20, width: '100%', maxWidth: 320, marginBottom: 20 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 28 }}>{session.icon}</span>
            <div className="font-heading" style={{ fontWeight: 700, fontSize: 17, marginTop: 4 }}>
              {session.name}
            </div>
          </div>
          {session.distance > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <div className="font-heading" style={{ fontWeight: 700, fontSize: 20, color: 'var(--accent)' }}>
                  {session.distance}km
                </div>
                <div style={{ fontSize: 10, color: 'var(--text2)' }}>DISTANCE</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="font-heading" style={{ fontWeight: 700, fontSize: 20, color: 'var(--green)' }}>
                  {session.pace}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text2)' }}>PACE</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="font-heading" style={{ fontWeight: 700, fontSize: 20, color: 'var(--purple)' }}>
                  {formatTime(session.est)}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text2)' }}>TIME</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Lifetime stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ display: 'flex', gap: 20, marginBottom: 32 }}
        >
          <div style={{ textAlign: 'center' }}>
            <div className="font-heading" style={{ fontWeight: 800, fontSize: 24, color: 'var(--accent)' }}>
              {totalCompleted}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text2)' }}>SESSIONS</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="font-heading" style={{ fontWeight: 800, fontSize: 24, color: 'var(--green)' }}>
              {totalKm}km
            </div>
            <div style={{ fontSize: 10, color: 'var(--text2)' }}>TOTAL</div>
          </div>
        </motion.div>

        {/* Done button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          whileTap={{ scale: 0.96 }}
          onClick={onClose}
          style={{
            padding: '16px 48px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, var(--accent), #FF4500)',
            color: 'white', fontFamily: "'Outfit', sans-serif",
            fontWeight: 700, fontSize: 16, letterSpacing: 0.5,
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(255,107,53,0.3)',
          }}
        >
          LET'S GO
        </motion.button>
      </motion.div>
    </AnimatePresence>
  )
}
