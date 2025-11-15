import { Teacher, Period, ScheduleData, Class, Subject, Classroom, Day, TimeTableSchedule } from './types'

export interface ParseResult {
  success: boolean
  data?: ScheduleData
  errors: string[]
  warnings: string[]
}

function cleanId(id: string): string {
  if (!id) return ''
  return id.replace(/^\*+/, '').trim()
}

function checkEncodingIssues(text: string): boolean {
  return text.includes('�') || text.includes('?') || /[\uFFFD]/.test(text)
}

export function parseXMLFile(xmlContent: string, schoolId: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  const teachers: Teacher[] = []
  const periods: Period[] = []
  const classes: Class[] = []
  const subjects: Subject[] = []
  const classrooms: Classroom[] = []
  const days: Day[] = []
  const schedules: TimeTableSchedule[] = []

  try {
    if (!xmlContent.includes('<?xml')) {
      warnings.push('تحذير: الملف لا يحتوي على تعريف XML. يُفضل إضافة: <?xml version="1.0" encoding="UTF-8"?>')
    }

    if (!xmlContent.toLowerCase().includes('utf-8') && !xmlContent.toLowerCase().includes('utf8')) {
      warnings.push('تحذير: لم يتم تحديد ترميز UTF-8 في الملف. قد تظهر الأحرف العربية بشكل خاطئ.')
    }

    let cleanedContent = xmlContent
    const starMatches = xmlContent.match(/="\*\d+"/g)
    if (starMatches && starMatches.length > 0) {
      warnings.push(`تم العثور على ${starMatches.length} معرّف يحتوي على نجمة (*). سيتم إزالتها تلقائياً.`)
      cleanedContent = xmlContent.replace(/="\*(\d+)"/g, '="$1"')
    }

    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(cleanedContent, 'text/xml')

    const parserError = xmlDoc.querySelector('parsererror')
    if (parserError) {
      errors.push('ملف XML غير صالح. تحقق من صحة الملف وتأكد من إغلاق جميع الوسوم.')
      return { success: false, errors, warnings }
    }

    const dayElements = xmlDoc.querySelectorAll('day')
    dayElements.forEach((dayEl) => {
      const name = dayEl.getAttribute('name') || ''
      const short = dayEl.getAttribute('short') || ''
      const dayNum = dayEl.getAttribute('day') || '0'
      
      if (name && checkEncodingIssues(name)) {
        warnings.push(`مشكلة ترميز في اسم اليوم: ${name}`)
      }

      days.push({
        day: dayNum,
        name,
        short,
      })
    })

    const periodTimings = new Map<number, { startTime: string; endTime: string }>()
    const periodElements = xmlDoc.querySelectorAll('period')
    periodElements.forEach((periodEl) => {
      const period = periodEl.getAttribute('period') || '0'
      const starttime = periodEl.getAttribute('starttime') || ''
      const endtime = periodEl.getAttribute('endtime') || ''

      periodTimings.set(parseInt(period) || 0, {
        startTime: starttime,
        endTime: endtime,
      })
    })

    const teacherElements = xmlDoc.querySelectorAll('teacher')
    const teacherIds = new Set<string>()

    teacherElements.forEach((teacherEl) => {
      let id = cleanId(teacherEl.getAttribute('id') || '')
      const name = teacherEl.getAttribute('name') || ''
      const short = teacherEl.getAttribute('short') || ''
      const color = teacherEl.getAttribute('color') || ''

      if (!id || !name) {
        warnings.push(`معلم بدون معرف أو اسم تم تجاهله`)
        return
      }

      if (teacherIds.has(id)) {
        warnings.push(`تكرار المعرف: ${id} للمعلم ${name}`)
        return
      }

      if (checkEncodingIssues(name)) {
        errors.push(`مشكلة في الترميز: "${name}" - يُرجى حفظ الملف بترميز UTF-8 بدون BOM`)
      }

      teacherIds.add(id)

      teachers.push({
        id: `${schoolId}-${id}`,
        originalId: id,
        name,
        short,
        subject: '',
        schoolId,
        color,
      })
    })

    const classElements = xmlDoc.querySelectorAll('class')
    classElements.forEach((classEl) => {
      let id = cleanId(classEl.getAttribute('id') || '')
      const name = classEl.getAttribute('name') || ''
      const short = classEl.getAttribute('short') || ''
      const classroomids = cleanId(classEl.getAttribute('classroomids') || '')
      const teacherid = cleanId(classEl.getAttribute('teacherid') || '')
      const grade = classEl.getAttribute('grade') || ''

      if (!id || !name) {
        warnings.push(`فصل بدون معرف أو اسم تم تجاهله`)
        return
      }

      if (checkEncodingIssues(name)) {
        errors.push(`مشكلة في ترميز اسم الفصل: "${name}"`)
      }

      classes.push({
        id: `${schoolId}-${id}`,
        originalId: id,
        name,
        short,
        classroomids,
        teacherid,
        grade,
      })
    })

    const subjectElements = xmlDoc.querySelectorAll('subject')
    subjectElements.forEach((subjectEl) => {
      let id = cleanId(subjectEl.getAttribute('id') || '')
      const name = subjectEl.getAttribute('name') || ''
      const short = subjectEl.getAttribute('short') || ''

      if (!id || !name) {
        warnings.push(`مادة بدون معرف أو اسم تم تجاهلها`)
        return
      }

      if (checkEncodingIssues(name)) {
        errors.push(`مشكلة في ترميز اسم المادة: "${name}"`)
      }

      subjects.push({
        id: `${schoolId}-${id}`,
        originalId: id,
        name,
        short,
      })
    })

    const classroomElements = xmlDoc.querySelectorAll('classroom')
    classroomElements.forEach((classroomEl) => {
      let id = cleanId(classroomEl.getAttribute('id') || '')
      const name = classroomEl.getAttribute('name') || ''
      const short = classroomEl.getAttribute('short') || ''

      if (!id || !name) {
        warnings.push(`غرفة بدون معرف أو اسم تم تجاهلها`)
        return
      }

      if (checkEncodingIssues(name)) {
        errors.push(`مشكلة في ترميز اسم الغرفة: "${name}"`)
      }

      classrooms.push({
        id: `${schoolId}-${id}`,
        originalId: id,
        name,
        short,
      })
    })

    const scheduleElements = xmlDoc.querySelectorAll('TimeTableSchedule')
    scheduleElements.forEach((scheduleEl, index) => {
      const dayID = cleanId(scheduleEl.getAttribute('DayID') || '')
      const period = cleanId(scheduleEl.getAttribute('Period') || '')
      const lengthID = cleanId(scheduleEl.getAttribute('LengthID') || '')
      const schoolRoomID = cleanId(scheduleEl.getAttribute('SchoolRoomID') || '')
      const subjectGradeID = cleanId(scheduleEl.getAttribute('SubjectGradeID') || '')
      const classID = cleanId(scheduleEl.getAttribute('ClassID') || '')
      const optionalClassID = cleanId(scheduleEl.getAttribute('OptionalClassID') || '')
      const teacherID = cleanId(scheduleEl.getAttribute('TeacherID') || '')

      if (!dayID || !period || !teacherID) {
        warnings.push(`جدول حصة رقم ${index + 1} ناقص البيانات المطلوبة (DayID, Period, TeacherID)`)
        return
      }

      schedules.push({
        id: `${schoolId}-schedule-${index}`,
        dayID,
        period: parseInt(period) || 0,
        lengthID,
        schoolRoomID,
        subjectGradeID,
        classID,
        optionalClassID,
        teacherID,
      })

      const day = days.find((d) => d.day === dayID)
      const subject = subjects.find((s) => s.originalId === subjectGradeID)
      const classObj = classes.find((c) => c.originalId === classID)
      const timing = periodTimings.get(parseInt(period) || 0)

      periods.push({
        id: `${schoolId}-period-${index}`,
        day: day?.name || '',
        periodNumber: parseInt(period) || 0,
        teacherId: `${schoolId}-${teacherID}`,
        subject: subject?.name || '',
        className: classObj?.name || '',
        startTime: timing?.startTime || '',
        endTime: timing?.endTime || '',
      })
    })

    const teacherSubjectMap = new Map<string, Set<string>>()
    const teacherScheduleCount = new Map<string, number>()

    schedules.forEach((schedule) => {
      const teacherId = schedule.teacherID
      
      if (!teacherScheduleCount.has(teacherId)) {
        teacherScheduleCount.set(teacherId, 0)
      }
      teacherScheduleCount.set(teacherId, teacherScheduleCount.get(teacherId)! + 1)

      if (schedule.subjectGradeID) {
        if (!teacherSubjectMap.has(teacherId)) {
          teacherSubjectMap.set(teacherId, new Set())
        }
        teacherSubjectMap.get(teacherId)!.add(schedule.subjectGradeID)
      }
    })

    teachers.forEach((teacher) => {
      const originalId = teacher.originalId || teacher.id
      const subjectIds = teacherSubjectMap.get(originalId)
      
      if (subjectIds && subjectIds.size > 0) {
        const subjectNames: string[] = []
        subjectIds.forEach((subjectId) => {
          const subject = subjects.find((s) => s.originalId === subjectId)
          if (subject) {
            subjectNames.push(subject.name)
          }
        })
        
        if (subjectNames.length > 0) {
          teacher.subject = subjectNames.join(' / ')
        }
      }
    })

    if (teachers.length === 0) {
      errors.push('لم يتم العثور على أي معلمين في الملف. تأكد من وجود قسم <teachers> بالملف.')
    }

    if (schedules.length === 0) {
      warnings.push('لم يتم العثور على جداول حصص. تأكد من وجود قسم <TimeTableSchedules> بالملف.')
    }

    const scheduleData: ScheduleData = {
      teachers,
      periods,
      classes,
      subjects,
      classrooms,
      days,
      schedules,
      schoolId,
      uploadDate: new Date().toISOString(),
    }

    if (errors.length === 0) {
      warnings.push(`✓ تم استخراج ${teachers.length} معلم، ${classes.length} فصل، ${schedules.length} حصة`)
    }

    return {
      success: errors.length === 0,
      data: scheduleData,
      errors,
      warnings,
    }
  } catch (error) {
    errors.push(`خطأ في قراءة الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
    return { success: false, errors, warnings }
  }
}

export function validateXMLEncoding(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const content = e.target?.result as string
      const result = parseXMLFile(content, 'temp')
      resolve(result)
    }

    reader.onerror = () => {
      resolve({
        success: false,
        errors: ['فشل في قراءة الملف'],
        warnings: [],
      })
    }

    reader.readAsText(file, 'UTF-8')
  })
}
