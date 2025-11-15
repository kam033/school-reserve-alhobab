import { useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Absence } from '@/lib/types'
import { useScheduleStorage } from '@/lib/useScheduleStorage'
import { WeeklyChart } from '@/components/WeeklyChart'

export function StatsPage() {
  const { schedules, approvedSchedules } = useScheduleStorage()
  const [absences] = useKV<Absence[]>('absences', [])

  // جمع جميع الحصص من الجداول المعتمدة
  const allScheduleEntries = useMemo(() => {
    return approvedSchedules.flatMap(s => s.schedules || [])
  }, [approvedSchedules])

  const stats = useMemo(() => {
    const totalSchedules = schedules.length
    const approvedCount = approvedSchedules.length
    const unapprovedSchedules = totalSchedules - approvedCount

    const allTeachers = schedules.flatMap(s => s.teachers || [])
    const uniqueTeachers = new Set(allTeachers.map(t => t.id)).size

    const totalAbsences = absences?.length || 0

    console.log('📊 Stats calculated:', {
      total: totalSchedules,
      approved: approvedCount,
      teachers: uniqueTeachers
    })

    return [
      { title: 'عدد الجداول الإجمالي', value: totalSchedules, icon: '📘' },
      { title: 'الجداول المعتمدة', value: approvedCount, icon: '✅' },
      { title: 'الجداول غير المعتمدة', value: unapprovedSchedules, icon: '⚠️' },
      { title: 'عدد المعلمين', value: uniqueTeachers, icon: '👨‍🏫' },
      { title: 'عدد الغيابات المسجلة', value: totalAbsences, icon: '🚫' },
    ]
  }, [schedules, approvedSchedules, absences])

  return (
    <div className="p-6" dir="rtl">
      <h2 className="text-2xl font-bold mb-6 text-center">📊 صفحة الإحصائيات</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-4 flex items-center justify-between border border-gray-200"
          >
            <div>
              <div className="text-lg font-semibold text-gray-700">{stat.title}</div>
              <div className="text-2xl font-bold text-emerald-600">{stat.value}</div>
            </div>
            <div className="text-3xl">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* الرسم البياني */}
      {allScheduleEntries.length > 0 && (
        <div className="mt-8">
          <WeeklyChart schedules={allScheduleEntries} />
        </div>
      )}

      <div className="mt-8 text-sm text-gray-500 text-center">
        * الإحصائيات والرسوم البيانية يتم تحديثها تلقائيًا من البيانات الفعلية
      </div>
    </div>
  )
}
