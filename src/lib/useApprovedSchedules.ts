import { useScheduleStorage } from './useScheduleStorage'

/**
 * Custom hook to manage and retrieve approved schedules
 * Returns both all schedules and filtered approved schedules
 * @deprecated Use useScheduleStorage directly instead
 */
export function useApprovedSchedules() {
  const { schedules, approvedSchedules } = useScheduleStorage()

  console.log('📦 useApprovedSchedules - Total:', schedules.length, 'Approved:', approvedSchedules.length)

  return {
    allSchedules: schedules,
    approvedSchedules
  }
}
