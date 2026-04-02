export interface Exercise {
  name: string
  sets: string
  notes: string
}

export interface Routine {
  id: string
  name: string
  duration: string
  frequency: string
  exercises: Exercise[]
}

export const STRENGTH_ROUTINES: Record<string, Routine> = {
  full: {
    id: 'full',
    name: 'Leg Strength + Ankle Stability',
    duration: '40-45 min',
    frequency: 'Twice per week (Tue + Thu-adjacent)',
    exercises: [
      { name: 'Barbell Back Squat', sets: '3×10', notes: 'Moderate weight, full depth. Control the eccentric.' },
      { name: 'Bulgarian Split Squat', sets: '3×8/leg', notes: 'Hold dumbbells. Drive through front heel.' },
      { name: 'Romanian Deadlift', sets: '3×10', notes: 'Feel hamstring stretch. Hinge at hips.' },
      { name: 'Single-Leg Calf Raise', sets: '3×15/leg', notes: 'Slow 3-count up, 3-count down. Full range.' },
      { name: 'Banded Ankle Eversion', sets: '3×15/side', notes: 'Loop band around forefoot. Turn foot outward against resistance.' },
      { name: 'Single-Leg Balance (Eyes Closed)', sets: '3×30s/leg', notes: 'Stand on wobble surface if available.' },
      { name: 'Banded Clamshells', sets: '3×15/side', notes: 'Keep feet together, open knees against band.' },
      { name: 'Eccentric Heel Drops', sets: '3×12/leg', notes: 'Off step edge. Slow 5-count lowering. Key for ankle/Achilles health.' },
    ],
  },
  mobility: {
    id: 'mobility',
    name: 'Ankle & Mobility Session',
    duration: '25-30 min',
    frequency: 'Recovery days / Saturdays',
    exercises: [
      { name: 'Ankle Circles', sets: '2×20/direction/foot', notes: 'Full range of motion. Slow and deliberate.' },
      { name: 'Wall Ankle Dorsiflexion', sets: '3×30s/leg', notes: 'Knee over toes toward wall. Feel calf stretch.' },
      { name: 'Banded Ankle Distractions', sets: '2×30s/leg', notes: 'Band around ankle joint, lean forward.' },
      { name: 'Single-Leg RDL (Bodyweight)', sets: '3×10/leg', notes: 'Slow. Focus on balance and hip hinge.' },
      { name: 'Foam Roll Calves + Peroneals', sets: '2 min/leg', notes: 'Work both sides of lower leg thoroughly.' },
      { name: '90/90 Hip Switches', sets: '2×10', notes: 'Smooth transitions. Breathe into each position.' },
      { name: 'Pigeon Pose Hold', sets: '2×45s/side', notes: 'Relax into stretch. Don\'t force it.' },
    ],
  },
}

export const WARMUP = [
  '5 min walk progressing to light jog',
  'Leg swings (forward/back) — 10 each leg',
  'Leg swings (side to side) — 10 each leg',
  'Walking lunges — 8 each leg',
  'High knees — 20 steps',
  'A-skips — 15m × 2',
]

export const COOLDOWN = [
  '5 min walk, gradually slowing pace',
  'Standing quad stretch — 30s each',
  'Standing calf stretch — 30s each',
  'Hip flexor stretch — 30s each',
  'Ankle circles — 10 each direction',
]
