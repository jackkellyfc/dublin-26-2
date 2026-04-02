export interface InjuryWarning {
  sign: string
  action: string
}

export const INJURY_WARNINGS: InjuryWarning[] = [
  {
    sign: 'Sharp ankle pain during running',
    action: 'STOP immediately. Ice and rest 2-3 days. If persistent, see physio.',
  },
  {
    sign: 'Pain that worsens as you run',
    action: 'Cut session short. Do not push through pain that escalates.',
  },
  {
    sign: 'Morning stiffness lasting >30 min',
    action: 'Reduce next 2 sessions by 30%. Add extra ankle mobility.',
  },
  {
    sign: 'Pain on outside of shin (peroneal area)',
    action: 'Possible peroneal tendinopathy. Rest 3-5 days. Ice. See physio if not improving.',
  },
  {
    sign: 'Swelling around ankle after runs',
    action: 'Reduce volume 40% for one week. Ice after every run. Elevate.',
  },
  {
    sign: 'Persistent fatigue despite rest days',
    action: 'Take 3 full rest days. Check sleep and nutrition. May be overtraining.',
  },
]

export const ANKLE_PROTOCOL = [
  'Eccentric heel drops 3×12 — proven to strengthen Achilles and ankle complex',
  'Banded ankle eversion — targets peroneals directly',
  'Single-leg balance with eyes closed — improves proprioception',
  'Wall dorsiflexion mobilisations — maintains ankle range of motion',
  'Single-leg calf raises with slow tempo — builds end-range strength',
]

export const VOLUME_RULES = [
  'Never increase weekly distance by more than 10% week-on-week',
  'Every 4th week is a down week (reduce volume by ~15-20%)',
  'Long run never exceeds 35% of total weekly volume',
  'If you miss 2+ runs in a week, next week drops 15%',
  'No more than 3 consecutive days of running without rest',
  'If ankle pain during a run — stop, don\'t push through',
]

export const RECOVERY_PRACTICES = [
  'Sauna: 15-20 min post-run for circulation (not before running)',
  'Cold plunge: 10-12°C for 3-5 min after hard sessions only',
  'Sleep: Aim for 8+ hours — your #1 recovery tool',
  'Nutrition: 1.4-1.6g protein/kg bodyweight for recovery',
  'Hydration: Target pale yellow urine throughout the day',
  'Foam roll calves and peroneals for 2 min/leg daily',
]
