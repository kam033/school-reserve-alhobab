import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScheduleData, Teacher } from '@/lib/types'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useScheduleStorage } from '@/lib/useScheduleStorage'

interface ScheduleCell {
  subject: string
  className: string
  day: string
  periodNumber: number
  dayName: string
  startTime?: string
  endTime?: string
}

export function TeacherSchedulesPage() {
  const { approvedSchedules } = useScheduleStorage()
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')

  console.log('📊 TeacherSchedulesPage - Approved schedules:', approvedSchedules.length)

  const allTeachers = useMemo(() => {
    if (approvedSchedules.length === 0) return []
    return approvedSchedules.flatMap((schedule) => schedule.teachers || [])
  }, [approvedSchedules])

  const selectedTeacher = useMemo(() => {
    return allTeachers.find((t) => t.id === selectedTeacherId)
  }, [allTeachers, selectedTeacherId])

  const scheduleData = useMemo(() => {
    if (approvedSchedules.length === 0) return null
    return approvedSchedules[approvedSchedules.length - 1]
  }, [approvedSchedules])

  const dayMapping = useMemo(() => {
    if (!scheduleData?.days) return {}
    const mapping: Record<string, string> = {}
    scheduleData.days.forEach((day) => {
      mapping[day.day] = day.name
    })
    return mapping
  }, [scheduleData])

  const periodTimes = useMemo(() => {
    if (!scheduleData?.periods) return {}
    const times: Record<number, { start: string; end: string }> = {}
    scheduleData.periods.forEach((period) => {
      if (period.startTime && period.endTime) {
        times[period.periodNumber] = {
          start: period.startTime,
          end: period.endTime,
        }
      }
    })
    return times
  }, [scheduleData])

  const teacherSchedule = useMemo((): ScheduleCell[][] => {
    if (!scheduleData || !selectedTeacher) return []

    const teacherOriginalId = selectedTeacher.originalId || selectedTeacher.id.split('-').pop()
    const teacherSchedules = scheduleData.schedules.filter(
      (s) => s.teacherID === teacherOriginalId
    )

    const daysOrder = ['1', '2', '3', '4', '5']
    const maxPeriods = 8

    const schedule: ScheduleCell[][] = []

    for (let period = 1; period <= maxPeriods; period++) {
      const row: ScheduleCell[] = []
      for (const dayId of daysOrder) {
        const scheduleItem = teacherSchedules.find(
          (s) => s.dayID === dayId && s.period === period
        )

        if (scheduleItem) {
          const subject = scheduleData.subjects.find(
            (s) => s.originalId === scheduleItem.subjectGradeID
          )
          const classItem = scheduleData.classes.find(
            (c) => c.originalId === scheduleItem.classID
          )

          const dayName = dayMapping[dayId] || `يوم ${dayId}`
          const times = periodTimes[period]

          row.push({
            subject: subject?.name || 'مادة غير معروفة',
            className: classItem?.name || '',
            day: dayId,
            periodNumber: period,
            dayName,
            startTime: times?.start,
            endTime: times?.end,
          })
        } else {
          row.push({
            subject: '',
            className: '',
            day: dayId,
            periodNumber: period,
            dayName: dayMapping[dayId] || `يوم ${dayId}`,
          })
        }
      }
      schedule.push(row)
    }

    return schedule
  }, [scheduleData, selectedTeacher, dayMapping, periodTimes])

  const subjectColors = useMemo(() => {
    if (!scheduleData?.subjects) return {}

    const colors = [
      'oklch(0.70 0.15 264)',
      'oklch(0.65 0.18 140)',
      'oklch(0.68 0.16 40)',
      'oklch(0.72 0.14 200)',
      'oklch(0.66 0.17 320)',
      'oklch(0.69 0.15 180)',
      'oklch(0.71 0.13 280)',
      'oklch(0.67 0.16 100)',
      'oklch(0.73 0.12 60)',
      'oklch(0.68 0.14 240)',
    ]

    const colorMap: Record<string, string> = {}
    scheduleData.subjects.forEach((subject, index) => {
      colorMap[subject.name] = colors[index % colors.length]
    })

    return colorMap
  }, [scheduleData])

  const totalWeeklyPeriods = useMemo(() => {
    return teacherSchedule.flat().filter((cell) => cell.subject).length
  }, [teacherSchedule])

  const navigateTeacher = (direction: 'next' | 'prev') => {
    const currentIndex = allTeachers.findIndex((t) => t.id === selectedTeacherId)
    if (currentIndex === -1) return

    let newIndex: number
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % allTeachers.length
    } else {
      newIndex = currentIndex === 0 ? allTeachers.length - 1 : currentIndex - 1
    }

    setSelectedTeacherId(allTeachers[newIndex].id)
  }

  const daysOrder = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">🧾 جدول المعلمين الأسبوعي</h1>
        <p className="text-muted-foreground mb-8">
          عرض تفصيلي للجدول الأسبوعي مع الأيام والحصص والمواد بالألوان
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>اختر المعلم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateTeacher('prev')}
                disabled={!selectedTeacherId || allTeachers.length === 0}
              >
                <CaretRight className="w-5 h-5" />
              </Button>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="اختر معلم لعرض جدوله" />
                </SelectTrigger>
                <SelectContent>
                  {allTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} - {teacher.subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateTeacher('next')}
                disabled={!selectedTeacherId || allTeachers.length === 0}
              >
                <CaretLeft className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedTeacher && (
          <>
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTeacher.name}</h2>
                    <p className="text-muted-foreground">{selectedTeacher.subject}</p>
                  </div>
                  <div className="text-center bg-primary/10 px-8 py-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      عدد الحصص الأسبوعية
                    </p>
                    <p className="text-4xl font-bold text-primary">{totalWeeklyPeriods}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الجدول الأسبوعي التفصيلي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <TooltipProvider>
                    <table className="w-full border-collapse min-w-[800px]">
                      <thead>
                        <tr>
                          <th className="border border-border p-4 bg-muted text-center font-bold text-base sticky right-0 z-10">
                            الحصة
                          </th>
                          {daysOrder.map((day) => (
                            <th
                              key={day}
                              className="border border-border p-4 bg-muted text-center font-bold text-base min-w-[140px]"
                            >
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {teacherSchedule.map((row, periodIndex) => (
                          <tr key={periodIndex}>
                            <td className="border border-border p-3 bg-muted/50 text-center font-bold text-lg sticky right-0 z-10">
                              {periodIndex + 1}
                            </td>
                            {row.map((cell, dayIndex) => (
                              <td
                                key={dayIndex}
                                className="border border-border p-2 text-center align-middle min-h-[80px]"
                              >
                                {cell.subject ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div
                                        className="rounded-lg p-3 transition-all hover:scale-105 hover:shadow-md cursor-pointer min-h-[70px] flex flex-col justify-center"
                                        style={{
                                          backgroundColor: subjectColors[cell.subject],
                                          color: 'oklch(0.99 0 0)',
                                        }}
                                      >
                                        <p className="font-bold text-sm mb-1">
                                          {cell.subject}
                                        </p>
                                        {cell.className && (
                                          <p className="text-xs opacity-90 font-medium">
                                            {cell.className}
                                          </p>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs" dir="rtl">
                                      <div className="space-y-1 text-sm">
                                        <p className="font-bold">
                                          📘 المادة: {cell.subject}
                                        </p>
                                        {cell.className && (
                                          <p>🏫 الصف: {cell.className}</p>
                                        )}
                                        <p>⏰ الحصة: {cell.periodNumber}</p>
                                        <p>🗓️ اليوم: {cell.dayName}</p>
                                        {cell.startTime && cell.endTime && (
                                          <p>
                                            🕐 الوقت: {cell.startTime} - {cell.endTime}
                                          </p>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <div className="text-muted-foreground text-2xl py-4">
                                    –
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TooltipProvider>
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-3">مفتاح الألوان:</p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(subjectColors).map(([subject, color]) => (
                      <div key={subject} className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-border"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm">{subject}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!selectedTeacher && allTeachers.length === 0 && (
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
                  <Button onClick={() => window.history.back()} variant="outline">
                    العودة للصفحة الرئيسية
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
