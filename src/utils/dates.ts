const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export const getMonday = (d: Date): Date => {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

export const formatDate = (d: Date): string =>
  `${d.getDate()} ${MONTHS[d.getMonth()]}`

export const formatDateFull = (d: Date): string =>
  `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`

export const formatDateISO = (d: Date): string =>
  d.toISOString().split('T')[0]

export const addDays = (d: Date, n: number): Date => {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}

export const weeksUntil = (target: Date): number =>
  Math.max(0, Math.ceil((target.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))

export const daysUntil = (target: Date): number =>
  Math.max(0, Math.ceil((target.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
