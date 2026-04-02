import { useRef, useEffect } from 'react'
import type { Week } from '../data/trainingPlan'

interface WeekSelectorProps {
  weeks: Week[]
  selectedWeek: number
  onSelect: (idx: number) => void
}

export default function WeekSelector({ weeks, selectedWeek, onSelect }: WeekSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      const pill = scrollRef.current.children[selectedWeek] as HTMLElement
      if (pill) {
        pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [selectedWeek])

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex', gap: 6,
        overflowX: 'auto', paddingBottom: 8,
        scrollbarWidth: 'none', msOverflowStyle: 'none' as const,
      }}
    >
      {weeks.map((w, i) => {
        const active = selectedWeek === i
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              borderRadius: 20,
              background: active ? 'var(--bg3)' : 'var(--bg2)',
              border: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
              color: active ? 'var(--text)' : 'var(--text2)',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              fontFamily: "'DM Sans', sans-serif",
              display: 'flex', alignItems: 'center', gap: 5,
              minHeight: 36,
              cursor: 'pointer',
            }}
          >
            <span
              className="phase-dot"
              style={{ background: w.phaseColor }}
            />
            W{w.weekNumber}
          </button>
        )
      })}
    </div>
  )
}
