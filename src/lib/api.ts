/**
 * API utility functions for the school schedule application
 * This file contains helper functions for API calls and data management
 */

import { ScheduleData, Teacher, Absence } from './types'

/**
 * Storage key constants
 */
export const STORAGE_KEYS = {
  ALL_SCHEDULES: 'allSchedules',
  ABSENCES: 'absences',
  SCHOOL_NAME: 'schoolName',
  CURRENT_USER: 'current-user',
  USERS: 'users',
} as const

/**
 * Get all schedules from localStorage
 */
export function getAllSchedules(): ScheduleData[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ALL_SCHEDULES)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading schedules from localStorage:', error)
    return []
  }
}

/**
 * Save schedules to localStorage
 */
export function saveSchedules(schedules: ScheduleData[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.ALL_SCHEDULES, JSON.stringify(schedules))
    return true
  } catch (error) {
    console.error('Error saving schedules to localStorage:', error)
    return false
  }
}

/**
 * Get approved schedules only
 */
export function getApprovedSchedules(): ScheduleData[] {
  const allSchedules = getAllSchedules()
  return allSchedules.filter(schedule => schedule.approved)
}

/**
 * Get all teachers from approved schedules
 */
export function getAllTeachers(): Teacher[] {
  const approvedSchedules = getApprovedSchedules()
  const teachers: Teacher[] = []

  approvedSchedules.forEach(schedule => {
    if (schedule.teachers) {
      teachers.push(...schedule.teachers)
    }
  })

  return teachers
}

/**
 * Get absences from localStorage
 */
export function getAbsences(): Absence[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ABSENCES)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading absences from localStorage:', error)
    return []
  }
}

/**
 * Save absences to localStorage
 */
export function saveAbsences(absences: Absence[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.ABSENCES, JSON.stringify(absences))
    return true
  } catch (error) {
    console.error('Error saving absences to localStorage:', error)
    return false
  }
}

/**
 * Clear all data from localStorage
 */
export function clearAllData(): boolean {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    return true
  } catch (error) {
    console.error('Error clearing data from localStorage:', error)
    return false
  }
}

/**
 * Export data as JSON file
 */
export function exportDataAsJSON(): void {
  const data = {
    schedules: getAllSchedules(),
    absences: getAbsences(),
    schoolName: localStorage.getItem(STORAGE_KEYS.SCHOOL_NAME) || '',
    exportDate: new Date().toISOString(),
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `school-data-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Import data from JSON file
 */
export async function importDataFromJSON(file: File): Promise<boolean> {
  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (data.schedules && Array.isArray(data.schedules)) {
      saveSchedules(data.schedules)
    }

    if (data.absences && Array.isArray(data.absences)) {
      saveAbsences(data.absences)
    }

    if (data.schoolName) {
      localStorage.setItem(STORAGE_KEYS.SCHOOL_NAME, data.schoolName)
    }

    return true
  } catch (error) {
    console.error('Error importing data from JSON:', error)
    return false
  }
}
