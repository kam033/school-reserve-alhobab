import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, WarningCircle, XCircle, Download } from '@phosphor-icons/react'

export function XMLGuide() {
  const handleDownloadSample = () => {
    const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<timetable>

  <days options="canadd,export:silent" columns="day,name,short">
    <day name="الأحد" short="احد" day="1"/>
    <day name="الاثنين" short="اثنين" day="2"/>
    <day name="الثلاثاء" short="ثلاثاء" day="3"/>
    <day name="الأربعاء" short="اربعاء" day="4"/>
    <day name="الخميس" short="خميس" day="5"/>
  </days>

  <periods options="canadd,export:silent" columns="period,starttime,endtime">
    <period period="1" starttime="8:00" endtime="8:45"/>
    <period period="2" starttime="9:00" endtime="9:45"/>
    <period period="3" starttime="10:00" endtime="10:45"/>
    <period period="4" starttime="11:00" endtime="11:45"/>
    <period period="5" starttime="12:00" endtime="12:45"/>
    <period period="6" starttime="13:00" endtime="13:45"/>
  </periods>

  <teachers options="canadd,export:silent" columns="id,name,short,gender,color">
    <teacher id="1" name="محمد البوصافي" short="محمد البوصافي" gender="M" color="#FF0000"/>
    <teacher id="2" name="عمار الهاشمي" short="عمار الهاشمي" gender="M" color="#00FF00"/>
    <teacher id="3" name="أحمد السالمي" short="أحمد السالمي" gender="M" color="#0000FF"/>
  </teachers>

  <classes options="canadd,export:silent" columns="id,name,short,classroomids,teacherid,grade">
    <class id="1" name="التاسع أساسي/1" short="9/1" classroomids="1" grade="9"/>
    <class id="2" name="التاسع أساسي/2" short="9/2" classroomids="2" grade="9"/>
  </classes>

  <subjects options="canadd,export:silent" columns="id,name,short">
    <subject id="1" name="الرياضيات" short="رياضيات"/>
    <subject id="2" name="العلوم" short="علوم"/>
  </subjects>

  <classrooms options="canadd,export:silent" columns="id,name,short">
    <classroom id="1" name="تاسع 1" short="9/1"/>
    <classroom id="2" name="تاسع 2" short="9/2"/>
  </classrooms>

  <TimeTableSchedules options="canadd,canremove,canupdate,silent" columns="DayID,Period,LengthID,SchoolRoomID,SubjectGradeID,ClassID,OptionalClassID,TeacherID">
    <TimeTableSchedule DayID="1" Period="1" LengthID="0" SchoolRoomID="1" SubjectGradeID="1" ClassID="1" TeacherID="1"/>
    <TimeTableSchedule DayID="1" Period="2" LengthID="0" SchoolRoomID="2" SubjectGradeID="2" ClassID="2" TeacherID="2"/>
    <TimeTableSchedule DayID="2" Period="1" LengthID="0" SchoolRoomID="1" SubjectGradeID="1" ClassID="1" TeacherID="1"/>
  </TimeTableSchedules>

</timetable>`

    const blob = new Blob([sampleXML], { type: 'application/xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sample-timetable.xml'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  return (
    <div className="space-y-6">
      <Alert className="bg-accent/10 border-accent">
        <Download className="h-5 w-5 text-accent" />
        <AlertDescription className="flex items-center justify-between">
          <span className="font-medium">تحميل ملف XML نموذجي للتجربة</span>
          <Button onClick={handleDownloadSample} size="sm" variant="secondary">
            <Download className="w-4 h-4 ml-2" />
            تحميل المثال
          </Button>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-accent" />
            دليل تحضير ملف XML
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">الهدف النهائي</h3>
            <p className="text-muted-foreground mb-4">
              جعل ملف XML يعمل بكفاءة عند رفعه في النظام بحيث:
            </p>
            <ul className="space-y-2 mr-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span>يظهر الجدول كامل (المعلمين + الفصول + الحصص)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span>بدون رموز غريبة أو أخطاء نجمة</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span>بالترميز العربي الصحيح</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <span>قابل للتحميل والمعاينة داخل النظام</span>
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary">1</Badge>
              أضف ترويسة الترميز
            </h3>
            <p className="text-muted-foreground mb-3">
              في أول سطر بالملف (قبل أي شيء):
            </p>
            <Alert className="bg-muted">
              <AlertDescription>
                <code className="text-sm font-mono">
                  {'<?xml version="1.0" encoding="UTF-8"?>'}<br />
                  {'<timetable>'}
                </code>
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground mt-2">
              هذا يخبر النظام أن الملف يستخدم اللغة العربية (UTF-8)، ويمنع ظهور رموز (����) بدل النصوص.
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary">2</Badge>
              تأكد من ترقيم الأيام بشكل صحيح
            </h3>
            <p className="text-muted-foreground mb-3">
              في aSc Timetables، ترقيم الأيام يجب أن يكون على النحو التالي:
            </p>
            <Alert className="bg-accent/10 border-accent mb-3">
              <CheckCircle className="h-4 w-4 text-accent" />
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-2 py-1 rounded font-mono">day="1"</code>
                    <span>→ الأحد (Sunday)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-2 py-1 rounded font-mono">day="2"</code>
                    <span>→ الاثنين (Monday)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-2 py-1 rounded font-mono">day="3"</code>
                    <span>→ الثلاثاء (Tuesday)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-2 py-1 rounded font-mono">day="4"</code>
                    <span>→ الأربعاء (Wednesday)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-2 py-1 rounded font-mono">day="5"</code>
                    <span>→ الخميس (Thursday)</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
            <Alert>
              <WarningCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>مهم جداً:</strong> إذا كان ترقيم الأيام في ملف XML الخاص بك يبدأ من 0 (day="0" للأحد)، فقد تظهر الحصص في أيام خاطئة. تأكد من أن الترقيم يطابق ترتيب aSc Timetables الذي يبدأ من 1.
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary">3</Badge>
              إزالة جميع النجوم (*)
            </h3>
            <p className="text-muted-foreground mb-3">
              استبدل كل معرّف يحتوي على نجمة:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-semibold">خطأ:</span>
                  <code className="block text-xs mt-1 font-mono">
                    id="*1"<br />
                    classid="*21"<br />
                    teacherid="*15"
                  </code>
                </AlertDescription>
              </Alert>
              <Alert className="bg-accent/10 border-accent">
                <CheckCircle className="h-4 w-4 text-accent" />
                <AlertDescription>
                  <span className="font-semibold">صحيح:</span>
                  <code className="block text-xs mt-1 font-mono">
                    id="1"<br />
                    classid="21"<br />
                    teacherid="15"
                  </code>
                </AlertDescription>
              </Alert>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">استخدم بحث واستبدال في VS Code:</p>
              <ol className="text-sm space-y-1 mr-4">
                <li>1. اضغط <kbd className="px-2 py-1 bg-background rounded">Ctrl + H</kbd></li>
                <li>2. في البحث: <code className="bg-background px-2 py-1 rounded">\*</code></li>
                <li>3. اترك الاستبدال فارغاً</li>
                <li>4. اضغط "Replace All"</li>
              </ol>
            </div>
            <Alert className="mt-3">
              <WarningCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>ملاحظة:</strong> النظام يقوم بإزالة النجوم تلقائياً عند الرفع، لكن يُفضل تنظيف الملف مسبقاً.
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary">4</Badge>
              تأكد من إغلاق كل قسم
            </h3>
            <p className="text-muted-foreground mb-3">
              كل قسم يجب أن يبدأ ويُغلق بشكل صحيح:
            </p>
            <Alert className="bg-muted">
              <AlertDescription>
                <code className="text-sm font-mono whitespace-pre">
{`<teachers ...>
   ...
</teachers>

<classes ...>
   ...
</classes>

وفي نهاية الملف:
</timetable>`}
                </code>
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary">5</Badge>
              عدّل خاصية الجنس (gender)
            </h3>
            <p className="text-muted-foreground mb-3">
              إذا كانت جميع المعلمين ذكور، غيّر:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Alert variant="destructive">
                <AlertDescription>
                  <code className="text-sm font-mono">gender="F"</code>
                </AlertDescription>
              </Alert>
              <Alert className="bg-accent/10 border-accent">
                <AlertDescription>
                  <code className="text-sm font-mono">gender="M"</code>
                </AlertDescription>
              </Alert>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              أو احذفها تماماً إن لم تكن ضرورية للنظام.
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary">6</Badge>
              غلّف قسم الجدول داخل وسمه
            </h3>
            <p className="text-muted-foreground mb-3">
              ضع كل أسطر الجدول داخل:
            </p>
            <Alert className="bg-muted">
              <AlertDescription>
                <code className="text-xs font-mono whitespace-pre">
{`<TimeTableSchedules options="canadd,canremove,canupdate,silent"
                    columns="DayID,Period,LengthID,SchoolRoomID,
                             SubjectGradeID,ClassID,OptionalClassID,TeacherID">
    <TimeTableSchedule DayID="2" Period="4" ... />
    ... كل الأسطر هنا ...
</TimeTableSchedules>`}
                </code>
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary">7</Badge>
              تأكد من وجود معرّف الصف (ClassID) في جدول الحصص ⭐
            </h3>
            <Alert className="mb-3 border-accent bg-accent/10">
              <CheckCircle className="h-5 w-5 text-accent" />
              <AlertDescription className="font-semibold text-base">
                هذا أهم حقل لتفعيل ميزة "نفس الصف" عند البحث عن معلم بديل!
              </AlertDescription>
            </Alert>
            <p className="text-muted-foreground mb-3">
              لتفعيل ميزة "نفس الصف" عند تسجيل الغيابات، يجب أن يحتوي كل سطر في جدول الحصص على معرّف الصف:
            </p>
            <Alert className="bg-muted mb-3">
              <AlertDescription>
                <code className="text-sm font-mono whitespace-pre">
{`<TimeTableSchedule 
  DayID="1" 
  Period="1" 
  ClassID="1"
  SubjectGradeID="1"
  TeacherID="1"/>`}
                </code>
              </AlertDescription>
            </Alert>
            <div className="space-y-3">
              <Alert className="bg-accent/10 border-accent">
                <CheckCircle className="h-4 w-4 text-accent" />
                <AlertDescription>
                  <strong>✅ مثال صحيح:</strong> كل حصة لها ClassID يربطها بصف معين (مثل: ClassID="1" للصف التاسع/1)
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>❌ مثال خاطئ:</strong> الحصة بدون ClassID أو ClassID="" (فارغ) - سيؤدي هذا لتعطيل زر "نفس الصف"
                </AlertDescription>
              </Alert>
            </div>
            <Alert className="mt-3 border-amber-500 bg-amber-50">
              <WarningCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div><strong>ماذا يحدث إذا كان ClassID مفقوداً؟</strong></div>
                  <div className="text-sm space-y-1 mr-3">
                    <div>• زر "نفس الصف" سيكون معطلاً (غير قابل للنقر) في صفحة الغيابات</div>
                    <div>• ستظهر رسالة تحذيرية: "لم يتم العثور على معلومات الصف"</div>
                    <div>• ستتمكن فقط من استخدام "الجدول العام" أو "نفس المادة" للبحث عن بديل</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
            <Alert className="mt-3 border-primary bg-primary/5">
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">💡 كيف أتأكد أن ClassID موجود في ملفي؟</div>
                  <div className="text-sm space-y-1 mr-3">
                    <div>1. افتح ملف XML في محرر نصوص (VS Code أو Notepad++)</div>
                    <div>2. ابحث عن {'<TimeTableSchedule'}</div>
                    <div>3. تأكد أن كل سطر يحتوي على ClassID مع قيمة (ClassID="1" أو ClassID="5" إلخ)</div>
                    <div>4. إذا كان ClassID="" أو غير موجود، راجع إعدادات التصدير في برنامج aSc Timetables</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary">8</Badge>
              احفظ الملف بالترميز الصحيح
            </h3>
            <div className="space-y-3">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold text-sm mb-2">في VS Code:</p>
                <ol className="text-sm space-y-1 mr-4">
                  <li>1. اضغط على شريط الترميز أسفل الصفحة</li>
                  <li>2. اختر "UTF-8"</li>
                  <li>3. "Save with Encoding → UTF-8"</li>
                </ol>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold text-sm mb-2">في Notepad++:</p>
                <ol className="text-sm space-y-1 mr-4">
                  <li>من القائمة: Encoding → Convert to UTF-8 without BOM</li>
                </ol>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Badge variant="secondary">9</Badge>
              جرب رفع الملف في النظام
            </h3>
            <p className="text-muted-foreground mb-3">
              بعد إجراء التعديلات، ارفع الملف في صفحة "تحميل الجدول الدراسي".
            </p>
            <Alert className="bg-accent/10 border-accent">
              <CheckCircle className="h-4 w-4 text-accent" />
              <AlertDescription>
                إذا تم التحميل دون خطأ، سيظهر أسماء المعلمين والفصول بالترميز العربي السليم.
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          <div className="bg-accent/10 p-6 rounded-lg border border-accent">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-accent" />
              النتيجة النهائية المتوقعة
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span className="text-sm">بدون أخطاء ترقيم (إزالة النجوم)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span className="text-sm">تظهر الأسماء بالعربية (تعديل الترميز)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span className="text-sm">بيانات المعلمين صحيحة (تصحيح الجنس)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span className="text-sm">النظام يقرأ الجدول كامل (تغليف الجدول)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span className="text-sm">معرّفات الصفوف موجودة (ClassID في كل حصة)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">✓</Badge>
                <span className="text-sm">تحميل ناجح (حفظ UTF-8)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
