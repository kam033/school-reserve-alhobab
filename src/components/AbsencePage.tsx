import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Absence, Teacher, Period } from '@/lib/types'
import { CalendarBlank, UserCircleMinus, Trash, Broom, BookOpen, GraduationCap, Users, Warning, Download, Sparkle, UserSwitch, CheckCircle, PencilSimple } from '@phosphor-icons/react'
import { useScheduleStorage } from '@/lib/useScheduleStorage'

type FilterMode = 'all' | 'subject' | 'grade'

interface PeriodSubstitute {
  periodNumber: number
  substituteId: string | null
  subject: string
  className: string
}

export function AbsencePage() {
  const storage = useScheduleStorage()
  const approvedSchedules = storage?.approvedSchedules || []

  // State Management
  const [absences, setAbsences] = useState<Absence[]>(() => {
    try {
      const stored = localStorage.getItem('absences')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [schoolName, setSchoolName] = useState<string>(() => {
    try {
      return localStorage.getItem('schoolName') || ''
    } catch {
      return ''
    }
  })

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [selectedTeacherSubject, setSelectedTeacherSubject] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [selectedDay, setSelectedDay] = useState<string>('الأحد')
  const [selectedPeriods, setSelectedPeriods] = useState<number[]>([])
  const [substituteId, setSubstituteId] = useState<string>('')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteAllUnknownDialogOpen, setDeleteAllUnknownDialogOpen] = useState(false)
  const [absenceToDelete, setAbsenceToDelete] = useState<string | null>(null)
  const [substituteWarning, setSubstituteWarning] = useState<string | null>(null)
  const [absentTeachersList, setAbsentTeachersList] = useState<Array<{
    id: string;
    subject: string;
    periods: PeriodSubstitute[]
  }>>([])
  const [showAddTeacherDropdown, setShowAddTeacherDropdown] = useState(false)
  const [periodSubstitutes, setPeriodSubstitutes] = useState<PeriodSubstitute[]>([])
  const [selectedPeriodForSubstitute, setSelectedPeriodForSubstitute] = useState<number | null>(null)
  const [showSubstituteDialog, setShowSubstituteDialog] = useState(false)
  const [editingAbsenceId, setEditingAbsenceId] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [tempSubstituteId, setTempSubstituteId] = useState<string | null>(null)
  const [substituteFilter, setSubstituteFilter] = useState<'all' | 'subject' | 'schedule' | 'grade'>('all')

  // Save absences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('absences', JSON.stringify(absences))
    } catch (error) {
      console.error('Error saving absences:', error)
    }
  }, [absences])

  // Save school name to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('schoolName', schoolName)
    } catch (error) {
      console.error('Error saving school name:', error)
    }
  }, [schoolName])

  // Get all teachers from approved schedules
  const allTeachers = useMemo(() => {
    if (!approvedSchedules || approvedSchedules.length === 0) return []

    const teachersMap = new Map<string, Teacher>()

    approvedSchedules.forEach((schedule) => {
      if (schedule.teachers && Array.isArray(schedule.teachers)) {
        schedule.teachers.forEach((teacher) => {
          if (!teachersMap.has(teacher.id)) {
            teachersMap.set(teacher.id, teacher)
          }
        })
      }
    })

    return Array.from(teachersMap.values())
  }, [approvedSchedules])

  function getTeacherName(teacherId: string): string {
    const teacher = allTeachers.find((t) => t.id === teacherId)
    return teacher?.name || 'غير معروف'
  }

  function getTeacherById(teacherId: string): Teacher | undefined {
    return allTeachers.find((t) => t.id === teacherId)
  }

  // Get absent teacher's periods on selected day
  const absentTeacherPeriods = useMemo(() => {
    if (!selectedTeacherId || !selectedDay || !approvedSchedules || approvedSchedules.length === 0) {
      return []
    }

    const periods: Period[] = []

    // Extract original teacher ID (without school prefix)
    const teacher = getTeacherById(selectedTeacherId)
    const originalTeacherId = teacher?.originalId || selectedTeacherId.split('-').pop() || ''

    approvedSchedules.forEach((schedule) => {
      if (schedule.schedules && Array.isArray(schedule.schedules)) {
        schedule.schedules.forEach((sched) => {
          const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
          const dayIndex = dayNames.indexOf(selectedDay)
          const dayID = dayIndex > 0 ? dayIndex.toString() : ''

          // Compare with original teacher ID
          if (sched.teacherID === originalTeacherId && sched.dayID === dayID) {
            const subject = teacher?.subject || 'غير محدد'
            const className = sched.classID || 'غير محدد'

            periods.push({
              id: `period-${sched.id}`,
              periodNumber: sched.period, // Fixed: use sched.period instead of sched.periodID
              teacherId: selectedTeacherId,
              day: selectedDay,
              subject: subject,
              className: className
            })
          }
        })
      }
    })

    return periods.sort((a, b) => a.periodNumber - b.periodNumber)
  }, [selectedTeacherId, selectedDay, approvedSchedules, allTeachers])

  // Update periodSubstitutes when absent teacher or selected teacher changes
  useEffect(() => {
    if (selectedTeacherId && absentTeacherPeriods.length > 0) {
      const newPeriodSubstitutes: PeriodSubstitute[] = absentTeacherPeriods.map(period => ({
        periodNumber: period.periodNumber,
        substituteId: null,
        subject: period.subject,
        className: period.className || 'غير محدد'
      }))
      setPeriodSubstitutes(newPeriodSubstitutes)
    } else {
      setPeriodSubstitutes([])
    }
  }, [absentTeacherPeriods, selectedTeacherId])

  function getAbsentTeacherGrade(): string | null {
    if (!selectedTeacherId || !approvedSchedules || approvedSchedules.length === 0 || selectedPeriods.length === 0) {
      return null
    }

    const teacher = getTeacherById(selectedTeacherId)
    const originalTeacherId = teacher?.originalId || selectedTeacherId.split('-').pop() || ''

    const gradesFound = new Set<string>()

    approvedSchedules.forEach((schedule) => {
      if (schedule.schedules && Array.isArray(schedule.schedules)) {
        schedule.schedules.forEach((sched) => {
          const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
          const dayIndex = dayNames.indexOf(selectedDay)
          const dayID = dayIndex > 0 ? dayIndex.toString() : ''

          if (sched.teacherID === originalTeacherId &&
              sched.dayID === dayID &&
              selectedPeriods.includes(sched.period)) {
            if (sched.classID) {
              gradesFound.add(sched.classID)
            }
          }
        })
      }
    })

    if (gradesFound.size > 0) {
      return Array.from(gradesFound)[0]
    }

    return null
  }

  // Get available substitutes for a specific period
  function getAvailableSubstitutesForPeriod(periodNumber: number, subject: string) {
    if (!approvedSchedules || approvedSchedules.length === 0 || !selectedDay) {
      return []
    }

    const unavailableTeacherIds = new Set<string>()
    const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
    const dayIndex = dayNames.indexOf(selectedDay)
    const dayID = dayIndex > 0 ? dayIndex.toString() : ''

    // Check which teachers are busy
    approvedSchedules.forEach((schedule) => {
      if (schedule.schedules && Array.isArray(schedule.schedules)) {
        schedule.schedules.forEach((sched) => {
          if (sched.dayID === dayID) {
            const schedPeriod = sched.period
            if (
              schedPeriod === periodNumber ||
              schedPeriod === periodNumber - 1 ||
              schedPeriod === periodNumber + 1
            ) {
              unavailableTeacherIds.add(sched.teacherID)
            }
          }
        })
      }
    })

    // استبعاد المعلمين الذين تم اختيارهم بالفعل كبدلاء لحصص أخرى في نفس اليوم
    const alreadySelectedSubstitutes = new Set<string>()
    periodSubstitutes.forEach((ps) => {
      // استبعد المعلمين المختارين في حصص أخرى (ليس الحصة الحالية)
      if (ps.periodNumber !== periodNumber && ps.substituteId) {
        alreadySelectedSubstitutes.add(ps.substituteId)
      }
    })

    let availableTeachers = allTeachers.filter((teacher) => {
      const teacherOriginalId = teacher.originalId || teacher.id.split('-').pop() || ''
      const selectedOriginalId = allTeachers.find(t => t.id === selectedTeacherId)?.originalId || selectedTeacherId.split('-').pop() || ''

      // استبعد المعلم الغائب، المعلمين المشغولين، والمعلمين المختارين بالفعل كبدلاء
      return teacher.id !== selectedTeacherId &&
             !unavailableTeacherIds.has(teacherOriginalId) &&
             teacherOriginalId !== selectedOriginalId &&
             !alreadySelectedSubstitutes.has(teacher.id)
    })

    // Calculate substitute counts
    const substituteCounts = new Map<string, number>()
    if (absences && Array.isArray(absences)) {
      absences.forEach((absence) => {
        if (absence.substituteTeacherId) {
          const count = substituteCounts.get(absence.substituteTeacherId) || 0
          substituteCounts.set(absence.substituteTeacherId, count + 1)
        }
      })
    }

    // Sort by priority
    availableTeachers.sort((a, b) => {
      // Priority 1: Same subject
      if (a.subject === subject && b.subject !== subject) return -1
      if (a.subject !== subject && b.subject === subject) return 1

      // Priority 2: Substitute count (lower is better)
      const aCount = substituteCounts.get(a.id) || 0
      const bCount = substituteCounts.get(b.id) || 0
      if (aCount !== bCount) return aCount - bCount

      // Priority 3: Alphabetical
      return a.name.localeCompare(b.name, 'ar')
    })

    return availableTeachers.map(teacher => ({
      ...teacher,
      substituteCount: substituteCounts.get(teacher.id) || 0,
      isSameSubject: teacher.subject === subject,
      isRecommended: teacher.subject === subject && (substituteCounts.get(teacher.id) || 0) <= 2
    }))
  }

  // Smart assignment function
  function handleSmartAssignment() {
    const updatedSubstitutes = periodSubstitutes.map(ps => {
      const availableSubs = getAvailableSubstitutesForPeriod(ps.periodNumber, ps.subject)
      const recommended = availableSubs.find(s => s.isRecommended) || availableSubs[0]

      return {
        ...ps,
        substituteId: recommended?.id || null
      }
    })

    setPeriodSubstitutes(updatedSubstitutes)
    toast.success('تم تطبيق الاقتراح الذكي لجميع الحصص')
  }

  function checkAdjacentPeriods(teacherId: string): { hasBefore: boolean; hasAfter: boolean; details: string[] } {
    const result = { hasBefore: false, hasAfter: false, details: [] as string[] }

    if (!teacherId || !approvedSchedules || approvedSchedules.length === 0 || selectedPeriods.length === 0) {
      return result
    }

    const teacher = getTeacherById(teacherId)
    const originalTeacherId = teacher?.originalId || teacherId.split('-').pop() || ''

    const minPeriod = Math.min(...selectedPeriods)
    const maxPeriod = Math.max(...selectedPeriods)
    const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
    const dayIndex = dayNames.indexOf(selectedDay)
    const dayID = dayIndex > 0 ? dayIndex.toString() : ''

    approvedSchedules.forEach((schedule) => {
      if (schedule.schedules && Array.isArray(schedule.schedules)) {
        schedule.schedules.forEach((sched) => {
          if (sched.teacherID === originalTeacherId && sched.dayID === dayID) {
            const periodNum = sched.period
            if (periodNum === minPeriod - 1) {
              result.hasBefore = true
              result.details.push(`الحصة ${periodNum} (قبل)`)
            }
            if (periodNum === maxPeriod + 1) {
              result.hasAfter = true
              result.details.push(`الحصة ${periodNum} (بعد)`)
            }
          }
        })
      }
    })

    return result
  }

  useEffect(() => {
    if (!substituteId) {
      setSubstituteWarning(null)
      return
    }

    const adjacentCheck = checkAdjacentPeriods(substituteId)

    if (adjacentCheck.hasBefore || adjacentCheck.hasAfter) {
      const teacher = getTeacherById(substituteId)
      const teacherName = teacher?.name || 'المعلم'
      const periodDetails = adjacentCheck.details.join(' و ')
      setSubstituteWarning(
        `⚠️ تنبيه: المعلم ${teacherName} لديه حصة في ${periodDetails} (قبل أو بعد الحصة المختارة)، يُفضَّل اختيار معلم آخر لضمان راحة المعلم وعدم الإرهاق.`
      )
    } else {
      setSubstituteWarning(null)
    }
  }, [substituteId, selectedPeriods, selectedDay, approvedSchedules])

  const availableSubstitutes = useMemo(() => {
    if (!approvedSchedules || approvedSchedules.length === 0 || !selectedDay || selectedPeriods.length === 0) {
      return []
    }

    const minPeriod = Math.min(...selectedPeriods)
    const maxPeriod = Math.max(...selectedPeriods)
    const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
    const dayIndex = dayNames.indexOf(selectedDay)
    const dayID = dayIndex > 0 ? dayIndex.toString() : ''

    const unavailableTeacherIds = new Set<string>()

    approvedSchedules.forEach((schedule) => {
      if (schedule.schedules && Array.isArray(schedule.schedules)) {
        schedule.schedules.forEach((sched) => {
          if (sched.dayID === dayID) {
            const schedPeriod = sched.period
            if (
              selectedPeriods.includes(schedPeriod) ||
              schedPeriod === minPeriod - 1 ||
              schedPeriod === maxPeriod + 1
            ) {
              unavailableTeacherIds.add(sched.teacherID)
            }
          }
        })
      }
    })

    let filteredTeachers = allTeachers.filter((teacher) => {
      const teacherOriginalId = teacher.originalId || teacher.id.split('-').pop() || ''
      const selectedOriginalId = allTeachers.find(t => t.id === selectedTeacherId)?.originalId || selectedTeacherId.split('-').pop() || ''
      return teacher.id !== selectedTeacherId && !unavailableTeacherIds.has(teacherOriginalId) && teacherOriginalId !== selectedOriginalId
    })

    const absentTeacher = getTeacherById(selectedTeacherId)
    const absentTeacherGrade = getAbsentTeacherGrade()

    if (filterMode === 'subject' && absentTeacher) {
      filteredTeachers = filteredTeachers.filter(
        (teacher) => teacher.subject === absentTeacher.subject
      )
    } else if (filterMode === 'grade' && absentTeacherGrade) {
      const teachersWithSameGrade = new Set<string>()

      approvedSchedules.forEach((schedule) => {
        if (schedule.schedules && Array.isArray(schedule.schedules)) {
          schedule.schedules.forEach((sched) => {
            if (sched.classID === absentTeacherGrade) {
              teachersWithSameGrade.add(sched.teacherID)
            }
          })
        }
      })

      filteredTeachers = filteredTeachers.filter((teacher) =>
        teachersWithSameGrade.has(teacher.id)
      )
    }

    return filteredTeachers
  }, [approvedSchedules, selectedDay, selectedPeriods, allTeachers, selectedTeacherId, filterMode])

  // Reset all states when teacher changes
  useEffect(() => {
    if (selectedTeacherId) {
      const teacher = getTeacherById(selectedTeacherId)
      if (teacher) {
        setSelectedTeacherSubject(teacher.subject)
      }
    } else {
      setSelectedTeacherSubject('')
      setFilterMode('all')
      // Only reset when no teacher is selected
      setSelectedPeriods([])
      setPeriodSubstitutes([])
    }

    // Reset other states
    setSubstituteId('')
    setSubstituteWarning(null)
  }, [selectedTeacherId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setShowAddTeacherDropdown(false)
      }
    }

    if (showAddTeacherDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAddTeacherDropdown])

  const handleAddAbsentTeacher = (teacherId: string) => {
    const teacher = getTeacherById(teacherId)
    if (teacher && !absentTeachersList.some(t => t.id === teacherId)) {
      setAbsentTeachersList((current) => [...current, { id: teacherId, subject: teacher.subject }])
      toast.success(`تمت إضافة ${teacher.name}`)
    }
    setShowAddTeacherDropdown(false)
  }

  const handleRemoveAbsentTeacher = (teacherId: string) => {
    setAbsentTeachersList((current) => current.filter(t => t.id !== teacherId))
    const teacherName = getTeacherName(teacherId)
    toast.success(`تم إزالة ${teacherName}`)
  }

  const handleRecordAbsence = () => {
    // Collect all teachers to record (current + list)
    const teachersToRecord: Array<{id: string, periods: PeriodSubstitute[]}> = []

    // Add current teacher if selected
    if (selectedTeacherId && periodSubstitutes.length > 0) {
      teachersToRecord.push({
        id: selectedTeacherId,
        periods: periodSubstitutes
      })
    }

    // Add teachers from the list
    if (absentTeachersList.length > 0) {
      teachersToRecord.push(...absentTeachersList.map(t => ({
        id: t.id,
        periods: t.periods
      })))
    }

    // Check if we have any teachers to record
    if (teachersToRecord.length === 0) {
      toast.error('يرجى اختيار معلم غائب واحد على الأقل')
      return
    }

    // Create absence records for all teachers
    const allNewAbsences: Absence[] = []
    let totalPeriodsWithoutSub = 0

    teachersToRecord.forEach(teacherData => {
      const periodsWithoutSubstitute = teacherData.periods.filter(ps => !ps.substituteId)
      totalPeriodsWithoutSub += periodsWithoutSubstitute.length

      const newAbsences: Absence[] = teacherData.periods.map(ps => ({
        id: `absence-${Date.now()}-${ps.periodNumber}-${Math.random()}`,
        teacherId: teacherData.id,
        date: selectedDate,
        periods: [ps.periodNumber],
        substituteTeacherId: ps.substituteId || undefined,
        schoolId: 'school-1',
      }))

      allNewAbsences.push(...newAbsences)
    })

    // Show warning if some periods don't have substitutes
    if (totalPeriodsWithoutSub > 0) {
      toast.warning(`تحذير: ${totalPeriodsWithoutSub} حصة لا تحتوي على معلم بديل`)
    }

    setAbsences((current) => [...(current || []), ...allNewAbsences])

    const totalTeachers = teachersToRecord.length
    const totalPeriods = allNewAbsences.length
    const totalWithSub = allNewAbsences.filter(a => a.substituteTeacherId).length

    toast.success(`تم تسجيل غياب ${totalTeachers} معلم (${totalPeriods} حصة، ${totalWithSub} بديل)`)

    // Reset all values
    setSelectedTeacherId('')
    setPeriodSubstitutes([])
    setSelectedPeriods([])
    setSubstituteId('')
    setFilterMode('all')
    setSubstituteWarning(null)
    setAbsentTeachersList([]) // Clear the list
  }

  const todayAbsences = useMemo(() => {
    if (!absences || !Array.isArray(absences)) return []
    return absences.filter((a) => a.date === selectedDate)
  }, [absences, selectedDate])

  const unknownAbsencesCount = useMemo(() => {
    if (!absences || !Array.isArray(absences)) return 0
    return absences.filter((absence) =>
      getTeacherName(absence.teacherId) === 'غير معروف' ||
      (absence.substituteTeacherId && getTeacherName(absence.substituteTeacherId) === 'غير معروف')
    ).length
  }, [absences, allTeachers])

  const handleDeleteAbsence = (absenceId: string) => {
    setAbsences((current) => (current || []).filter((a) => a.id !== absenceId))
    toast.success('تم حذف الغياب بنجاح')
    setDeleteDialogOpen(false)
    setAbsenceToDelete(null)
  }

  const handleDeleteClick = (absenceId: string) => {
    setAbsenceToDelete(absenceId)
    setDeleteDialogOpen(true)
  }

  const isAbsenceUnknown = (absenceId: string): boolean => {
    const absence = absences?.find((a) => a.id === absenceId)
    if (!absence) return false
    const teacherUnknown = getTeacherName(absence.teacherId) === 'غير معروف'
    const substituteUnknown = absence.substituteTeacherId ? getTeacherName(absence.substituteTeacherId) === 'غير معروف' : false
    return teacherUnknown || substituteUnknown
  }

  const handleDeleteAllUnknown = () => {
    const count = unknownAbsencesCount
    setAbsences((current) =>
      (current || []).filter((absence) =>
        getTeacherName(absence.teacherId) !== 'غير معروف' &&
        (!absence.substituteTeacherId || getTeacherName(absence.substituteTeacherId) !== 'غير معروف')
      )
    )
    toast.success(`تم حذف ${count} سجل غير معروف بنجاح`)
    setDeleteAllUnknownDialogOpen(false)
  }

  // Open edit dialog
  const handleEditAbsence = (absenceId: string) => {
    const absence = absences?.find(a => a.id === absenceId)
    if (!absence) return

    setEditingAbsenceId(absenceId)
    setTempSubstituteId(absence.substituteTeacherId || null)
    setShowEditDialog(true)
  }

  // Save edit
  const handleSaveEdit = (absenceId: string, newSubstituteId: string | null) => {
    setAbsences((current) =>
      (current || []).map((absence) =>
        absence.id === absenceId
          ? { ...absence, substituteTeacherId: newSubstituteId || undefined }
          : absence
      )
    )
    toast.success('تم تحديث المعلم البديل بنجاح')
    setShowEditDialog(false)
    setEditingAbsenceId(null)
    setTempSubstituteId(null)
  }

  const handleExportToPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('تعذر فتح نافذة الطباعة')
      return
    }

    const todayDate = new Date(selectedDate).toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    let tableRows = ''
    todayAbsences.forEach((absence, index) => {
      const teacherName = getTeacherName(absence.teacherId)
      const substituteName = absence.substituteTeacherId
        ? getTeacherName(absence.substituteTeacherId)
        : 'لا يوجد'
      const periodsText = absence.periods.sort((a, b) => a - b).join('، ')

      tableRows += `
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${teacherName}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${periodsText}</td>
          <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${substituteName}</td>
        </tr>
      `
    })

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>جدول الغيابات - ${todayDate}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Tajawal', Arial, sans-serif;
            direction: rtl;
            padding: 40px;
            background: white;
          }

          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
          }

          .school-name {
            font-size: 28px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 10px;
          }

          .title {
            font-size: 22px;
            font-weight: 600;
            color: #444;
            margin-bottom: 8px;
          }

          .date {
            font-size: 16px;
            color: #666;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          thead {
            background: #f5f5f5;
          }

          th {
            padding: 14px;
            border: 1px solid #ddd;
            font-weight: 700;
            text-align: center;
            background: #e8e8e8;
            color: #333;
          }

          td {
            padding: 12px;
            border: 1px solid #ddd;
          }

          tr:nth-child(even) {
            background-color: #fafafa;
          }

          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 14px;
            line-height: 1.8;
          }

          .footer-note {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
            font-weight: 500;
            color: #856404;
          }

          .no-data {
            text-align: center;
            padding: 40px;
            color: #999;
            font-size: 18px;
          }

          @media print {
            body {
              padding: 20px;
            }

            @page {
              size: A4;
              margin: 15mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">${schoolName || 'مدرسة [اسم المدرسة]'}</div>
          <div class="title">جدول الحصص الاحتياطية</div>
          <div class="date">${todayDate}</div>
        </div>

        ${todayAbsences.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">م</th>
                <th style="width: 30%;">المعلم الغائب</th>
                <th style="width: 25%;">الحصص</th>
                <th style="width: 30%;">المعلم البديل</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        ` : `
          <div class="no-data">
            لا توجد غيابات مسجلة في هذا التاريخ
          </div>
        `}

        <div class="footer">
          <div class="footer-note">
            ⚠️ الرجاء الالتزام بجدول الحصص وعدم التأخير عن المواعيد المحددة
          </div>
          <div>
            تم الإصدار بتاريخ: ${new Date().toLocaleDateString('ar-SA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">غياب المعلمين</h1>
          {todayAbsences.length > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={handleExportToPDF}
                variant="default"
                size="lg"
                className="gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <Download className="w-5 h-5" weight="bold" />
                تصدير جدول الاحتياطي
              </Button>
            </div>
          )}
        </div>
        <p className="text-muted-foreground mb-6">
          تسجيل غياب المعلمين وتعيين البدلاء
        </p>

        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium whitespace-nowrap">اسم المدرسة:</Label>
              <Input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="أدخل اسم المدرسة (سيظهر في تصدير PDF)"
                className="flex-1 bg-background"
              />
            </div>
          </CardContent>
        </Card>

        {!approvedSchedules || approvedSchedules.length === 0 ? (
          <Card className="border-amber-500/50 bg-amber-50/50">
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <p className="text-lg font-medium text-foreground">
                  ⚠️ لا يوجد جدول معتمد
                </p>
                <p className="text-muted-foreground">
                  يرجى رفع ملف XML واعتماده أولاً من صفحة "تحميل الجدول"
                </p>
                <div className="pt-4">
                  <Button onClick={() => window.location.href = '/'} variant="outline">
                    العودة للصفحة الرئيسية
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>تسجيل غياب جديد</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>

              <div className="space-y-2">
                <Label>اليوم</Label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {days.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>المعلم الغائب</Label>
                  {absentTeachersList.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {absentTeachersList.length} معلم مضاف
                    </Badge>
                  )}
                </div>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger className="h-11" data-teacher-select>
                    <SelectValue placeholder="اختر المعلم الغائب من القائمة" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {allTeachers.length === 0 ? (
                      <SelectItem value="no-teachers" disabled>
                        لا يوجد معلمين في النظام
                      </SelectItem>
                    ) : (
                      allTeachers
                        .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
                        .filter(teacher => !absentTeachersList.some(t => t.id === teacher.id))
                        .map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            <div className="flex items-center justify-between w-full gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{teacher.name}</span>
                                <span className="text-muted-foreground text-sm">({teacher.subject})</span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>

                {/* Show added absent teachers */}
                {absentTeachersList.length > 0 && (
                  <div className="space-y-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <Label className="text-xs text-amber-900">المعلمون الغائبون المضافون:</Label>
                    <div className="space-y-1">
                      {absentTeachersList.map((teacher) => {
                        const withSubCount = teacher.periods.filter(p => p.substituteId).length
                        return (
                          <div key={teacher.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center gap-2 flex-1">
                              <UserCircleMinus className="w-4 h-4 text-amber-600" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{getTeacherName(teacher.id)}</span>
                                  <Badge variant="outline" className="text-xs">{teacher.subject}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {teacher.periods.length} حصة • {withSubCount} بديل
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveAbsentTeacher(teacher.id)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {!selectedTeacherId && absentTeachersList.length === 0 && (
                  <div className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 px-3 py-2 rounded-md flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>اختر المعلم الغائب من القائمة المنسدلة، ستظهر المادة تلقائياً</span>
                  </div>
                )}
                {selectedTeacherSubject && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span className="text-sm">
                      <span className="text-muted-foreground">المادة: </span>
                      <span className="font-medium text-foreground">{selectedTeacherSubject}</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Display absent teacher's periods with substitute selection */}
              {selectedTeacherId && absentTeacherPeriods.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      حصص {getTeacherName(selectedTeacherId)} في يوم {selectedDay}
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {absentTeacherPeriods.length} حصة
                    </Badge>
                  </div>

                  {/* Smart assignment button */}
                  <Button
                    onClick={handleSmartAssignment}
                    variant="outline"
                    className="w-full gap-2 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-300 hover:border-emerald-500"
                  >
                    <Sparkle className="w-5 h-5 text-emerald-600" weight="fill" />
                    <span className="font-semibold">تطبيق الاقتراح الذكي لجميع الحصص</span>
                  </Button>

                  {/* Period list */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {periodSubstitutes.length === 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-center">
                        <p className="text-amber-900">⏳ جاري تحميل الحصص...</p>
                      </div>
                    )}
                    {periodSubstitutes.map((ps, index) => {
                      const period = absentTeacherPeriods.find(p => p.periodNumber === ps.periodNumber)
                      const availableSubs = getAvailableSubstitutesForPeriod(ps.periodNumber, ps.subject)
                      const recommendedSub = availableSubs.find(s => s.isRecommended)
                      const selectedSub = ps.substituteId ? allTeachers.find(t => t.id === ps.substituteId) : null

                      return (
                        <Card key={ps.periodNumber} className="border-2 border-emerald-100 hover:border-emerald-300 transition-colors">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Card header - period info */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="default" className="text-sm font-bold px-3 py-1">
                                      الحصة {ps.periodNumber}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {period?.subject || ps.subject}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    <div className="flex items-center gap-2">
                                      <GraduationCap className="w-4 h-4" />
                                      <span>الصف: {period?.className || ps.className}</span>
                                    </div>
                                    {availableSubs.length > 0 ? (
                                      <div className="flex items-center gap-2 text-emerald-600">
                                        <CheckCircle className="w-4 h-4" weight="fill" />
                                        <span>{availableSubs.length} معلم متفرغ</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-destructive">
                                        <Warning className="w-4 h-4" weight="fill" />
                                        <span>لا يوجد معلمين متفرغين</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Selected substitute */}
                              {selectedSub && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1">
                                      <UserSwitch className="w-5 h-5 text-emerald-600" weight="fill" />
                                      <div>
                                        <p className="font-semibold text-emerald-900">{selectedSub.name}</p>
                                        <p className="text-xs text-emerald-700">{selectedSub.subject}</p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        const updated = [...periodSubstitutes]
                                        updated[index].substituteId = null
                                        setPeriodSubstitutes(updated)
                                      }}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Substitute selection button */}
                              <Button
                                onClick={() => {
                                  setSelectedPeriodForSubstitute(ps.periodNumber)
                                  setShowSubstituteDialog(true)
                                }}
                                variant={selectedSub ? "outline" : "default"}
                                className="w-full gap-2"
                                disabled={availableSubs.length === 0}
                              >
                                <UserSwitch className="w-4 h-4" />
                                {selectedSub ? 'تغيير المعلم البديل' : 'اختيار معلم بديل'}
                              </Button>

                              {/* Smart suggestion */}
                              {!selectedSub && recommendedSub && (
                                <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-xs">
                                  <div className="flex items-center gap-2">
                                    <Sparkle className="w-4 h-4 text-blue-600" weight="fill" />
                                    <span className="text-blue-900">
                                      <span className="font-semibold">مقترح: </span>
                                      {recommendedSub.name} ({recommendedSub.subject})
                                      {recommendedSub.substituteCount > 0 && (
                                        <span className="mr-1">• {recommendedSub.substituteCount} احتياط سابق</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Message when no teacher selected */}
              {!selectedTeacherId && (
                <Alert className="border-blue-500 bg-blue-50/50">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    اختر المعلم الغائب من القائمة أعلاه لعرض حصصه واختيار البديل المناسب لكل حصة
                  </AlertDescription>
                </Alert>
              )}

              {/* Message when teacher has no periods */}
              {selectedTeacherId && absentTeacherPeriods.length === 0 && (
                <Alert className="border-amber-500 bg-amber-50/50">
                  <Warning className="h-5 w-5 text-amber-600" />
                  <AlertDescription className="text-amber-900">
                    المعلم {getTeacherName(selectedTeacherId)} ليس لديه حصص في يوم {selectedDay}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                {/* Show "Add New Absence" button when no teacher is selected */}
                {!selectedTeacherId ? (
                  <Button
                    onClick={() => {
                      // Just a visual cue - the form is already ready for input
                      const selectTrigger = document.querySelector('[data-teacher-select]') as HTMLElement
                      selectTrigger?.click()
                    }}
                    className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    size="lg"
                  >
                    <UserCircleMinus className="w-5 h-5" weight="fill" />
                    ➕ إضافة معلم غائب {absentTeachersList.length > 0 ? 'آخر' : 'جديد'}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleRecordAbsence}
                      className="flex-1"
                      disabled={!selectedTeacherId || periodSubstitutes.length === 0}
                    >
                      <UserCircleMinus className="ml-2" />
                      {absentTeachersList.length > 0 ? 'إضافة وتسجيل الغياب' : 'تسجيل الغياب'}
                    </Button>
                    {selectedTeacherId && periodSubstitutes.length > 0 && (
                      <Button
                        onClick={() => {
                          if (!selectedTeacherId) {
                            toast.error('يرجى اختيار المعلم الغائب')
                            return
                          }

                          if (periodSubstitutes.length === 0) {
                            toast.error('يرجى تحديد الحصص من خلال اختيار المعلم الغائب')
                            return
                          }

                          // Add to absent teachers list with their periods and substitutes
                          const teacher = getTeacherById(selectedTeacherId)
                          if (teacher && !absentTeachersList.some(t => t.id === selectedTeacherId)) {
                            setAbsentTeachersList(current => [...current, {
                              id: selectedTeacherId,
                              subject: teacher.subject,
                              periods: [...periodSubstitutes] // Save current period substitutes
                            }])
                            toast.success(`تمت إضافة ${teacher.name} إلى قائمة الغائبين (${periodSubstitutes.length} حصة)`)
                            // Reset selection for next teacher
                            setSelectedTeacherId('')
                          }
                        }}
                        variant="outline"
                        className="gap-2 border-blue-300 hover:bg-blue-50"
                      >
                        ➕ إضافة معلم آخر
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarBlank className="w-5 h-5" />
                    الغيابات اليوم
                  </CardTitle>
                  {unknownAbsencesCount > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteAllUnknownDialogOpen(true)}
                      className="gap-2"
                    >
                      <Broom className="w-4 h-4" />
                      حذف جميع السجلات "غير معروف" ({unknownAbsencesCount})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {todayAbsences.length > 0 ? (
                  <div className="space-y-3">
                    {todayAbsences.map((absence) => {
                      const teacherName = getTeacherName(absence.teacherId)
                      const isUnknown = teacherName === 'غير معروف' ||
                        (absence.substituteTeacherId && getTeacherName(absence.substituteTeacherId) === 'غير معروف')

                      return (
                        <div
                          key={absence.id}
                          className={`p-4 border rounded-lg space-y-2 ${isUnknown ? 'bg-destructive/5 border-destructive/30' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-medium flex items-center gap-2">
                              {teacherName}
                              {teacherName === 'غير معروف' && (
                                <Badge variant="destructive" className="text-xs">
                                  غير معروف
                                </Badge>
                              )}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive">غائب</Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditAbsence(absence.id)}
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="تعديل البديل"
                              >
                                <PencilSimple className="w-4 h-4" weight="fill" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(absence.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="حذف"
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">الحصص:</span>
                            <div className="flex gap-1">
                              {absence.periods.map((p) => (
                                <Badge key={p} variant="outline">
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {absence.substituteTeacherId && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">البديل: </span>
                              <span className={`font-medium ${getTeacherName(absence.substituteTeacherId) === 'غير معروف' ? 'text-destructive' : 'text-accent'}`}>
                                {getTeacherName(absence.substituteTeacherId)}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    لا يوجد غيابات مسجلة لهذا اليوم
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {absenceToDelete && isAbsenceUnknown(absenceToDelete) ? '⚠️ حذف سجل غير معروف' : 'تأكيد الحذف'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {absenceToDelete && isAbsenceUnknown(absenceToDelete)
                ? 'سيتم حذف هذا السجل غير المعروف نهائيًا من النظام.'
                : 'هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => absenceToDelete && handleDeleteAbsence(absenceToDelete)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllUnknownDialogOpen} onOpenChange={setDeleteAllUnknownDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>🧹 حذف جميع السجلات "غير معروف"</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              سيتم حذف <span className="font-bold text-destructive">{unknownAbsencesCount}</span> سجل غير معروف نهائيًا من النظام.
              <br />
              <br />
              هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllUnknown}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              حذف الكل ({unknownAbsencesCount})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for selecting substitute teacher */}
      <Dialog open={showSubstituteDialog} onOpenChange={setShowSubstituteDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <UserSwitch className="w-6 h-6 text-emerald-600" />
              اختيار معلم بديل - الحصة {selectedPeriodForSubstitute}
            </DialogTitle>
          </DialogHeader>

          {selectedPeriodForSubstitute && (() => {
            const ps = periodSubstitutes.find(p => p.periodNumber === selectedPeriodForSubstitute)
            if (!ps) return null

            const availableSubs = getAvailableSubstitutesForPeriod(ps.periodNumber, ps.subject)

            return (
              <div className="space-y-4 mt-4">
                {/* Period information */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">المادة: </span>
                      <span className="font-semibold">{ps.subject}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الصف: </span>
                      <span className="font-semibold">{ps.className}</span>
                    </div>
                  </div>
                </div>

                {/* Smart Selection Buttons */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">اختيار سريع:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Smart Auto Selection */}
                    <Button
                      onClick={() => {
                        const recommended = availableSubs.find(s => s.isRecommended) || availableSubs[0]
                        if (recommended) {
                          const updated = periodSubstitutes.map(p =>
                            p.periodNumber === selectedPeriodForSubstitute
                              ? { ...p, substituteId: recommended.id }
                              : p
                          )
                          setPeriodSubstitutes(updated)
                          setShowSubstituteDialog(false)
                          toast.success(`تم اختيار ${recommended.name} ذكياً كمعلم بديل`)
                        }
                      }}
                      disabled={availableSubs.length === 0}
                      className="gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                    >
                      <Sparkle className="w-5 h-5" weight="fill" />
                      اختيار ذكي تلقائي 🤖
                    </Button>

                    {/* Filter by Same Subject */}
                    <Button
                      onClick={() => {
                        setSubstituteFilter(substituteFilter === 'subject' ? 'all' : 'subject')
                        toast.info(substituteFilter === 'subject' ? 'تم إلغاء التصفية' : 'تم التصفية حسب المادة')
                      }}
                      variant={substituteFilter === 'subject' ? 'default' : 'outline'}
                      className={substituteFilter === 'subject'
                        ? 'gap-2 bg-green-600 hover:bg-green-700 text-white'
                        : 'gap-2 border-green-300 hover:bg-green-50 text-green-700'
                      }
                    >
                      📘 احتياطي حسب المادة
                    </Button>

                    {/* Filter by Schedule (least substitutions) */}
                    <Button
                      onClick={() => {
                        setSubstituteFilter(substituteFilter === 'schedule' ? 'all' : 'schedule')
                        toast.info(substituteFilter === 'schedule' ? 'تم إلغاء التصفية' : 'تم التصفية حسب الجدول')
                      }}
                      variant={substituteFilter === 'schedule' ? 'default' : 'outline'}
                      className={substituteFilter === 'schedule'
                        ? 'gap-2 bg-blue-600 hover:bg-blue-700 text-white'
                        : 'gap-2 border-blue-300 hover:bg-blue-50 text-blue-700'
                      }
                    >
                      📅 احتياطي حسب الجدول
                    </Button>

                    {/* Filter by Same Grade */}
                    <Button
                      onClick={() => {
                        setSubstituteFilter(substituteFilter === 'grade' ? 'all' : 'grade')
                        toast.info(substituteFilter === 'grade' ? 'تم إلغاء التصفية' : 'تم التصفية حسب الصف')
                      }}
                      variant={substituteFilter === 'grade' ? 'default' : 'outline'}
                      className={substituteFilter === 'grade'
                        ? 'gap-2 bg-orange-600 hover:bg-orange-700 text-white'
                        : 'gap-2 border-orange-300 hover:bg-orange-50 text-orange-700'
                      }
                    >
                      🏫 احتياطي حسب الصف
                    </Button>
                  </div>
                </div>

                {/* Available teachers list */}
                {availableSubs.length > 0 ? (
                  <div className="space-y-2">
                    {(() => {
                      // Apply filter to available substitutes
                      let filteredSubs = [...availableSubs]

                      if (substituteFilter === 'subject') {
                        filteredSubs = availableSubs.filter(t => t.isSameSubject)
                      } else if (substituteFilter === 'schedule') {
                        filteredSubs = [...availableSubs].sort((a, b) =>
                          (a.substituteCount || 0) - (b.substituteCount || 0)
                        )
                      } else if (substituteFilter === 'grade') {
                        // Keep all for now, could add grade-specific filter
                        filteredSubs = availableSubs
                      }

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <Label className="text-base">
                              {substituteFilter === 'all' ? 'اختر يدوياً من المعلمين المتفرغين' : 'المعلمون المفلترون'}
                              ({filteredSubs.length}):
                            </Label>
                            {substituteFilter !== 'all' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSubstituteFilter('all')}
                                className="text-xs"
                              >
                                ✕ إلغاء التصفية
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                            {filteredSubs.length === 0 ? (
                              <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-center">
                                <p className="text-amber-900 text-sm">لا يوجد معلمين متاحين بهذا الفلتر</p>
                              </div>
                            ) : (
                              filteredSubs.map((teacher) => (
                                <button
                                  key={teacher.id}
                                  onClick={() => {
                                    const updated = periodSubstitutes.map(p =>
                                      p.periodNumber === selectedPeriodForSubstitute
                                        ? { ...p, substituteId: teacher.id }
                                        : p
                                    )
                                    setPeriodSubstitutes(updated)
                                    setShowSubstituteDialog(false)
                                    toast.success(`تم اختيار ${teacher.name} كمعلم بديل`)
                                  }}
                                  className="w-full p-4 border-2 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all text-right"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold text-lg">{teacher.name}</p>
                                        {teacher.isRecommended && (
                                          <Badge className="bg-emerald-600 text-xs gap-1">
                                            <Sparkle className="w-3 h-3" weight="fill" />
                                            مقترح
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                          <BookOpen className="w-4 h-4" />
                                          {teacher.subject}
                                          {teacher.isSameSubject && (
                                            <Badge variant="outline" className="text-[10px] ml-1 text-emerald-600 border-emerald-600">
                                              ✓ نفس المادة
                                            </Badge>
                                          )}
                                        </span>
                                        {teacher.substituteCount > 0 && (
                                          <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {teacher.substituteCount} احتياط سابق
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <CheckCircle className="w-6 h-6 text-emerald-600" weight="fill" />
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <Alert className="border-amber-500 bg-amber-50">
                    <Warning className="h-5 w-5 text-amber-600" />
                    <AlertDescription className="text-amber-900">
                      لا يوجد معلمين متفرغين لهذه الحصة. جميع المعلمين مشغولون في نفس الفترة أو قبلها أو بعدها.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Cancel button */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowSubstituteDialog(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Dialog for editing substitute teacher */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <PencilSimple className="w-6 h-6 text-blue-600" weight="fill" />
              تعديل المعلم البديل
            </DialogTitle>
          </DialogHeader>

          {editingAbsenceId && (() => {
            const absence = absences?.find(a => a.id === editingAbsenceId)
            if (!absence) return null

            const teacherName = getTeacherName(absence.teacherId)
            const currentSubstitute = absence.substituteTeacherId

            // Get period information from schedule
            const periodInfo = approvedSchedules
              .flatMap(s => {
                if (!s.schedules) return []
                const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
                return s.schedules.map(sched => {
                  const dayIndex = parseInt(sched.dayID || '0')
                  const dayName = dayNames[dayIndex] || ''
                  const teacher = getTeacherById(sched.teacherID)
                  const periodNum = sched.period || 0
                  return {
                    teacherId: sched.teacherID,
                    periodNumber: periodNum,
                    day: dayName,
                    subject: teacher?.subject || '',
                    className: sched.classID || ''
                  }
                })
              })
              .find(p =>
                p.teacherId === absence.teacherId &&
                absence.periods.includes(p.periodNumber)
              )

            const availableSubs = getAvailableSubstitutesForPeriod(
              absence.periods[0],
              periodInfo?.subject || ''
            )

            return (
              <div className="space-y-4 mt-4">
                {/* Absence information */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">المعلم الغائب: </span>
                      <span className="font-semibold">{teacherName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الحصص: </span>
                      <span className="font-semibold">{absence.periods.join('، ')}</span>
                    </div>
                    {periodInfo && (
                      <>
                        <div>
                          <span className="text-muted-foreground">المادة: </span>
                          <span className="font-semibold">{periodInfo.subject}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الصف: </span>
                          <span className="font-semibold">{periodInfo.className}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Current substitute */}
                {currentSubstitute && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm">
                      <span className="text-muted-foreground">البديل الحالي: </span>
                      <span className="font-semibold text-blue-900">
                        {getTeacherName(currentSubstitute)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Select new substitute */}
                {availableSubs.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-base">
                      {currentSubstitute ? 'اختر معلماً بديلاً جديداً' : 'اختر معلماً بديلاً'} ({availableSubs.length} متفرغ):
                    </Label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {/* Option: No substitute */}
                      <button
                        onClick={() => setTempSubstituteId(null)}
                        className={`w-full p-3 border-2 rounded-lg transition-all text-right ${
                          tempSubstituteId === null
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-amber-900">❌ لا يوجد معلم بديل</span>
                          {tempSubstituteId === null && (
                            <CheckCircle className="w-5 h-5 text-amber-600" weight="fill" />
                          )}
                        </div>
                      </button>

                      {/* Teacher list */}
                      {availableSubs.map((teacher) => {
                        const isSelected = tempSubstituteId === teacher.id
                        return (
                          <button
                            key={teacher.id}
                            onClick={() => setTempSubstituteId(teacher.id)}
                            className={`w-full p-4 border-2 rounded-lg transition-all text-right ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-lg">{teacher.name}</p>
                                  {teacher.isRecommended && (
                                    <Badge className="bg-emerald-600 text-xs gap-1">
                                      <Sparkle className="w-3 h-3" weight="fill" />
                                      مقترح
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="w-4 h-4" />
                                    {teacher.subject}
                                    {teacher.isSameSubject && (
                                      <Badge variant="outline" className="text-[10px] ml-1 text-emerald-600 border-emerald-600">
                                        ✓ نفس المادة
                                      </Badge>
                                    )}
                                  </span>
                                  {teacher.substituteCount > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      {teacher.substituteCount} احتياط سابق
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-6 h-6 text-emerald-600" weight="fill" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <Alert className="border-amber-500 bg-amber-50">
                    <Warning className="h-5 w-5 text-amber-600" />
                    <AlertDescription className="text-amber-900">
                      لا يوجد معلمين متفرغين لهذه الحصة. يمكنك فقط إزالة البديل الحالي.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Save and cancel buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditDialog(false)
                      setEditingAbsenceId(null)
                      setTempSubstituteId(null)
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={() => handleSaveEdit(editingAbsenceId, tempSubstituteId)}
                    className="gap-2"
                    disabled={tempSubstituteId === currentSubstitute}
                  >
                    <CheckCircle className="w-4 h-4" weight="fill" />
                    حفظ التعديل
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
