import { useState, useCallback } from 'react'

export const useWeekNavigation = (totalWeeks: number, initialWeek = 0) => {
  const [selectedWeek, setSelectedWeek] = useState(initialWeek)

  const goToNextWeek = useCallback(() => {
    setSelectedWeek(w => Math.min(w + 1, totalWeeks - 1))
  }, [totalWeeks])

  const goToPrevWeek = useCallback(() => {
    setSelectedWeek(w => Math.max(w - 1, 0))
  }, [])

  const goToWeek = useCallback((week: number) => {
    setSelectedWeek(Math.max(0, Math.min(week, totalWeeks - 1)))
  }, [totalWeeks])

  return { selectedWeek, setSelectedWeek, goToNextWeek, goToPrevWeek, goToWeek }
}
