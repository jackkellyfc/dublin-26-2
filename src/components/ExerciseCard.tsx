import { motion } from 'framer-motion'

interface ExerciseCardProps {
  name: string
  sets: string
  notes: string
  index?: number
}

export default function ExerciseCard({ name, sets, notes, index = 0 }: ExerciseCardProps) {
  return (
    <motion.div
      className="exercise-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 600, fontSize: 14, color: 'var(--text)',
        }}>
          {name}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 700,
          color: 'var(--accent)', fontFamily: "'Outfit', sans-serif",
        }}>
          {sets}
        </span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, margin: 0 }}>{notes}</p>
    </motion.div>
  )
}
