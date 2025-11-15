import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Info,
  User,
  Phone,
  CheckCircle,
  WarningCircle,
  FileCode,
  GraduationCap,
  Sparkle,
} from '@phosphor-icons/react'
import schoolLogo from '@/assets/images/school_header_with_logo_(1).png'

export function SystemInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header with School Logo */}
        <div className="bg-white rounded-xl shadow-lg border mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6">
            <div className="flex items-center gap-6">
              <img
                src={schoolLogo}
                alt="شعار مدرسة الحباب بن المنذر"
                className="h-24 w-auto object-contain bg-white rounded-lg p-2"
              />
              <div className="flex-1 text-white">
                <h1 className="text-3xl font-bold mb-2">
                  نظام إدارة الحصص الاحتياطية
                </h1>
                <h2 className="text-xl font-semibold mb-1 opacity-90">
                  المديرية العامة للتربية والتعليم لمحافظة مسقط
                </h2>
                <h3 className="text-lg opacity-80">
                  مدرسة الحباب بن المنذر (9-12)
                </h3>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkle className="w-6 h-6 text-emerald-600" />
              <p className="text-lg text-gray-700">
                نظام ذكي ومتطور لإدارة جداول المعلمين واختيار البديل الأمثل
              </p>
            </div>
          </div>
        </div>

        {/* Setup Information */}
        <Card className="mb-6 border-emerald-200 shadow-lg">
          <CardHeader className="bg-emerald-50">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-emerald-700" />
              <CardTitle className="text-2xl text-emerald-900">
                🧾 معلومات الإعداد
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <User className="w-6 h-6 text-blue-700 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 text-lg mb-1">
                  إعداد النظام
                </p>
                <p className="text-gray-700">
                  الأستاذ <span className="font-bold">كمال عمر بلطيفة</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <GraduationCap className="w-6 h-6 text-purple-700 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 text-lg mb-1">
                  مدير المدرسة
                </p>
                <p className="text-gray-700">
                  الأستاذ <span className="font-bold">خالد الشبلي</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <Phone className="w-6 h-6 text-green-700 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800 text-lg mb-1">
                  رقم التواصل
                </p>
                <p className="text-gray-700 font-mono text-lg direction-ltr text-right">
                  +968 92167947
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* XML Upload Instructions */}
        <Card className="mb-6 border-yellow-300 shadow-lg">
          <CardHeader className="bg-yellow-50">
            <div className="flex items-center gap-3">
              <WarningCircle className="w-7 h-7 text-yellow-700" />
              <div>
                <CardTitle className="text-2xl text-yellow-900">
                  🟡 ملاحظة تقنية هامة – رفع جدول الحصص
                </CardTitle>
                <CardDescription className="text-yellow-800 mt-1 text-base">
                  يرجى قراءة هذه التعليمات بعناية قبل رفع الجدول
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Required Format */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileCode className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-lg text-gray-800">
                  🔷 صيغة الجدول المطلوبة:
                </h3>
              </div>
              <Alert className="border-blue-300 bg-blue-50">
                <AlertDescription>
                  <p className="text-base">
                    يجب رفع الجدول المدرسي بصيغة{' '}
                    <Badge
                      variant="default"
                      className="text-sm px-3 py-1 bg-blue-600 mx-1"
                    >
                      Oman XML
                    </Badge>{' '}
                    كما هو موضّح في برنامج{' '}
                    <span className="font-bold">aSc Timetables</span>.
                  </p>
                </AlertDescription>
              </Alert>
            </div>

            <Separator />

            {/* Why Oman XML */}
            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-3">
                📌 لماذا Oman XML؟
              </h3>
              <div className="space-y-3 mr-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700">
                    هذه الصيغة <span className="font-semibold">مخصصة للمدارس العُمانية</span>
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-semibold mb-2">
                      تُمكّن النظام الذكي من قراءة وتحليل:
                    </p>
                    <ul className="mr-6 space-y-1 text-gray-600">
                      <li>• أسماء المعلمين</li>
                      <li>• المواد الدراسية</li>
                      <li>• الصفوف الدراسية</li>
                      <li>• أيام الأسبوع والحصص</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* What Happens After Upload */}
            <div>
              <h3 className="font-bold text-lg text-gray-800 mb-3">
                🛠️ ماذا يحدث بعد الرفع؟
              </h3>
              <div className="space-y-2 mr-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-700 font-bold text-sm">1</span>
                  </div>
                  <p className="text-gray-700">يتم تحليل الجدول تلقائيًا</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-700 font-bold text-sm">2</span>
                  </div>
                  <p className="text-gray-700">
                    يتم توليد بيانات متكاملة لكل معلم وجدوله اليومي
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-700 font-bold text-sm">3</span>
                  </div>
                  <p className="text-gray-700">
                    يُستخدم الجدول في نظام الاحتياطي الذكي
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Warning */}
            <Alert variant="destructive" className="border-red-300">
              <WarningCircle className="h-5 w-5" />
              <AlertDescription>
                <p className="font-bold mb-2 text-base">⚠️ تنبيه مهم للمستخدمين</p>
                <p className="text-sm leading-relaxed">
                  يرجى التأكد من أن الملف المرفوع بصيغة{' '}
                  <span className="font-bold">Oman XML</span> — والمُصدّر من برنامج{' '}
                  <span className="font-bold">aSc Timetables</span>.
                  <br />
                  عدم الالتزام بهذه الصيغة قد يؤدي إلى{' '}
                  <span className="font-semibold">
                    أخطاء في التحليل أو ظهور بيانات غير مكتملة
                  </span>
                  .
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Card className="border-emerald-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50">
            <CardTitle className="text-2xl text-emerald-900">
              ✨ مميزات النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-700 text-lg">🤖</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    اختيار بديل ذكي
                  </p>
                  <p className="text-sm text-gray-600">
                    اقتراح البديل الأمثل بناءً على المادة والحمل الدراسي
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 text-lg">📊</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    تقارير إحصائية
                  </p>
                  <p className="text-sm text-gray-600">
                    رسوم بيانية وإحصائيات شاملة لأداء النظام
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-700 text-lg">🎯</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    إدارة الغيابات
                  </p>
                  <p className="text-sm text-gray-600">
                    تسجيل وتتبع غيابات المعلمين بسهولة
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-700 text-lg">🔒</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    نظام صلاحيات متقدم
                  </p>
                  <p className="text-sm text-gray-600">
                    تحكم كامل في صلاحيات المستخدمين
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 text-lg">🎤</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    مساعد صوتي ذكي
                  </p>
                  <p className="text-sm text-gray-600">
                    استخدام الصوت للاستعلام عن المعلمين والجداول
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-pink-700 text-lg">📱</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    واجهة سهلة الاستخدام
                  </p>
                  <p className="text-sm text-gray-600">
                    تصميم عصري وبسيط يعمل على جميع الأجهزة
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>© 2025 مدرسة الحباب بن المنذر - جميع الحقوق محفوظة</p>
          <p className="mt-1">تم التطوير بواسطة الأستاذ كمال عمر بلطيفة</p>
        </div>
      </div>
    </div>
  )
}
