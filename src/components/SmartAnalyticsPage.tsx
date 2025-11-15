import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Sparkle, ChartBar, User, Scales, TrendUp, Warning } from '@phosphor-icons/react'
import { useApprovedSchedules } from '@/lib/useApprovedSchedules'
import { Teacher } from '@/lib/types'

export function SmartAnalyticsPage() {
  const { approvedSchedules, allSchedules } = useApprovedSchedules()
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  // حساب إحصائيات المعلمين
  const teacherStats = useMemo(() => {
    if (approvedSchedules.length === 0) return []

    const stats = new Map<string, { teacher: Teacher; periodCount: number; subjects: Set<string> }>()

    approvedSchedules.forEach(schedule => {
      schedule.teachers?.forEach(teacher => {
        if (!stats.has(teacher.id)) {
          stats.set(teacher.id, {
            teacher,
            periodCount: 0,
            subjects: new Set()
          })
        }
      })

      schedule.schedules?.forEach(sched => {
        const teacher = schedule.teachers?.find(t =>
          t.originalId === sched.teacherID || t.id === sched.teacherID
        )
        if (teacher && stats.has(teacher.id)) {
          const stat = stats.get(teacher.id)!
          stat.periodCount++

          const subject = schedule.subjects?.find(s => s.originalId === sched.subjectGradeID)
          if (subject) {
            stat.subjects.add(subject.name)
          }
        }
      })
    })

    return Array.from(stats.values())
      .sort((a, b) => b.periodCount - a.periodCount)
  }, [approvedSchedules])

  // حساب إحصائيات المواد
  const subjectStats = useMemo(() => {
    if (approvedSchedules.length === 0) return []

    const stats = new Map<string, number>()

    approvedSchedules.forEach(schedule => {
      schedule.schedules?.forEach(sched => {
        const subject = schedule.subjects?.find(s => s.originalId === sched.subjectGradeID)
        if (subject) {
          stats.set(subject.name, (stats.get(subject.name) || 0) + 1)
        }
      })
    })

    return Array.from(stats.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [approvedSchedules])

  // حساب مؤشر العدالة
  const fairnessAnalysis = useMemo(() => {
    if (teacherStats.length === 0) {
      return { index: 0, mean: 0, stdDev: 0, min: 0, max: 0, status: 'unknown' as const }
    }

    const counts = teacherStats.map(s => s.periodCount)
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length
    const stdDev = Math.sqrt(variance)
    const min = Math.min(...counts)
    const max = Math.max(...counts)

    // مؤشر العدالة (0-100)
    const fairnessIndex = mean > 0 ? Math.max(0, 100 - (stdDev / mean) * 100) : 0

    let status: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' = 'unknown'
    if (fairnessIndex >= 85) status = 'excellent'
    else if (fairnessIndex >= 70) status = 'good'
    else if (fairnessIndex >= 50) status = 'fair'
    else status = 'poor'

    return { index: fairnessIndex, mean, stdDev, min, max, status }
  }, [teacherStats])

  // المعلمون المتاحون للبديل
  const getAvailableSubstitutes = (day: string, period: number, subject: string) => {
    if (approvedSchedules.length === 0) return []

    const schedule = approvedSchedules[0]
    const busyTeachers = new Set<string>()

    // العثور على المعلمين المشغولين في نفس الوقت
    schedule.schedules
      ?.filter(s => s.dayID === day && s.period === period)
      .forEach(s => busyTeachers.add(s.teacherID))

    // المعلمون المتاحون الذين يدرسون نفس المادة
    return teacherStats
      .filter(stat => {
        const teacherId = stat.teacher.originalId || stat.teacher.id
        const isBusy = busyTeachers.has(teacherId)
        const teachesSubject = subject === 'all' || stat.subjects.has(subject)
        return !isBusy && teachesSubject
      })
      .map(stat => ({
        ...stat.teacher,
        periodCount: stat.periodCount,
        fairnessScore: fairnessAnalysis.mean > 0
          ? 100 - Math.abs(stat.periodCount - fairnessAnalysis.mean) / fairnessAnalysis.mean * 100
          : 50
      }))
      .sort((a, b) => b.fairnessScore - a.fairnessScore)
  }

  if (approvedSchedules.length === 0) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto px-4 py-8">
          <Card className="border-amber-500/50 bg-amber-50/50">
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                {allSchedules && allSchedules.length > 0 ? (
                  <>
                    <p className="text-lg font-medium text-foreground">⚠️ يوجد جدول لكن غير معتمد</p>
                    <p className="text-muted-foreground">يرجى اعتماد الجدول من صفحة رفع XML</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium text-foreground">⚠️ لا يوجد جدول معتمد</p>
                    <p className="text-muted-foreground">يرجى رفع ملف XML واعتماده أولاً</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const maxPeriods = Math.max(...teacherStats.map(s => s.periodCount))
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkle className="w-8 h-8 text-primary" weight="fill" />
            الرسم البياني الذكي لإدارة الحصص
          </h1>
          <p className="text-muted-foreground">
            تم العثور على جدول معتمد ✅ جاهز للتحليل.
          </p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics">
              <ChartBar className="w-4 h-4 ml-2" />
              التحليل البياني
            </TabsTrigger>
            <TabsTrigger value="substitute">
              <User className="w-4 h-4 ml-2" />
              اختيار البديل
            </TabsTrigger>
            <TabsTrigger value="fairness">
              <Scales className="w-4 h-4 ml-2" />
              عدالة التوزيع
            </TabsTrigger>
          </TabsList>

          {/* 📊 التحليل البياني */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📊 توزيع الحصص على المعلمين</CardTitle>
                <CardDescription>عدد الحصص الأسبوعية لكل معلم</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teacherStats.slice(0, 10).map((stat, index) => (
                  <div key={stat.teacher.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Badge variant={index < 3 ? "default" : "outline"} className="min-w-8">
                          #{index + 1}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium">{stat.teacher.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {Array.from(stat.subjects).join('، ')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {stat.periodCount} حصة
                      </Badge>
                    </div>
                    <Progress
                      value={(stat.periodCount / maxPeriods) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>📚 توزيع المواد الدراسية</CardTitle>
                <CardDescription>عدد الحصص لكل مادة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjectStats.map((subject, index) => (
                    <div key={subject.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: `hsl(${(index * 360) / subjectStats.length}, 70%, 60%)`
                          }}
                        />
                        <span className="font-medium">{subject.name}</span>
                      </div>
                      <Badge>{subject.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">👥 إجمالي المعلمين</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{teacherStats.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">📚 إجمالي المواد</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{subjectStats.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">📅 إجمالي الحصص</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {teacherStats.reduce((sum, s) => sum + s.periodCount, 0)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 🤖 اختيار البديل الذكي */}
          <TabsContent value="substitute" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🤖 اختيار المعلم البديل الذكي</CardTitle>
                <CardDescription>
                  اختر اليوم والحصة والمادة لإيجاد أفضل معلم بديل متاح
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">اليوم</label>
                    <Select value={selectedDay} onValueChange={setSelectedDay}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأيام</SelectItem>
                        {days.map((day, i) => (
                          <SelectItem key={i} value={String(i + 1)}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">المادة</label>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المواد</SelectItem>
                        {subjectStats.map(s => (
                          <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button className="w-full">
                      <TrendUp className="w-4 h-4 ml-2" />
                      بحث عن بديل
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    المعلمون المتاحون (مرتبون حسب الأنسب)
                  </h3>

                  {selectedDay !== 'all' ? (
                    getAvailableSubstitutes(selectedDay, 1, selectedSubject).slice(0, 5).map((teacher, index) => (
                      <div
                        key={teacher.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Badge variant={index === 0 ? "default" : "outline"}>
                            #{index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{teacher.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {teacher.subject} • {teacher.periodCount} حصة حالياً
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-medium text-primary">
                              {teacher.fairnessScore?.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">ملاءمة</p>
                          </div>
                          <Button size="sm" variant={index === 0 ? "default" : "outline"}>
                            اختيار
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>اختر اليوم أولاً لعرض المعلمين المتاحين</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ⚖️ عدالة التوزيع */}
          <TabsContent value="fairness" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>⚖️ تحليل عدالة التوزيع</CardTitle>
                <CardDescription>
                  تقييم توازن توزيع الحصص بين المعلمين
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="text-center p-6 border rounded-lg bg-muted/30">
                      <p className="text-sm text-muted-foreground mb-2">مؤشر العدالة</p>
                      <p className="text-5xl font-bold text-primary mb-2">
                        {fairnessAnalysis.index.toFixed(1)}%
                      </p>
                      <Badge
                        variant={
                          fairnessAnalysis.status === 'excellent' ? 'default' :
                          fairnessAnalysis.status === 'good' ? 'secondary' :
                          fairnessAnalysis.status === 'fair' ? 'outline' : 'destructive'
                        }
                      >
                        {fairnessAnalysis.status === 'excellent' && '🌟 ممتاز'}
                        {fairnessAnalysis.status === 'good' && '✅ جيد'}
                        {fairnessAnalysis.status === 'fair' && '⚠️ متوسط'}
                        {fairnessAnalysis.status === 'poor' && '❌ ضعيف'}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between p-3 border rounded">
                        <span className="text-muted-foreground">متوسط الحصص</span>
                        <span className="font-bold">{fairnessAnalysis.mean.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between p-3 border rounded">
                        <span className="text-muted-foreground">الانحراف المعياري</span>
                        <span className="font-bold">{fairnessAnalysis.stdDev.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between p-3 border rounded">
                        <span className="text-muted-foreground">أقل عدد حصص</span>
                        <span className="font-bold">{fairnessAnalysis.min}</span>
                      </div>
                      <div className="flex justify-between p-3 border rounded">
                        <span className="text-muted-foreground">أكثر عدد حصص</span>
                        <span className="font-bold">{fairnessAnalysis.max}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Warning className="w-4 h-4" />
                      التوصيات
                    </h3>

                    {fairnessAnalysis.status === 'excellent' && (
                      <div className="p-4 border border-green-500 bg-green-50 rounded-lg">
                        <p className="font-medium text-green-900">✅ التوزيع متوازن بشكل ممتاز!</p>
                        <p className="text-sm text-green-700 mt-1">
                          الحصص موزعة بعدالة كبيرة بين جميع المعلمين
                        </p>
                      </div>
                    )}

                    {fairnessAnalysis.status === 'good' && (
                      <div className="p-4 border border-blue-500 bg-blue-50 rounded-lg">
                        <p className="font-medium text-blue-900">👍 التوزيع جيد</p>
                        <p className="text-sm text-blue-700 mt-1">
                          يوجد توازن جيد، مع اختلافات طفيفة يمكن تحسينها
                        </p>
                      </div>
                    )}

                    {(fairnessAnalysis.status === 'fair' || fairnessAnalysis.status === 'poor') && (
                      <div className="p-4 border border-amber-500 bg-amber-50 rounded-lg">
                        <p className="font-medium text-amber-900">⚠️ يحتاج إلى تحسين</p>
                        <p className="text-sm text-amber-700 mt-1">
                          يوجد تفاوت كبير في توزيع الحصص بين المعلمين
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">المعلمون الأكثر حصصاً:</h4>
                      {teacherStats.slice(0, 3).map((stat, i) => (
                        <div key={stat.teacher.id} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                          <span>{stat.teacher.name}</span>
                          <Badge variant="outline">{stat.periodCount} حصة</Badge>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">المعلمون الأقل حصصاً:</h4>
                      {teacherStats.slice(-3).reverse().map((stat, i) => (
                        <div key={stat.teacher.id} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                          <span>{stat.teacher.name}</span>
                          <Badge variant="outline">{stat.periodCount} حصة</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
