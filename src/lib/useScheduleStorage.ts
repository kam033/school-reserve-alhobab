import { useState, useEffect, useCallback, useMemo } from 'react'
import { ScheduleData } from './types'
import { useAuth } from './auth'

/**
 * Custom hook for managing schedule storage with dual persistence
 * Uses both localStorage and in-memory state for reliability
 * Automatically filters by schoolId for non-admin users
 */
export function useScheduleStorage() {
  const STORAGE_KEY = 'allSchedules'
  const { currentUser, canAccessAllSchools } = useAuth()

  // Initialize state from localStorage
  const getInitialSchedules = (): ScheduleData[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log('📦 Loaded schedules from localStorage:', parsed.length)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (error) {
      console.error('❌ Error loading schedules:', error)
    }
    return []
  }

  const [allSchedulesRaw, setSchedulesState] = useState<ScheduleData[]>(getInitialSchedules)

  // Filter schedules by schoolId for non-admin users
  const schedules = useMemo(() => {
    if (canAccessAllSchools || !currentUser?.schoolId) {
      return allSchedulesRaw
    }
    return allSchedulesRaw.filter(schedule => schedule.schoolId === currentUser.schoolId)
  }, [allSchedulesRaw, canAccessAllSchools, currentUser?.schoolId])

  // Save to localStorage whenever raw schedules change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allSchedulesRaw))
      console.log('💾 Saved schedules to localStorage:', allSchedulesRaw.length)
    } catch (error) {
      console.error('❌ Error saving schedules:', error)
    }
  }, [allSchedulesRaw])

  // Listen for storage changes from other tabs/windows ONLY
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newSchedules = JSON.parse(e.newValue)
          // Only update if data actually changed (from another tab)
          setSchedulesState(prev => {
            const prevStr = JSON.stringify(prev)
            const newStr = JSON.stringify(newSchedules)
            if (prevStr !== newStr) {
              console.log('🔄 Schedules updated from storage event (different tab)')
              return newSchedules
            }
            return prev
          })
        } catch (error) {
          console.error('❌ Error parsing storage event:', error)
        }
      }
    }

    // Only listen to storage events (cross-tab communication)
    // Remove custom event listener to prevent infinite loops
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const setSchedules = useCallback((newSchedules: ScheduleData[] | ((prev: ScheduleData[]) => ScheduleData[])) => {
    setSchedulesState(prev => {
      const updated = typeof newSchedules === 'function' ? newSchedules(prev) : newSchedules
      return updated
    })
  }, [])

  // Use useMemo to cache approved schedules and prevent infinite loops
  const approvedSchedules = useMemo(() => {
    return schedules.filter(s => s.approved)
  }, [schedules])

  const addSchedule = useCallback((schedule: ScheduleData) => {
    setSchedules(prev => [...prev, schedule])
  }, [setSchedules])

  const updateSchedule = useCallback((index: number, updates: Partial<ScheduleData>) => {
    setSchedules(prev => {
      const newSchedules = [...prev]
      if (newSchedules[index]) {
        newSchedules[index] = { ...newSchedules[index], ...updates }
      }
      return newSchedules
    })
  }, [setSchedules])

  const deleteSchedule = useCallback((index: number) => {
    setSchedules(prev => {
      const newSchedules = [...prev]
      newSchedules.splice(index, 1)
      return newSchedules
    })
  }, [setSchedules])

  const clearSchedules = useCallback(() => {
    setSchedules([])
  }, [setSchedules])

  return {
    schedules,
    setSchedules,
    approvedSchedules,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    clearSchedules,
  }
}
