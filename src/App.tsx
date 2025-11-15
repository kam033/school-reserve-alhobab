import { useState, useEffect } from 'react'
import { AuthProvider } from '@/lib/auth'
import { Toaster } from '@/components/ui/sonner'
import { HomePage } from '@/components/HomePage'
import { XMLUploadPage } from '@/components/XMLUploadPage'
import { TeacherSchedulesPage } from '@/components/TeacherSchedulesPage'
import { AbsencePage } from '@/components/AbsencePage'
import { StatsPage } from '@/components/StatsPage'
import { ScheduleViewPage } from '@/components/ScheduleViewPage'
import { SmartAnalyticsPage } from '@/components/SmartAnalyticsPage'
import { UltimateSmartChatBot } from '@/components/UltimateSmartChatBot'
import { UserManagementPage } from '@/components/UserManagementPage'
import { SystemInfoPage } from '@/components/SystemInfoPage'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { House } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'
import { ScheduleData } from '@/lib/types'
import schoolLogo from '@/assets/images/school_header_with_logo_(1).png'

// 🧭 تعريف الصفحات المتاحة
type Page = 'home' | 'upload' | 'allSchedules' | 'absences' | 'stats' | 'view' | 'analytics' | 'users' | 'info'

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home')

  // 📦 البيانات الرئيسية لجداول المعلمين
  const [allSchedules, setAllSchedules] = useKV<ScheduleData[]>('allSchedules', [])

  // ⚠️ مفتاح قديم فقط للترحيل (اختياري)
  const [schedules] = useKV<ScheduleData[]>('schedules', [])

  // ✅ تحقق من وجود جدول معتمد أو جداول
  const hasApprovedSchedule = Array.isArray(allSchedules) && allSchedules.some(s => s.approved)
  const hasSchedules = Array.isArray(allSchedules) && allSchedules.length > 0

  // 🧾 تسجيل معلومات للتطوير
  useEffect(() => {
    console.log('🧭 الصفحة الحالية:', currentPage)
    console.log('📄 عدد الجداول:', allSchedules?.length || 0)
    console.log('✅ جدول معتمد موجود؟', hasApprovedSchedule)
  }, [currentPage, allSchedules, hasApprovedSchedule])

  // 🔁 ترحيل البيانات من schedules إلى allSchedules لمرة واحدة فقط
  useEffect(() => {
    if (schedules && schedules.length > 0 && (!allSchedules || allSchedules.length === 0)) {
      console.log('🔄 يتم الآن نقل البيانات من schedules إلى allSchedules...')
      setAllSchedules(schedules)
    }
  }, [schedules, allSchedules, setAllSchedules])

  // 🖼️ عرض الصفحة حسب الاختيار
  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onNavigate={setCurrentPage} />
      case 'upload': return <XMLUploadPage />
      case 'allSchedules': return <TeacherSchedulesPage />
      case 'absences': return <AbsencePage />
      case 'stats': return <StatsPage />
      case 'view': return <ScheduleViewPage />
      case 'analytics': return <SmartAnalyticsPage />
      case 'users': return <UserManagementPage />
      case 'info': return <SystemInfoPage />
      default: return <HomePage onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="min-h-screen bg-emerald-300">
      {/* ✅ الشريط العلوي إذا لم تكن الصفحة الرئيسية */}
      {currentPage !== 'home' && (
        <div className="border-b border-border bg-white shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4" dir="rtl">
              {/* 🏫 شعار المدرسة - يعمل كرابط للصفحة الرئيسية */}
              <button
                onClick={() => setCurrentPage('home')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-2"
                aria-label="العودة للصفحة الرئيسية"
              >
                <img
                  src={schoolLogo}
                  alt="شعار مدرسة الحباب بن المنذر"
                  className="h-12 w-auto object-contain"
                />
                <div className="text-right hidden sm:block">
                  <h2 className="text-sm font-bold text-gray-800">مدرسة الحباب بن المنذر (9-12)</h2>
                  <p className="text-xs text-gray-600">نظام إدارة الجداول المدرسية</p>
                </div>
              </button>

              {/* 🔙 زر الرجوع + شارة الحالة */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage('home')}
                  className="gap-2"
                >
                  <House className="w-4 h-4" />
                  <span className="hidden sm:inline">الرئيسية</span>
                </Button>

                {/* 📌 شارة حالة الجداول */}
                {hasSchedules && (
                  <Badge variant={hasApprovedSchedule ? "default" : "outline"} className="text-xs">
                    {hasApprovedSchedule ? '✓ جدول معتمد' : '⚠ جدول غير معتمد'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🖥️ عرض الصفحة المحددة */}
      {renderPage()}

      {/* 🤖 المساعد الذكي الشامل - يظهر في جميع الصفحات */}
      <UltimateSmartChatBot />

      {/* 🔔 تنبيهات */}
      <Toaster position="top-center" dir="rtl" />
    </div>
  )
}

// 🚀 نقطة البداية للتطبيق
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
