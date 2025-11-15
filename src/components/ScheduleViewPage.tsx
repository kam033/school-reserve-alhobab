import { useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ScheduleData } from '@/lib/types'
import { UsersThree, Books, Door, Calendar, Clock } from '@phosphor-icons/react'
import { useApprovedSchedules } from '@/lib/useApprovedSchedules'

export function ScheduleViewPage() {
  const { allSchedules } = useApprovedSchedules()

  const approvedSchedules = useMemo(() => {
    if (!allSchedules || !Array.isArray(allSchedules) || allSchedules.length === 0) return []
    return allSchedules.filter((s) => s.approved)
  }, [allSchedules])

  if (approvedSchedules.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Card className="max-w-md border-amber-500/50 bg-amber-50/50">
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <p className="text-lg font-medium text-foreground">
                ⚠️ لا يوجد جدول معتمد
              </p>
              <p className="text-muted-foreground">
                يرجى رفع ملف XML واعتماده أولاً من صفحة "تحميل الجدول"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const latestSchedule = approvedSchedules[approvedSchedules.length - 1]

  const getDayName = (dayID: string): string => {
    if (!latestSchedule.days || !Array.isArray(latestSchedule.days)) return `يوم ${dayID}`
    const day = latestSchedule.days.find((d) => d.day === dayID)
    return day?.name || `يوم ${dayID}`
  }

  const getTeacherName = (teacherID: string): string => {
    if (!latestSchedule.teachers || !Array.isArray(latestSchedule.teachers)) return `معلم ${teacherID}`
    const teacher = latestSchedule.teachers.find(
      (t) => t.originalId === teacherID || t.id.endsWith(`-${teacherID}`)
    )
    return teacher?.name || `معلم ${teacherID}`
  }

  const getClassName = (classID: string): string => {
    if (!latestSchedule.classes || !Array.isArray(latestSchedule.classes)) return `فصل ${classID}`
    const cls = latestSchedule.classes.find(
      (c) => c.originalId === classID || c.id.endsWith(`-${classID}`)
    )
    return cls?.name || `فصل ${classID}`
  }

  const getSubjectName = (subjectID: string): string => {
    if (!latestSchedule.subjects || !Array.isArray(latestSchedule.subjects)) return `مادة ${subjectID}`
    const subject = latestSchedule.subjects.find(
      (s) => s.originalId === subjectID || s.id.endsWith(`-${subjectID}`)
    )
    return subject?.name || `مادة ${subjectID}`
  }

  const getClassroomName = (classroomID: string): string => {
    if (!latestSchedule.classrooms || !Array.isArray(latestSchedule.classrooms)) return `غرفة ${classroomID}`
    const classroom = latestSchedule.classrooms.find(
      (c) => c.originalId === classroomID || c.id.endsWith(`-${classroomID}`)
    )
    return classroom?.name || `غرفة ${classroomID}`
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">عرض الجدول المدرسي</h1>
          <p className="text-muted-foreground">
            تم التحميل في: {new Date(latestSchedule.uploadDate).toLocaleDateString('ar-SA')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المعلمون</CardTitle>
              <UsersThree className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestSchedule.teachers?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الفصول</CardTitle>
              <Door className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestSchedule.classes?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المواد</CardTitle>
              <Books className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestSchedule.subjects?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الأيام</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestSchedule.days?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الحصص</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestSchedule.schedules?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="schedules" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="schedules">الجدول</TabsTrigger>
            <TabsTrigger value="teachers">المعلمون</TabsTrigger>
            <TabsTrigger value="classes">الفصول</TabsTrigger>
            <TabsTrigger value="subjects">المواد</TabsTrigger>
            <TabsTrigger value="classrooms">الغرف</TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>جدول الحصص الأسبوعي</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اليوم</TableHead>
                        <TableHead className="text-right">الحصة</TableHead>
                        <TableHead className="text-right">المعلم</TableHead>
                        <TableHead className="text-right">الفصل</TableHead>
                        <TableHead className="text-right">المادة</TableHead>
                        <TableHead className="text-right">الغرفة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latestSchedule.schedules && latestSchedule.schedules.length > 0 ? (
                        latestSchedule.schedules.map((schedule) => (
                          <TableRow key={schedule.id}>
                            <TableCell>{getDayName(schedule.dayID)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{schedule.period}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {getTeacherName(schedule.teacherID)}
                            </TableCell>
                            <TableCell>{schedule.classID ? getClassName(schedule.classID) : '-'}</TableCell>
                            <TableCell>{schedule.subjectGradeID ? getSubjectName(schedule.subjectGradeID) : '-'}</TableCell>
                            <TableCell>{schedule.schoolRoomID ? getClassroomName(schedule.schoolRoomID) : '-'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            لا توجد حصص مسجلة
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>قائمة المعلمين</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الرقم</TableHead>
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="text-right">الاسم المختصر</TableHead>
                        <TableHead className="text-right">المادة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latestSchedule.teachers && latestSchedule.teachers.length > 0 ? (
                        latestSchedule.teachers.map((teacher) => (
                          <TableRow key={teacher.id}>
                            <TableCell>{teacher.originalId}</TableCell>
                            <TableCell className="font-medium">{teacher.name}</TableCell>
                            <TableCell>{teacher.short || '-'}</TableCell>
                            <TableCell>
                              <span className="text-primary">{teacher.subject || 'غير محدد'}</span>
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
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>قائمة الفصول</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الرقم</TableHead>
                        <TableHead className="text-right">اسم الفصل</TableHead>
                        <TableHead className="text-right">الاسم المختصر</TableHead>
                        <TableHead className="text-right">الصف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latestSchedule.classes && latestSchedule.classes.length > 0 ? (
                        latestSchedule.classes.map((cls) => (
                          <TableRow key={cls.id}>
                            <TableCell>{cls.originalId}</TableCell>
                            <TableCell className="font-medium">{cls.name}</TableCell>
                            <TableCell>{cls.short}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{cls.grade || '-'}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            لا توجد بيانات فصول
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>قائمة المواد</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الرقم</TableHead>
                        <TableHead className="text-right">اسم المادة</TableHead>
                        <TableHead className="text-right">الاسم المختصر</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latestSchedule.subjects && latestSchedule.subjects.length > 0 ? (
                        latestSchedule.subjects.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell>{subject.originalId}</TableCell>
                            <TableCell className="font-medium">{subject.name}</TableCell>
                            <TableCell>{subject.short}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            لا توجد بيانات مواد
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classrooms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>قائمة الغرف الدراسية</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الرقم</TableHead>
                        <TableHead className="text-right">اسم الغرفة</TableHead>
                        <TableHead className="text-right">الاسم المختصر</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latestSchedule.classrooms && latestSchedule.classrooms.length > 0 ? (
                        latestSchedule.classrooms.map((classroom) => (
                          <TableRow key={classroom.id}>
                            <TableCell>{classroom.originalId}</TableCell>
                            <TableCell className="font-medium">{classroom.name}</TableCell>
                            <TableCell>{classroom.short}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            لا توجد بيانات غرف دراسية
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
