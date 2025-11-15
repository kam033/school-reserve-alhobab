import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CloudArrowUp, WarningCircle, CheckCircle, BookOpen, Trash } from '@phosphor-icons/react'
import { parseXMLFile } from '@/lib/xmlParser'
import { ScheduleData } from '@/lib/types'
import { XMLGuide } from '@/components/XMLGuide'
import { TeacherDataTable } from '@/components/TeacherDataTable'
import { useScheduleStorage } from '@/lib/useScheduleStorage'
import { useAuth } from '@/lib/auth'

export function XMLUploadPage() {
  const { currentUser } = useAuth()
  const { schedules: allSchedules, addSchedule, updateSchedule, deleteSchedule } = useScheduleStorage()
  const [uploading, setUploading] = useState(false)
  const [parseResult, setParseResult] = useState<{ errors: string[]; warnings: string[] } | null>(null)
  const [lastUploadedSchedule, setLastUploadedSchedule] = useState<ScheduleData | null>(null)

  const normalizeToUTF8 = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    let text = ''
    const encodings = ['utf-8', 'windows-1256', 'iso-8859-6']

    for (const encoding of encodings) {
      try {
        const decoder = new TextDecoder(encoding, { fatal: true })
        text = decoder.decode(uint8Array)
        if (text.includes('<?xml') && !text.includes('�')) break
      } catch {
        continue
      }
    }

    if (!text || text.includes('�')) {
      const decoder = new TextDecoder('utf-8', { fatal: false })
      text = decoder.decode(uint8Array)
    }

    text = text.replace(/\uFFFD/g, '').replace(/�/g, '').replace(/^\uFEFF/, '')
    const encoder = new TextEncoder()
    const utf8Bytes = encoder.encode(text)
    const utf8Decoder = new TextDecoder('utf-8')
    return utf8Decoder.decode(utf8Bytes)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setParseResult(null)
    toast.info('⏳ جاري قراءة الملف...')

    try {
      const content = await normalizeToUTF8(file)

      if (!content || content.trim().length === 0) {
        toast.error('❌ الملف فارغ أو غير صالح')
        setUploading(false)
        return
      }

      toast.info('🔍 جاري تحليل الملف...')
      // Use the user's schoolId if they're a director, otherwise generate a new one
      const schoolId = currentUser?.schoolId || `school-${Date.now()}`
      const result = parseXMLFile(content, schoolId)

      setParseResult({ errors: result.errors, warnings: result.warnings })

      if (result.success && result.data) {
        const approvedData: ScheduleData = {
          ...result.data,
          approved: true,
          approvedDate: new Date().toISOString(),
          uploadDate: new Date().toISOString(),
        }

        addSchedule(approvedData)
        setLastUploadedSchedule(approvedData)

        const teacherCount = result.data.teachers?.length || 0
        const scheduleCount = result.data.schedules?.length || 0

        console.log('✅ Schedule added successfully:', {
          teachers: teacherCount,
          schedules: scheduleCount,
          approved: true,
          totalSchedules: allSchedules.length + 1
        })

        toast.success(`✅ تم رفع الجدول واعتماده بنجاح! (${teacherCount} معلم، ${scheduleCount} حصة)`)
      } else {
        toast.error('❌ فشل رفع الملف. يرجى مراجعة الأخطاء')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف'
      toast.error(`❌ حدث خطأ أثناء معالجة الملف: ${errorMessage}`)
      setParseResult({ errors: [errorMessage], warnings: [] })
    } finally {
      setUploading(false)
    }
  }

  const handleApproveSchedule = (index: number) => {
    updateSchedule(index, {
      approved: true,
      approvedDate: new Date().toISOString()
    })
    toast.success(`✅ تم اعتماد الجدول رقم ${index + 1}`)
    console.log('✅ Schedule approved:', index)
  }

  const handleDelete = () => {
    if (allSchedules.length > 0) {
      const lastIndex = allSchedules.length - 1
      deleteSchedule(lastIndex)
      setLastUploadedSchedule(null)
      toast.success('🗑️ تم حذف آخر جدول')
    }
  }

  const handleDeleteSchedule = (index: number) => {
    if (window.confirm(`⚠️ هل أنت متأكد من حذف الجدول رقم ${index + 1}؟`)) {
      deleteSchedule(index)

      if (lastUploadedSchedule && allSchedules[index] === lastUploadedSchedule) {
        setLastUploadedSchedule(null)
        setParseResult(null)
      }

      toast.success('🗑️ تم حذف الجدول بنجاح')
    }
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">📂 رفع ملفات XML</h1>
          <p className="text-muted-foreground mb-8">قم بتحميل جدول aSc TimeTables بتنسيق XML</p>

          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <CloudArrowUp className="w-4 h-4 ml-2" />
                رفع الملف
              </TabsTrigger>
              <TabsTrigger value="guide">
                <BookOpen className="w-4 h-4 ml-2" />
                دليل التحضير
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <Card className="bg-accent/5 border-accent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    معالجة تلقائية للترميز
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-accent font-bold">1.</span>
                      <p>قراءة محتوى الملف بأي ترميز (UTF-8، ANSI، Windows-1256، أو غيره)</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-accent font-bold">2.</span>
                      <p>تحويل الملف داخليًا إلى ترميز UTF-8 بدون BOM لضمان ظهور الحروف العربية بشكل سليم</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-accent font-bold">3.</span>
                      <p>إزالة أي رموز غير مفهومة (����) إن وُجدت</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-accent font-bold">4.</span>
                      <p>رفع النسخة النظيفة وتحليل بيانات المعلمين والحصص بشكل صحيح</p>
                    </div>
                    <div className="mt-4 p-3 bg-background rounded border">
                      <p className="font-medium text-primary">✨ لا يحتاج المستخدم إلى تعديل الترميز يدويًا في Notepad++ — النظام يتولى ذلك تلقائيًا</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>📂 رفع ملف XML</CardTitle>
                  <CardDescription>
                    النظام يقرأ الملف بأي ترميز ويحوله تلقائيًا إلى UTF-8 بدون BOM - لا حاجة للتعديل اليدوي
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-12 bg-muted/20">
                    <CloudArrowUp className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">اسحب الملف هنا أو اضغط للاختيار</p>
                    <p className="text-sm text-muted-foreground mb-4">XML فقط</p>
                    <input
                      type="file"
                      accept=".xml"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="xml-file"
                      disabled={uploading}
                    />
                    <label htmlFor="xml-file">
                      <Button disabled={uploading} asChild>
                        <span>{uploading ? 'جاري الرفع...' : 'اختيار ملف'}</span>
                      </Button>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {parseResult && (
                <div className="space-y-4">
                  {parseResult.errors.length > 0 && (
                    <Alert variant="destructive">
                      <WarningCircle className="h-5 w-5" />
                      <AlertDescription>
                        <p className="font-medium mb-2">أخطاء:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {parseResult.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {parseResult.warnings.length > 0 && (
                    <Alert>
                      <WarningCircle className="h-5 w-5" />
                      <AlertDescription>
                        <p className="font-medium mb-2">تحذيرات:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {parseResult.warnings.map((warning, i) => (
                            <li key={i}>{warning}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {parseResult.errors.length === 0 && parseResult.warnings.length === 0 && (
                    <Alert className="bg-accent/10 border-accent">
                      <CheckCircle className="h-5 w-5 text-accent" />
                      <AlertDescription>
                        تم رفع الملف بنجاح بدون أخطاء أو تحذيرات!
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {lastUploadedSchedule && (
                <Card>
                  <CardHeader>
                    <CardTitle>📋 آخر جدول تم رفعه</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TeacherDataTable scheduleData={lastUploadedSchedule} onDelete={handleDelete} />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>الجداول المرفوعة</CardTitle>
                  <CardDescription>
                    عرض جميع الجداول التي تم رفعها مع حالة الاعتماد
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {allSchedules && allSchedules.length > 0 ? (
                    <div className="space-y-3">
                      {allSchedules.map((schedule, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-medium text-lg">جدول رقم {i + 1}</p>
                              {schedule.approved ? (
                                <Badge className="bg-accent text-accent-foreground">
                                  <CheckCircle className="w-3 h-3 ml-1" />
                                  معتمد
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-amber-500 text-amber-700">
                                  <WarningCircle className="w-3 h-3 ml-1" />
                                  غير معتمد
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>👥 {schedule.teachers?.length || 0} معلم</span>
                              <span>📚 {schedule.subjects?.length || 0} مادة</span>
                              <span>🏫 {schedule.classes?.length || 0} فصل</span>
                              <span>📅 {schedule.schedules?.length || 0} حصة</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-left">
                              <p className="text-sm text-muted-foreground">
                                تاريخ الرفع: {new Date(schedule.uploadDate).toLocaleDateString('ar-SA')}
                              </p>
                              {schedule.approved && schedule.approvedDate && (
                                <p className="text-xs text-accent mt-1">
                                  اعتمد في: {new Date(schedule.approvedDate).toLocaleDateString('ar-SA')}
                                </p>
                              )}
                            </div>

                            {!schedule.approved && (
                              <Button
                                onClick={() => handleApproveSchedule(i)}
                                className="bg-green-600 hover:bg-green-700 text-white text-sm"
                              >
                                اعتماد
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSchedule(i)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      🚫 لا يوجد جدول بعد، الرجاء رفع جدول.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guide">
              <XMLGuide />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
