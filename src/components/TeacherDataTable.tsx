import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScheduleData } from '@/lib/types'
import { User, Books, Clock, CheckCircle, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface TeacherDataTableProps {
  scheduleData: ScheduleData
  onApprove?: (scheduleData: ScheduleData) => void
  onDelete?: () => void
}

interface TeacherDisplayData {
  id: string
  name: string
  subject: string
  weeklyPeriods: number
}

export function TeacherDataTable({ scheduleData, onApprove, onDelete }: TeacherDataTableProps) {
  const isApproved = scheduleData.approved || false

  const teacherData = useMemo<TeacherDisplayData[]>(() => {
    const teacherScheduleCount = new Map<string, number>()

    if (scheduleData.schedules && Array.isArray(scheduleData.schedules)) {
      scheduleData.schedules.forEach((schedule) => {
        const teacherId = schedule.teacherID
        if (!teacherScheduleCount.has(teacherId)) {
          teacherScheduleCount.set(teacherId, 0)
        }
        teacherScheduleCount.set(teacherId, teacherScheduleCount.get(teacherId)! + 1)
      })
    }

    return (scheduleData.teachers || []).map((teacher) => {
      const originalId = teacher.originalId || teacher.id
      const weeklyPeriods = teacherScheduleCount.get(originalId) || 0

      return {
        id: teacher.id,
        name: teacher.name,
        subject: teacher.subject || 'غير محدد',
        weeklyPeriods,
      }
    }).sort((a, b) => a.name.localeCompare(b.name, 'ar'))
  }, [scheduleData])

  const totalPeriods = useMemo(() => {
    return teacherData.reduce((sum, t) => sum + t.weeklyPeriods, 0)
  }, [teacherData])

  const handleDelete = () => {
    if (window.confirm('⚠️ هل أنت متأكد من حذف هذه البيانات؟ سيتم حذف جميع معلومات المعلمين والحصص المرتبطة بهذا الجدول.')) {
      onDelete?.()
      toast.success('🗑️ تم حذف البيانات بنجاح')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              بيانات المعلمين
              {isApproved && (
                <Badge className="bg-accent text-accent-foreground mr-2">
                  ✓ معتمد
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              عرض أسماء المعلمين مع المواد وعدد الحصص الأسبوعية لكل معلم
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="destructive"
              size="lg"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash className="w-5 h-5" />
              حذف البيانات
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isApproved && scheduleData.approvedDate && (
          <Alert className="mb-6 bg-accent/10 border-accent">
            <CheckCircle className="h-5 w-5 text-accent" />
            <AlertDescription>
              <strong>✓ جدول معتمد:</strong> تم اعتماد هذه البيانات تلقائيًا عند الرفع في {new Date(scheduleData.approvedDate).toLocaleString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}. يمكنك الآن استخدام جميع أزرار النظام.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">عدد المعلمين</p>
                  <p className="text-3xl font-bold text-primary">{teacherData.length}</p>
                </div>
                <User className="w-10 h-10 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الحصص</p>
                  <p className="text-3xl font-bold text-accent">{totalPeriods}</p>
                </div>
                <Clock className="w-10 h-10 text-accent/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/5 border-secondary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">متوسط الحصص</p>
                  <p className="text-3xl font-bold text-secondary-foreground">
                    {teacherData.length > 0 ? (totalPeriods / teacherData.length).toFixed(1) : 0}
                  </p>
                </div>
                <Books className="w-10 h-10 text-secondary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-right font-bold w-12">#</TableHead>
                <TableHead className="text-right font-bold">اسم المعلم</TableHead>
                <TableHead className="text-right font-bold">المادة</TableHead>
                <TableHead className="text-center font-bold w-40">عدد الحصص الأسبوعية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacherData.length > 0 ? (
                teacherData.map((teacher, index) => (
                  <TableRow key={teacher.id} className="hover:bg-muted/50">
                    <TableCell className="text-center text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>
                      <span className="text-primary">{teacher.subject}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {teacher.weeklyPeriods}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    لا توجد بيانات معلمين
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
