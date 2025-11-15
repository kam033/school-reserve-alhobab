import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useScheduleStorage } from '@/lib/useScheduleStorage'
import { Teacher, ScheduleData } from '@/lib/types'
import {
  X,
  PaperPlaneRight,
  Sparkle,
  UserCircle,
  Robot,
  SpeakerHigh,
  SpeakerSlash,
  Microphone,
  MicrophoneSlash,
  Download,
  Eraser,
  Warning,
  CheckCircle,
  Copy,
  ArrowsOut,
  ArrowsIn
} from '@phosphor-icons/react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  suggestions?: string[]
  chartData?: ChartData
  type?: 'text' | 'chart' | 'warning'
  warnings?: string[]
}

interface ChartData {
  type: 'bar' | 'line' | 'pie'
  data: any[]
  xKey: string
  yKey: string
  title: string
}

interface ConversationContext {
  teacherName?: string
  day?: string
  period?: number
  subject?: string
  lastQuery?: string
  ambiguousNames?: string[]
}

interface SubstituteCandidate {
  teacher: Teacher
  workload: number
  score: number
  category: 'same_subject' | 'available' | 'same_grade' | 'low_workload'
  categoryLabel: string
  categoryColor: string
  categoryIcon: string
  warnings: string[]
}

export function UltimateSmartChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [context, setContext] = useState<ConversationContext>({})
  const [isTyping, setIsTyping] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [showChartBuilder, setShowChartBuilder] = useState(false)
  const [chartConfig, setChartConfig] = useState({
    type: 'bar' as 'bar' | 'line' | 'pie',
    xAxis: 'teacher' as string,
    yAxis: 'periods' as string
  })
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [expandedChart, setExpandedChart] = useState<ChartData | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const { approvedSchedules } = useScheduleStorage()

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.lang = 'ar-SA'
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputText(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  // Load conversation history
  useEffect(() => {
    const saved = localStorage.getItem('ultimate-chatbot-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })))
      } catch (error) {
        console.error('Error loading chat history:', error)
      }
    }
  }, [])

  const initializeWelcomeMessage = () => {
    const welcomeMsg: Message = {
      id: Date.now().toString(),
      text: '👋 أهلاً بك! كيف يمكنني مساعدتك اليوم؟\n\n💡 جرّب:\n• "جدول كمال بلطيفة"\n• "من فاضي الآن؟"\n• "رسم بياني لكمال"\n• "اقترح بديل لأحمد الأربعاء"\n\n🎤 أو اضغط على الميكروفون للتحدث مباشرة!',
      sender: 'bot',
      timestamp: new Date(),
      suggestions: ['من فاضي؟', '📊 رسم بياني', '🎯 بديل ذكي', 'مساعدة'],
      type: 'text'
    }
    setMessages([welcomeMsg])
  }

  // Save conversation
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('ultimate-chatbot-history', JSON.stringify(messages))
    }
  }, [messages])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFullScreen) return
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || isFullScreen) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // رسالة ترحيبية صوتية عند فتح المساعد
  useEffect(() => {
    if (isOpen && voiceEnabled && messages.length === 0) {
      setTimeout(() => {
        speak('مرحباً بك، كيف يمكنني مساعدتك اليوم؟')
      }, 500)
    }
  }, [isOpen])

  // Get all teachers
  const allTeachers = useMemo(() => {
    return approvedSchedules.flatMap(schedule => schedule.teachers || [])
  }, [approvedSchedules])

  // Get latest schedule
  const latestSchedule = useMemo(() => {
    return approvedSchedules.length > 0
      ? approvedSchedules[approvedSchedules.length - 1]
      : null
  }, [approvedSchedules])

  // Fuzzy name matching
  const findTeacherByName = (query: string): Teacher[] => {
    const q = query.toLowerCase().trim()
    const matches: { teacher: Teacher; score: number }[] = []

    allTeachers.forEach(teacher => {
      const name = teacher.name.toLowerCase()
      const nameParts = name.split(' ')

      // Exact match
      if (name === q) {
        matches.push({ teacher, score: 100 })
        return
      }

      // Contains full query
      if (name.includes(q)) {
        matches.push({ teacher, score: 90 })
        return
      }

      // Query contains teacher name
      if (q.includes(name)) {
        matches.push({ teacher, score: 85 })
        return
      }

      // Partial word match
      for (const part of nameParts) {
        if (part.length > 2 && q.includes(part)) {
          matches.push({ teacher, score: 70 })
          return
        }
        if (part.length > 2 && part.includes(q)) {
          matches.push({ teacher, score: 60 })
          return
        }
      }

      // First character match (for short queries)
      if (q.length >= 2 && name.startsWith(q)) {
        matches.push({ teacher, score: 50 })
      }
    })

    // Sort by score and return unique teachers
    const sorted = matches
      .sort((a, b) => b.score - a.score)
      .map(m => m.teacher)

    // Remove duplicates
    return Array.from(new Set(sorted.map(t => t.id)))
      .map(id => sorted.find(t => t.id === id)!)
  }

  // Speech Synthesis
  const speak = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    const cleanText = text.replace(/[📊📈📋🎯✅❌🤔💡🔊⚠️✨🧠👥📅📘🟢🔵🟠🟡🔴]/g, '')

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'ar-SA'
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      try {
        recognitionRef.current.start()
      } catch (error) {
        setIsListening(false)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  // Enhanced NLP Parser
  const parseQuery = (query: string) => {
    const q = query.toLowerCase().trim()

    // Find teachers with fuzzy matching
    const teacherMatches = findTeacherByName(q)
    let teacherName: string | undefined
    let ambiguousNames: string[] | undefined

    if (teacherMatches.length === 1) {
      teacherName = teacherMatches[0].name
    } else if (teacherMatches.length > 1) {
      ambiguousNames = teacherMatches.map(t => t.name)
      teacherName = teacherMatches[0].name // Default to best match
    }

    // Extract day
    const dayMap: Record<string, string> = {
      'الأحد': '1', 'احد': '1', 'الاحد': '1',
      'الاثنين': '2', 'اثنين': '2', 'الإثنين': '2',
      'الثلاثاء': '3', 'ثلاثاء': '3', 'الثلاثا': '3',
      'الأربعاء': '4', 'اربعاء': '4', 'الاربعاء': '4', 'اربع': '4',
      'الخميس': '5', 'خميس': '5'
    }
    let day: string | undefined
    for (const [dayName, dayId] of Object.entries(dayMap)) {
      if (q.includes(dayName)) {
        day = dayId
        break
      }
    }

    // Extract period
    const periodMatch = q.match(/حصة\s*(\d+)|الحصة\s*(\d+)|(\d+)\s*حصة/)
    const period = periodMatch
      ? parseInt(periodMatch[1] || periodMatch[2] || periodMatch[3])
      : undefined

    // Determine intent with enhanced detection
    let intent = 'unknown'
    let isAbsent = false

    // أولوية عالية: جدول المعلم (يجب أن يكون قبل الغياب)
    if (q.includes('جدول') || q.includes('برنامج') || q.includes('توقيت') ||
        q.includes('جداول') || q.includes('schedule') ||
        q.includes('ايش جدول') || q.includes('وش جدول') || q.includes('عرض جدول')) {
      intent = 'get_schedule'
    }
    // كشف الغياب
    else if (q.includes('غائب') || q.includes('غياب') || q.includes('يعوض') || q.includes('تعويض') ||
        (q.includes('بديل') && teacherName && !q.includes('جدول')) || (q.includes('من') && q.includes('يعوض'))) {
      isAbsent = true
      intent = 'absent_teacher'
    }
    // رسم بياني (تأكد من عدم وجود "جدول" في السؤال)
    else if ((q.includes('رسم') || q.includes('بيان') || q.includes('شارت') || q.includes('chart') ||
             q.includes('مخطط') || q.includes('graph')) && !q.includes('جدول')) {
      intent = 'show_chart'
    }
    // حصص المعلم (بدون كلمة جدول صريحة)
    else if ((q.includes('حصص') && teacherName) || q.includes('وين') || q.includes('عند من')) {
      intent = 'get_schedule'
    }
    // بديل واحتياطي
    else if (q.includes('بديل') || q.includes('بدائل') || q.includes('استبدال') ||
             q.includes('احتياط') || q.includes('يحل محل')) {
      intent = 'suggest_substitute'
    }
    // عدد الحصص
    else if ((q.includes('عدد') || q.includes('كم') || q.includes('كام') || q.includes('كيف')) &&
             (q.includes('حصص') || q.includes('حصة'))) {
      intent = 'count_periods'
    }
    // أيام التدريس
    else if (q.includes('أيام') || q.includes('متى') || q.includes('ايام') ||
             (q.includes('يدرس') && q.includes('في')) || q.includes('ايش ايام')) {
      intent = 'teaching_days'
    }
    // معلومات عن النظام
    else if (q.includes('كيف يعمل') || q.includes('شرح') || q.includes('معلومات عن') ||
             q.includes('ما هو') || q.includes('ايش هو') || q.includes('وظيفة')) {
      intent = 'system_info'
    }
    // إحصائيات عامة
    else if (q.includes('إحصائيات') || q.includes('احصائيات') || q.includes('معلومات عامة') ||
             q.includes('كم معلم') || q.includes('كم صف') || q.includes('اجمالي')) {
      intent = 'statistics'
    }
    // البحث عن صف معين
    else if (q.includes('صف') || q.includes('فصل') || q.includes('class')) {
      intent = 'class_info'
    }
    // مواد معينة
    else if (q.includes('مادة') || q.includes('مواد') || q.includes('يدرس ماذا') ||
             q.includes('ايش يدرس')) {
      intent = 'subject_info'
    }
    // تحليل وتوزيع
    else if (q.includes('تحليل') || q.includes('عدالة') || q.includes('توزيع') ||
             q.includes('احصائي') || q.includes('مقارنة')) {
      intent = 'analysis'
    }
    // المتاحون الآن
    else if (q.includes('متاح') || q.includes('فاضي') || q.includes('فراغ') ||
             q.includes('مين عنده') || q.includes('من عنده') || q.includes('الآن') ||
             q.includes('حر') || q.includes('مشغول')) {
      intent = 'available_now'
    }
    // مساعدة
    else if (q.includes('مساعدة') || q.includes('ساعدني') || q.includes('كيف') ||
             q.includes('help') || q.includes('ايش تقدر') || q.includes('وش تقدر')) {
      intent = 'help'
    }
    // شكر
    else if (q.includes('شكرا') || q.includes('شكراً') || q.includes('thanks') ||
             q.includes('ممتاز') || q.includes('جميل') || q.includes('رائع')) {
      intent = 'thanks'
    }
    // إذا وجد اسم معلم فقط بدون كلمات مفتاحية، افترض أنه يريد الجدول
    else if (teacherName && q.length < 50 && !q.includes('؟')) {
      intent = 'get_schedule'
    }

    return { intent, teacherName, day, period, subject: undefined, ambiguousNames, isAbsent }
  }

  // Check for consecutive periods
  const checkConsecutivePeriods = (teacherId: string, day: string, period: number): string[] => {
    if (!latestSchedule) return []

    const warnings: string[] = []
    const teacherSchedules = latestSchedule.schedules.filter(s =>
      s.teacherID === teacherId && s.dayID === day
    )

    // Check period before
    const hasPeriodBefore = teacherSchedules.some(s => s.period === period - 1)
    if (hasPeriodBefore) {
      warnings.push(`⚠️ لديه حصة ${period - 1} قبل هذه الحصة`)
    }

    // Check period after
    const hasPeriodAfter = teacherSchedules.some(s => s.period === period + 1)
    if (hasPeriodAfter) {
      warnings.push(`⚠️ لديه حصة ${period + 1} بعد هذه الحصة`)
    }

    // Check if 3+ consecutive periods
    if (hasPeriodBefore && hasPeriodAfter) {
      warnings.push(`⚠️ سيصبح لديه 3 حصص متتالية - تأكد من جاهزيته`)
    }

    return warnings
  }

  // Smart substitute suggestion with categories
  const suggestSmartSubstitute = (teacherName: string, day: string, period?: number): {
    absentTeacher: Teacher
    subject?: string
    substitutes: SubstituteCandidate[]
    busyCount: number
  } | null => {
    if (!latestSchedule) return null

    const teacher = allTeachers.find(t => t.name === teacherName)
    if (!teacher) return null

    const teacherOriginalId = teacher.originalId || teacher.id.split('-').pop()
    const absentSlot = latestSchedule.schedules.find(s =>
      s.teacherID === teacherOriginalId &&
      s.dayID === day &&
      (!period || s.period === period)
    )

    const subject = absentSlot
      ? latestSchedule.subjects.find(s => s.originalId === absentSlot.subjectGradeID)
      : null

    const classItem = absentSlot
      ? latestSchedule.classes.find(c => c.originalId === absentSlot.classID)
      : null

    const busyTeachers = new Set(
      latestSchedule.schedules
        .filter(s => s.dayID === day && (!period || s.period === period))
        .map(s => s.teacherID)
    )

    const teacherWorkload = new Map<string, number>()
    latestSchedule.schedules.forEach(s => {
      const count = teacherWorkload.get(s.teacherID) || 0
      teacherWorkload.set(s.teacherID, count + 1)
    })

    const availableTeachers = allTeachers.filter(t => {
      const tId = t.originalId || t.id.split('-').pop()
      return tId !== teacherOriginalId && !busyTeachers.has(tId!)
    })

    const rankedSubstitutes: SubstituteCandidate[] = availableTeachers
      .map(t => {
        const tId = t.originalId || t.id.split('-').pop()
        const workload = teacherWorkload.get(tId!) || 0
        const subjectMatch = subject && t.subject === subject.name
        const gradeMatch = classItem && t.subject.includes(classItem.name.split('/')[0])

        // Determine category
        let category: SubstituteCandidate['category'] = 'available'
        let categoryLabel = 'متاح حسب الجدول'
        let categoryColor = '#3B82F6' // blue
        let categoryIcon = '🔵'
        let score = 100 - workload

        if (subjectMatch) {
          category = 'same_subject'
          categoryLabel = 'نفس المادة'
          categoryColor = '#10B981' // green
          categoryIcon = '🟢'
          score += 100
        } else if (gradeMatch) {
          category = 'same_grade'
          categoryLabel = 'خبرة في الصف'
          categoryColor = '#F59E0B' // orange
          categoryIcon = '🟠'
          score += 50
        } else if (workload < 15) {
          category = 'low_workload'
          categoryLabel = 'حمل خفيف'
          categoryColor = '#EAB308' // yellow
          categoryIcon = '🟡'
          score += 30
        }

        // Check for warnings
        const warnings = period ? checkConsecutivePeriods(tId!, day, period) : []

        return {
          teacher: t,
          workload,
          score,
          category,
          categoryLabel,
          categoryColor,
          categoryIcon,
          warnings
        }
      })
      .sort((a, b) => b.score - a.score)

    return {
      absentTeacher: teacher,
      subject: subject?.name,
      substitutes: rankedSubstitutes,
      busyCount: busyTeachers.size
    }
  }

  // Generate chart data
  const generateChartData = (type: string, xAxis?: string, yAxis?: string): ChartData | null => {
    if (!latestSchedule) return null

    // Dynamic chart based on user selection
    if (xAxis && yAxis) {
      // Implementation for custom charts
      return null // Placeholder
    }

    switch (type) {
      case 'teacher_workload': {
        const workload = new Map<string, number>()
        latestSchedule.schedules?.forEach(s => {
          const count = workload.get(s.teacherID) || 0
          workload.set(s.teacherID, count + 1)
        })

        const data = Array.from(workload.entries()).map(([teacherId, count]) => {
          const teacher = allTeachers.find(t =>
            t.originalId === teacherId || t.id === teacherId
          )
          return {
            المعلم: teacher?.name || 'غير معروف',
            الحصص: count
          }
        }).sort((a, b) => b.الحصص - a.الحصص)

        return {
          type: 'bar',
          data,
          xKey: 'المعلم',
          yKey: 'الحصص',
          title: 'عدد الحصص لكل معلم'
        }
      }

      case 'daily_distribution': {
        const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
        const distribution = new Map<string, number>()

        latestSchedule.schedules?.forEach(s => {
          const dayName = dayNames[parseInt(s.dayID)] || s.dayID
          const count = distribution.get(dayName) || 0
          distribution.set(dayName, count + 1)
        })

        const data = Array.from(distribution.entries()).map(([day, count]) => ({
          اليوم: day,
          الحصص: count
        }))

        return {
          type: 'line',
          data,
          xKey: 'اليوم',
          yKey: 'الحصص',
          title: 'توزيع الحصص حسب الأيام'
        }
      }

      case 'subject_distribution': {
        const subjectCount = new Map<string, number>()

        latestSchedule.schedules?.forEach(s => {
          const subject = latestSchedule.subjects?.find(sub =>
            sub.originalId === s.subjectGradeID
          )
          const name = subject?.name || 'غير معروف'
          const count = subjectCount.get(name) || 0
          subjectCount.set(name, count + 1)
        })

        const data = Array.from(subjectCount.entries()).map(([subject, count]) => ({
          المادة: subject,
          الحصص: count
        }))

        return {
          type: 'pie',
          data,
          xKey: 'المادة',
          yKey: 'الحصص',
          title: 'توزيع الحصص حسب المواد'
        }
      }

      default:
        return null
    }
  }

  // Get available teachers now
  const getAvailableTeachersNow = (day?: string, period?: number) => {
    if (!latestSchedule) return null

    // Get current day and period if not provided
    const now = new Date()
    const currentDay = day || String((now.getDay() === 0 ? 7 : now.getDay()) === 6 || now.getDay() === 0 ? 1 : now.getDay())
    const currentHour = now.getHours()
    const currentPeriod = period || (currentHour >= 7 && currentHour < 13 ? currentHour - 6 : 1)

    const busyTeachers = new Set<string>()
    latestSchedule.schedules.forEach(s => {
      if (s.dayID === currentDay && s.period === currentPeriod) {
        busyTeachers.add(s.teacherID)
      }
    })

    const availableTeachers = allTeachers.filter(t => {
      const teacherId = t.originalId || t.id.split('-').pop() || ''
      return !busyTeachers.has(teacherId)
    })

    return {
      day: currentDay,
      period: currentPeriod,
      availableTeachers,
      busyCount: busyTeachers.size
    }
  }

  // Generate teacher-specific chart
  const generateTeacherChart = (teacherName: string): ChartData | null => {
    if (!latestSchedule) return null

    const teacher = allTeachers.find(t => t.name === teacherName)
    if (!teacher) return null

    const teacherOriginalId = teacher.originalId || teacher.id.split('-').pop()
    const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
    const distribution = new Map<string, number>()

    // Initialize all days with 0
    dayNames.slice(1).forEach(day => distribution.set(day, 0))

    latestSchedule.schedules.forEach(s => {
      if (s.teacherID === teacherOriginalId) {
        const dayName = dayNames[parseInt(s.dayID)] || s.dayID
        const count = distribution.get(dayName) || 0
        distribution.set(dayName, count + 1)
      }
    })

    const data = Array.from(distribution.entries()).map(([day, count]) => ({
      اليوم: day,
      الحصص: count
    }))

    return {
      type: 'bar',
      data,
      xKey: 'اليوم',
      yKey: 'الحصص',
      title: `توزيع حصص ${teacherName} حسب الأيام`
    }
  }

  // Get teacher schedule
  const getTeacherSchedule = (teacherName: string, day?: string) => {
    if (!latestSchedule) return null

    // البحث المرن عن المعلم
    const teacher = allTeachers.find(t =>
      t.name === teacherName ||
      t.name.toLowerCase() === teacherName.toLowerCase() ||
      t.name.includes(teacherName) ||
      teacherName.includes(t.name)
    )

    if (!teacher) {
      // محاولة أخيرة: البحث بالأسماء الجزئية
      const partialMatch = allTeachers.find(t => {
        const nameParts = t.name.split(' ')
        const queryParts = teacherName.split(' ')
        return nameParts.some(part => queryParts.some(qPart =>
          part.toLowerCase().includes(qPart.toLowerCase()) && qPart.length > 2
        ))
      })
      if (!partialMatch) return null

      const teacherOriginalId = partialMatch.originalId || partialMatch.id.split('-').pop()
      const schedules = latestSchedule.schedules.filter(s =>
        s.teacherID === teacherOriginalId && (!day || s.dayID === day)
      )

      return {
        teacher: partialMatch,
        schedules,
        totalPeriods: schedules.length
      }
    }

    const teacherOriginalId = teacher.originalId || teacher.id.split('-').pop()
    const schedules = latestSchedule.schedules.filter(s =>
      s.teacherID === teacherOriginalId && (!day || s.dayID === day)
    )

    return {
      teacher,
      schedules,
      totalPeriods: schedules.length
    }
  }

  // Generate bot response
  const generateResponse = (query: string): Message => {
    const parsed = parseQuery(query)

    setContext(prev => ({
      ...prev,
      teacherName: parsed.teacherName || prev.teacherName,
      day: parsed.day || prev.day,
      period: parsed.period || prev.period,
      lastQuery: parsed.intent,
      ambiguousNames: parsed.ambiguousNames
    }))

    let responseText = ''
    let suggestions: string[] = []
    let chartData: ChartData | null = null
    let messageType: 'text' | 'chart' | 'warning' = 'text'
    let warnings: string[] = []

    if (approvedSchedules.length === 0) {
      responseText = '⚠️ عذراً، لا يوجد جدول معتمد في النظام.\n\nيرجى رفع ملف XML واعتماده أولاً من صفحة "تحميل الجدول".'
      suggestions = []
    } else {
      // Handle ambiguous names - فقط إذا كان الاسم غير دقيق
      if (parsed.ambiguousNames && parsed.ambiguousNames.length > 1 && parsed.intent !== 'unknown') {
        // تحقق إذا كان أحد الأسماء مطابق تماماً
        const exactMatch = parsed.ambiguousNames.find(name =>
          name.toLowerCase() === query.toLowerCase() ||
          query.toLowerCase().includes(name.toLowerCase())
        )

        // إذا لم يكن هناك تطابق تام، اعرض القائمة
        if (!exactMatch && query.split(' ').length < 3) {
          responseText = `🤔 وجدت عدة معلمين بأسماء متشابهة:\n\n`
          parsed.ambiguousNames.forEach((name, idx) => {
            responseText += `${idx + 1}. ${name}\n`
          })
          responseText += `\nهل تقصد أحدهم؟ اضغط على الاسم أو اكتب الاسم الكامل.`

          // إنشاء اقتراحات قابلة للضغط مع الاسم الكامل
          const intentPrefix = parsed.intent === 'get_schedule' ? '' :
                              parsed.intent === 'absent_teacher' ? 'غائب' :
                              parsed.intent === 'suggest_substitute' ? 'بديل' : ''

          suggestions = parsed.ambiguousNames.slice(0, 5).map(name =>
            intentPrefix ? `${name} ${intentPrefix}` : `${name}`
          )

          return {
            id: Date.now().toString(),
            text: responseText,
            sender: 'bot',
            timestamp: new Date(),
            suggestions,
            type: 'text'
          }
        }
      }

      switch (parsed.intent) {
        case 'show_chart': {
          responseText = '📊 اختر نوع الرسم البياني:\n\n'
          responseText += '1️⃣ عدد الحصص لكل معلم\n'
          responseText += '2️⃣ توزيع الحصص حسب الأيام\n'
          responseText += '3️⃣ توزيع الحصص حسب المواد\n\n'

          suggestions = [
            'حصص المعلمين',
            'توزيع الأيام',
            'توزيع المواد'
          ]
          break
        }

        case 'absent_teacher': {
          const teacherName = parsed.teacherName || context.teacherName
          const day = parsed.day || context.day
          const now = new Date()
          const currentDay = day || String((now.getDay() === 0 ? 7 : now.getDay()) === 6 || now.getDay() === 0 ? 1 : now.getDay())
          const currentHour = now.getHours()
          const currentPeriod = parsed.period || (currentHour >= 7 && currentHour < 13 ? currentHour - 6 : 1)

          if (!teacherName) {
            responseText = '🤔 من هو المعلم الغائب؟\n\nمثال: "أحمد غائب" أو "من يعوض سالم؟"'
            suggestions = allTeachers.slice(0, 3).map(t => `${t.name} غائب`)
          } else {
            const suggestion = suggestSmartSubstitute(teacherName, currentDay, currentPeriod)
            if (!suggestion) {
              responseText = `❌ لم أجد معلومات عن المعلم "${teacherName}".`
            } else {
              const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
              responseText = `⚠️ تنبيه غياب: المعلم/ة ${teacherName}\n`
              responseText += `📅 اليوم: ${dayNames[parseInt(currentDay)]}\n`
              responseText += `⏰ الحصة: ${currentPeriod}\n\n`

              if (suggestion.subject) {
                responseText += `📘 المادة المطلوب تغطيتها: ${suggestion.subject}\n\n`
              }

              if (suggestion.substitutes.length === 0) {
                responseText += '❌ للأسف، جميع المعلمين مشغولون في هذا الوقت.\n\n'
                responseText += '💡 اقتراحات:\n'
                responseText += '• تأجيل الحصة\n'
                responseText += '• دمج الصفوف\n'
                responseText += '• التواصل مع معلمين خارج الجدول'
              } else {
                responseText += '✅ المعلمون المتاحون للتعويض (مرتبين حسب الأفضلية):\n\n'

                const topSubs = suggestion.substitutes.slice(0, 5)
                topSubs.forEach((sub, idx) => {
                  responseText += `${idx + 1}. ${sub.categoryIcon} ${sub.teacher.name}\n`
                  responseText += `   📚 التخصص: ${sub.teacher.subject}\n`
                  responseText += `   ${sub.categoryLabel}\n`
                  responseText += `   📊 عدد الحصص: ${sub.workload} حصة\n`
                  responseText += `   ⭐ درجة الملاءمة: ${sub.score.toFixed(0)}%\n`

                  if (sub.warnings.length > 0) {
                    messageType = 'warning'
                    sub.warnings.forEach(w => {
                      responseText += `   ⚠️ ${w}\n`
                      warnings.push(`${sub.teacher.name}: ${w}`)
                    })
                  }
                  responseText += '\n'
                })

                responseText += '🔹 تفسير الرموز:\n'
                responseText += '🟢 نفس المادة (الأفضل)\n'
                responseText += '🔵 متاح تماماً\n'
                responseText += '🟠 خبرة بنفس الصف\n'
                responseText += '🟡 حمل خفيف\n\n'

                // إنشاء رسوم بيانية للمعلمين المتاحين

                // 1. رسم بياني حسب عدد المعلمين المتاحين
                const availableByCategory = new Map<string, number>()
                suggestion.substitutes.forEach(sub => {
                  const count = availableByCategory.get(sub.categoryLabel) || 0
                  availableByCategory.set(sub.categoryLabel, count + 1)
                })

                const categoryChartData: ChartData = {
                  type: 'pie',
                  data: Array.from(availableByCategory.entries()).map(([category, count]) => ({
                    الفئة: category,
                    العدد: count
                  })),
                  xKey: 'الفئة',
                  yKey: 'العدد',
                  title: 'توزيع المعلمين المتاحين حسب الفئة'
                }

                // 2. رسم بياني حسب المادة
                const subjectMap = new Map<string, number>()
                suggestion.substitutes.forEach(sub => {
                  const subject = sub.teacher.subject || 'غير محدد'
                  const count = subjectMap.get(subject) || 0
                  subjectMap.set(subject, count + 1)
                })

                const subjectChartData: ChartData = {
                  type: 'bar',
                  data: Array.from(subjectMap.entries())
                    .map(([subject, count]) => ({
                      المادة: subject,
                      العدد: count
                    }))
                    .sort((a, b) => b.العدد - a.العدد)
                    .slice(0, 10),
                  xKey: 'المادة',
                  yKey: 'العدد',
                  title: 'توزيع المعلمين المتاحين حسب المادة'
                }

                // 3. رسم بياني حسب الحمل (عدد الحصص)
                const workloadRanges = {
                  'خفيف (0-10)': 0,
                  'متوسط (11-20)': 0,
                  'عالي (21+)': 0
                }

                suggestion.substitutes.forEach(sub => {
                  if (sub.workload <= 10) {
                    workloadRanges['خفيف (0-10)']++
                  } else if (sub.workload <= 20) {
                    workloadRanges['متوسط (11-20)']++
                  } else {
                    workloadRanges['عالي (21+)']++
                  }
                })

                const workloadChartData: ChartData = {
                  type: 'bar',
                  data: Object.entries(workloadRanges).map(([range, count]) => ({
                    الحمل: range,
                    العدد: count
                  })),
                  xKey: 'الحمل',
                  yKey: 'العدد',
                  title: 'توزيع المعلمين المتاحين حسب الحمل الدراسي'
                }

                // إضافة الرسوم البيانية إلى الرسالة
                responseText += '\n📊 رسوم بيانية تحليلية للبدلاء المتاحين'

                // 4. رسم بياني لأسماء المعلمين البدلاء (أفضل 10)
                const teacherNamesData: ChartData = {
                  type: 'bar',
                  data: suggestion.substitutes
                    .slice(0, 10)
                    .map((sub, idx) => ({
                      المعلم: sub.teacher.name,
                      'درجة الملاءمة': Math.round(sub.score)
                    }))
                    .sort((a, b) => b['درجة الملاءمة'] - a['درجة الملاءمة']),
                  xKey: 'المعلم',
                  yKey: 'درجة الملاءمة',
                  title: 'ترتيب المعلمين البدلاء حسب درجة الملاءمة (أفضل 10)'
                }

                // إنشاء رسائل منفصلة للرسوم البيانية
                setTimeout(() => {
                  const chartMessages: Message[] = [
                    {
                      id: (Date.now() + 1).toString(),
                      text: '📊 توزيع المعلمين حسب الفئة',
                      sender: 'bot',
                      timestamp: new Date(),
                      chartData: categoryChartData,
                      type: 'chart'
                    },
                    {
                      id: (Date.now() + 2).toString(),
                      text: '📊 توزيع المعلمين حسب المادة',
                      sender: 'bot',
                      timestamp: new Date(),
                      chartData: subjectChartData,
                      type: 'chart'
                    },
                    {
                      id: (Date.now() + 3).toString(),
                      text: '📊 توزيع المعلمين حسب الحمل الدراسي',
                      sender: 'bot',
                      timestamp: new Date(),
                      chartData: workloadChartData,
                      type: 'chart'
                    },
                    {
                      id: (Date.now() + 4).toString(),
                      text: '📊 ترتيب أفضل المعلمين البدلاء',
                      sender: 'bot',
                      timestamp: new Date(),
                      chartData: teacherNamesData,
                      type: 'chart'
                    }
                  ]
                  setMessages(prev => [...prev, ...chartMessages])
                }, 1200)
              }

              suggestions = ['من فاضي الآن؟', 'تحليل شامل', 'إحصائيات']
            }
          }
          break
        }

        case 'suggest_substitute': {
          const teacherName = parsed.teacherName || context.teacherName
          const day = parsed.day || context.day

          if (!teacherName) {
            responseText = '🤔 من هو المعلم الذي تحتاج بديلاً له؟\n\nمثال: "بديل أحمد الثلاثاء"'
            suggestions = allTeachers.slice(0, 3).map(t => `بديل ${t.name}`)
          } else if (!day) {
            responseText = `🤔 في أي يوم تحتاج بديلاً للمعلم/ة ${teacherName}؟`
            suggestions = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
          } else {
            const suggestion = suggestSmartSubstitute(teacherName, day, parsed.period)
            if (!suggestion) {
              responseText = `❌ لم أجد معلومات عن المعلم "${teacherName}".`
            } else {
              const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
              responseText = `🎯 اقتراح بديل ذكي للمعلم/ة ${teacherName} يوم ${dayNames[parseInt(day)]}:\n\n`

              if (suggestion.subject) {
                responseText += `📘 المادة: ${suggestion.subject}\n\n`
              }

              if (suggestion.substitutes.length === 0) {
                responseText += '❌ للأسف، جميع المعلمين مشغولون في هذا الوقت.'
              } else {
                responseText += '✅ أفضل البدلاء (مصنّفين حسب الملاءمة):\n\n'

                // Filter by category if selected
                const filteredSubs = filterCategory === 'all'
                  ? suggestion.substitutes.slice(0, 5)
                  : suggestion.substitutes.filter(s => s.category === filterCategory).slice(0, 3)

                filteredSubs.forEach((sub, idx) => {
                  responseText += `${idx + 1}. ${sub.categoryIcon} ${sub.teacher.name} - ${sub.categoryLabel}\n`
                  responseText += `   التخصص: ${sub.teacher.subject}\n`
                  responseText += `   عدد الحصص: ${sub.workload}\n`
                  responseText += `   درجة الملاءمة: ${sub.score.toFixed(0)}%\n`

                  if (sub.warnings.length > 0) {
                    messageType = 'warning'
                    sub.warnings.forEach(w => {
                      responseText += `   ${w}\n`
                      warnings.push(`${sub.teacher.name}: ${w}`)
                    })
                  }
                  responseText += '\n'
                })

                responseText += '\n🔹 الرموز:\n'
                responseText += '🟢 نفس المادة  🔵 متاح  🟠 خبرة بالصف  🟡 حمل خفيف'
              }
              suggestions = ['بديل آخر', 'تحليل العدالة', 'رسم بياني']
            }
          }
          break
        }

        case 'get_schedule':
        case 'count_periods':
        case 'teaching_days': {
          // Similar logic to before but with enhanced name matching
          const teacherName = parsed.teacherName || context.teacherName
          if (!teacherName) {
            responseText = parsed.intent === 'count_periods'
              ? '🤔 عدد حصص أي معلم تريد معرفته؟'
              : parsed.intent === 'teaching_days'
              ? '🤔 أيام تدريس أي معلم تريد معرفتها؟'
              : '🤔 من هو المعلم الذي تريد معرفة جدوله؟'
            suggestions = allTeachers.slice(0, 5).map(t => `${parsed.intent === 'count_periods' ? 'حصص' : parsed.intent === 'teaching_days' ? 'أيام' : 'جدول'} ${t.name}`)
          } else {
            const scheduleInfo = getTeacherSchedule(teacherName, parsed.day)
            if (!scheduleInfo) {
              responseText = `❌ لم أجد المعلم "${teacherName}" في النظام.\n\n`
              responseText += `💡 نصائح للبحث:\n`
              responseText += `• تأكد من كتابة الاسم بشكل صحيح\n`
              responseText += `• جرب كتابة الاسم الأول فقط\n`
              responseText += `• اكتب "إحصائيات" لرؤية قائمة المعلمين\n\n`
              if (allTeachers.length > 0) {
                responseText += `📋 بعض المعلمين في النظام:\n`
                allTeachers.slice(0, 5).forEach((t, idx) => {
                  responseText += `${idx + 1}. ${t.name}\n`
                })
              }
              suggestions = allTeachers.slice(0, 3).map(t => `جدول ${t.name}`)
            } else {
              if (parsed.intent === 'count_periods') {
                responseText = `📊 المعلم/ة ${teacherName}:\n\n`
                responseText += `• عدد الحصص الأسبوعية: ${scheduleInfo.totalPeriods}\n`
                responseText += `• التخصص: ${scheduleInfo.teacher.subject}`
              } else if (parsed.intent === 'teaching_days') {
                const days = new Set(scheduleInfo.schedules.map(s => s.dayID))
                const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
                const daysList = Array.from(days).map(d => dayNames[parseInt(d)]).join('، ')
                responseText = `📅 المعلم/ة ${teacherName} يدرّس في:\n\n${daysList}\n\n📊 عدد الأيام: ${days.size} أيام`
              } else {
                const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
                const dayStr = parsed.day ? ` يوم ${dayNames[parseInt(parsed.day)]}` : ''
                responseText = `📋 جدول المعلم/ة ${scheduleInfo.teacher.name}${dayStr}:\n\n`
                responseText += `👤 الاسم: ${scheduleInfo.teacher.name}\n`
                responseText += `📚 التخصص: ${scheduleInfo.teacher.subject}\n`
                responseText += `📊 إجمالي الحصص: ${scheduleInfo.totalPeriods} حصة\n\n`

                if (scheduleInfo.schedules.length === 0) {
                  responseText += '⚠️ لا توجد حصص مجدولة لهذا المعلم'
                  if (parsed.day) {
                    responseText += ' في هذا اليوم.'
                  } else {
                    responseText += '.\n\n💡 تأكد من أن الجدول محمّل بشكل صحيح.'
                  }
                } else {
                  // تنظيم الحصص حسب اليوم
                  const byDay = new Map<string, any[]>()
                  scheduleInfo.schedules.forEach(s => {
                    const day = latestSchedule?.days.find(d => d.day === s.dayID)
                    const dayName = day?.name || s.dayID
                    if (!byDay.has(dayName)) {
                      byDay.set(dayName, [])
                    }
                    byDay.get(dayName)?.push(s)
                  })

                  responseText += `📅 الجدول التفصيلي:\n\n`
                  Array.from(byDay.entries()).forEach(([dayName, periods]) => {
                    responseText += `▫️ ${dayName}:\n`
                    periods.sort((a, b) => a.period - b.period).forEach(s => {
                      const subject = latestSchedule?.subjects.find(sub => sub.originalId === s.subjectGradeID)
                      const className = latestSchedule?.classes.find(c => c.originalId === s.classID)
                      responseText += `   ${s.period}. ${subject?.name || 'مادة'} - ${className?.name || 'صف'}\n`
                    })
                    responseText += '\n'
                  })
                }
              }
              suggestions = [`جدول ${teacherName}`, `بديل ${teacherName}`, 'رسم بياني']
            }
          }
          break
        }

        case 'available_now': {
          const availableInfo = getAvailableTeachersNow(parsed.day, parsed.period)
          if (!availableInfo) {
            responseText = '❌ لا يوجد جدول معتمد.'
          } else {
            const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
            const dayName = dayNames[parseInt(availableInfo.day)] || 'اليوم'
            responseText = `👨‍🏫 المعلمون المتاحون ${parsed.day ? 'يوم ' + dayName : 'الآن'}:\n\n`
            responseText += `⏰ الوقت: الحصة ${availableInfo.period}\n\n`

            if (availableInfo.availableTeachers.length === 0) {
              responseText += '❌ للأسف، جميع المعلمين مشغولون في هذا الوقت.'
            } else {
              responseText += `✅ المعلمون المتاحون (${availableInfo.availableTeachers.length}):\n\n`
              availableInfo.availableTeachers.slice(0, 10).forEach((teacher, idx) => {
                responseText += `${idx + 1}. 👨‍🏫 ${teacher.name}\n`
                responseText += `   📚 التخصص: ${teacher.subject}\n\n`
              })

              if (availableInfo.availableTeachers.length > 10) {
                responseText += `\n... و ${availableInfo.availableTeachers.length - 10} معلمين آخرين`
              }

              responseText += `\n\n📊 الإحصائيات:\n`
              responseText += `• المتاحون: ${availableInfo.availableTeachers.length}\n`
              responseText += `• المشغولون: ${availableInfo.busyCount}`
            }
            suggestions = ['بديل ذكي', 'رسم بياني', 'جدول معلم']
          }
          break
        }

        case 'statistics': {
          if (!latestSchedule) {
            responseText = '❌ لا يوجد جدول معتمد في النظام'
          } else {
            const totalTeachers = allTeachers.length
            const totalClasses = latestSchedule.classes?.length || 0
            const totalSubjects = latestSchedule.subjects?.length || 0
            const totalPeriods = latestSchedule.schedules?.length || 0
            const daysCount = new Set(latestSchedule.schedules?.map(s => s.dayID)).size

            responseText = `📊 إحصائيات النظام:\n\n`
            responseText += `👨‍🏫 عدد المعلمين: ${totalTeachers} معلم\n`
            responseText += `🏫 عدد الصفوف: ${totalClasses} صف\n`
            responseText += `📚 عدد المواد: ${totalSubjects} مادة\n`
            responseText += `📅 أيام الدراسة: ${daysCount} أيام\n`
            responseText += `⏰ إجمالي الحصص: ${totalPeriods} حصة\n\n`

            // أكثر المعلمين حصصاً
            const workload = new Map<string, number>()
            latestSchedule.schedules?.forEach(s => {
              const count = workload.get(s.teacherID) || 0
              workload.set(s.teacherID, count + 1)
            })
            const sorted = Array.from(workload.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)

            responseText += `🏆 أكثر المعلمين حصصاً:\n`
            sorted.forEach((entry, idx) => {
              const teacher = allTeachers.find(t =>
                t.originalId === entry[0] || t.id === entry[0]
              )
              if (teacher) {
                responseText += `${idx + 1}. ${teacher.name}: ${entry[1]} حصة\n`
              }
            })
          }
          suggestions = ['رسم بياني', 'جدول معلم', 'من فاضي؟']
          break
        }

        case 'system_info': {
          responseText = `ℹ️ معلومات عن النظام:\n\n`
          responseText += `📋 هذا النظام يساعدك على:\n\n`
          responseText += `1️⃣ إدارة جداول المعلمين والحصص الاحتياطية\n`
          responseText += `2️⃣ تتبع غياب المعلمين وإيجاد البدلاء الأنسب\n`
          responseText += `3️⃣ تحليل توزيع الحصص والعدالة بين المعلمين\n`
          responseText += `4️⃣ عرض الإحصائيات والرسوم البيانية\n`
          responseText += `5️⃣ البحث السريع عن المعلمين والجداول\n\n`
          responseText += `🎯 الميزات:\n`
          responseText += `• 🎤 إدخال صوتي\n`
          responseText += `• 🧠 ذكاء اصطناعي لفهم الأسئلة\n`
          responseText += `• 📊 رسوم بيانية تفاعلية\n`
          responseText += `• ⚠️ تحذيرات الحصص المتتالية\n`
          responseText += `• 🔍 بحث ذكي بالأسماء\n`
          suggestions = ['إحصائيات', 'مساعدة', 'رسم بياني']
          break
        }

        case 'class_info':
        case 'subject_info': {
          responseText = `🔍 هذه الميزة قيد التطوير!\n\n`
          responseText += `حالياً يمكنك:\n`
          responseText += `• البحث عن معلم معين: "جدول كمال"\n`
          responseText += `• معرفة من يدرس: "من يدرس الرياضيات؟"\n`
          responseText += `• عرض الإحصائيات: "إحصائيات"\n`
          suggestions = ['إحصائيات', 'جدول معلم', 'من فاضي؟']
          break
        }

        case 'thanks': {
          const responses = [
            '😊 العفو! سعيد بمساعدتك',
            '🙏 لا شكر على واجب!',
            '💚 دائماً في الخدمة',
            '✨ شكراً لك! هل تحتاج مساعدة أخرى؟'
          ]
          responseText = responses[Math.floor(Math.random() * responses.length)]
          suggestions = ['جدول معلم', 'من فاضي؟', 'إحصائيات']
          break
        }

        case 'help':
          responseText = `💡 دليل المساعد الذكي:\n\n`
          responseText += `🎙️ إدخال صوتي:\n   اضغط على 🎤 وتحدث بوضوح\n\n`
          responseText += `🧠 أمثلة الأسئلة:\n`
          responseText += `   • "أحمد غائب"\n`
          responseText += `   • "جدول كمال بلطيفة"\n`
          responseText += `   • "كم حصة عند خالد؟"\n`
          responseText += `   • "مين فاضي الآن؟"\n`
          responseText += `   • "إحصائيات النظام"\n`
          responseText += `   • "رسم بياني لأحمد"\n\n`
          responseText += `📊 الإمكانيات:\n`
          responseText += `   • عرض جداول المعلمين\n`
          responseText += `   • اقتراح بدلاء أذكياء\n`
          responseText += `   • رسوم بيانية تفاعلية\n`
          responseText += `   • إحصائيات شاملة\n\n`
          responseText += `⚠️ يكتشف الغياب تلقائياً ويقترح الأنسب!`
          suggestions = ['إحصائيات', 'أحمد غائب', 'من فاضي؟']
          break

        default:
          if (query.includes('حصص المعلمين') || query.includes('1')) {
            const chartDataObj = generateChartData('teacher_workload')
            if (chartDataObj) {
              chartData = chartDataObj
              messageType = 'chart'
              responseText = '📊 عدد الحصص لكل معلم'
            }
          } else if (query.includes('توزيع الأيام') || query.includes('2')) {
            const chartDataObj = generateChartData('daily_distribution')
            if (chartDataObj) {
              chartData = chartDataObj
              messageType = 'chart'
              responseText = '📈 توزيع الحصص حسب الأيام'
            }
          } else if (query.includes('توزيع المواد') || query.includes('3')) {
            const chartDataObj = generateChartData('subject_distribution')
            if (chartDataObj) {
              chartData = chartDataObj
              messageType = 'chart'
              responseText = '📊 توزيع الحصص حسب المواد'
            }
          } else if (parsed.teacherName && (query.includes('رسم') || query.includes('بيان') || query.includes('chart'))) {
            // رسم بياني لمعلم محدد
            const teacherChart = generateTeacherChart(parsed.teacherName)
            if (teacherChart) {
              chartData = teacherChart
              messageType = 'chart'
              responseText = `📊 توزيع حصص ${parsed.teacherName} حسب الأيام`
              suggestions = [`جدول ${parsed.teacherName}`, `بديل ${parsed.teacherName}`, 'رسم عام']
            } else {
              responseText = `❌ لم أجد المعلم "${parsed.teacherName}"`
            }
          } else {
            responseText = `🤔 عذراً، لم أفهم سؤالك.\n\nجرّب:\n• "أحمد غائب" - للبحث عن بديل\n• "من يعوض سالم؟"\n• "جدول كمال بلطيفة"\n• "كم حصة خالد؟"\n• "رسم بياني لكمال"\n• "مين فاضي الآن؟"\n• أو اضغط 🎤 للتحدث`
            suggestions = ['مساعدة', 'أحمد غائب', 'من فاضي؟']
          }
      }
    }

    return {
      id: Date.now().toString(),
      text: responseText,
      sender: 'bot',
      timestamp: new Date(),
      suggestions,
      chartData: chartData || undefined,
      type: messageType,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  const handleSend = () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }
    setMessages(prev => [...prev, userMessage])
    setInputText('')

    setIsTyping(true)

    setTimeout(() => {
      const botResponse = generateResponse(inputText)
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)

      if (voiceEnabled && botResponse.type === 'text') {
        setTimeout(() => speak(botResponse.text), 300)
      }
    }, 800)
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (suggestion === '🎤 تحدث معي') {
      startListening()
      return
    }

    // إرسال الرسالة مباشرة بدون تكرار
    if (!suggestion.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: suggestion,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }
    setMessages(prev => [...prev, userMessage])

    setIsTyping(true)

    setTimeout(() => {
      const botResponse = generateResponse(suggestion)
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)

      if (voiceEnabled && botResponse.type === 'text') {
        setTimeout(() => speak(botResponse.text), 300)
      }
    }, 800)
  }

  const clearHistory = () => {
    localStorage.removeItem('ultimate-chatbot-history')
    initializeWelcomeMessage()
    setContext({})
  }

  const exportConversation = () => {
    const content = messages.map(m =>
      `[${m.timestamp.toLocaleString('ar-SA')}] ${m.sender === 'user' ? 'أنت' : 'المساعد'}: ${m.text}${m.warnings ? '\n⚠️ تحذيرات: ' + m.warnings.join(', ') : ''}`
    ).join('\n\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `محادثة-ذكية-${new Date().toLocaleDateString('ar-SA')}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Copy conversation to clipboard
  const copyConversation = async () => {
    const content = messages.map(m =>
      `${m.sender === 'user' ? 'أنت' : 'المساعد'}: ${m.text}`
    ).join('\n\n')

    try {
      await navigator.clipboard.writeText(content)
      const successMsg: Message = {
        id: Date.now().toString(),
        text: '✅ تم نسخ المحادثة إلى الحافظة بنجاح!',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, successMsg])
    } catch (error) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: '❌ فشل نسخ المحادثة. يرجى المحاولة مرة أخرى.',
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, errorMsg])
    }
  }

  // Render chart
  const renderChart = (chartData: ChartData, isExpanded = false) => {
    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

    return (
      <div
        className={`w-full ${isExpanded ? 'h-[500px]' : 'h-[300px]'} mt-4 bg-white p-4 rounded-lg border ${
          !isExpanded ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
        }`}
        onClick={() => !isExpanded && setExpandedChart(chartData)}
        title={!isExpanded ? 'اضغط للتكبير 🔍' : ''}
      >
        <h4 className={`${isExpanded ? 'text-lg' : 'text-sm'} font-semibold text-center mb-4`}>
          {chartData.title}
          {!isExpanded && <span className="text-xs text-gray-500 mr-2">🔍 (اضغط للتكبير)</span>}
        </h4>
        <ResponsiveContainer width="100%" height="85%">
          {chartData.type === 'bar' ? (
            <BarChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartData.xKey} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={chartData.yKey} fill="#10b981" />
            </BarChart>
          ) : chartData.type === 'line' ? (
            <LineChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartData.xKey} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={chartData.yKey} stroke="#10b981" strokeWidth={2} />
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData.data}
                dataKey={chartData.yKey}
                nameKey={chartData.xKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {chartData.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 z-50 flex items-center justify-center group animate-pulse"
          size="icon"
        >
          <div className="relative">
            <Robot className="w-8 h-8 text-white" weight="fill" />
            <Sparkle
              className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1 animate-bounce"
              weight="fill"
            />
          </div>
          <span className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            🚀 المساعد الذكي الشامل
          </span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card
          className={`fixed shadow-2xl z-50 flex flex-col ${
            isFullScreen
              ? 'inset-4 w-auto h-auto'
              : 'w-[350px]'
          } ${isDragging ? 'cursor-grabbing' : ''}`}
          style={
            !isFullScreen
              ? {
                  maxWidth: '350px',
                  maxHeight: '70vh',
                  bottom: position.y ? 'auto' : '20px',
                  right: position.x ? 'auto' : '20px',
                  left: position.x ? `${position.x}px` : 'auto',
                  top: position.y ? `${position.y}px` : 'auto',
                }
              : undefined
          }
          dir="rtl"
        >
          <CardHeader
            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white pb-2 pt-2 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center relative">
                  <Robot className="w-4 h-4" weight="fill" />
                  {isListening && (
                    <div className="absolute -inset-1 bg-red-500 rounded-full animate-ping opacity-75" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-xs font-bold">المساعد الذكي</CardTitle>
                  <p className="text-[8px] text-white/80 flex items-center gap-0.5">
                    {isListening ? (
                      <span className="flex items-center gap-0.5 animate-pulse">
                        <Microphone className="w-2.5 h-2.5" /> أستمع...
                      </span>
                    ) : isSpeaking ? (
                      <span className="flex items-center gap-0.5 animate-pulse">
                        <SpeakerHigh className="w-2.5 h-2.5" /> أتحدث...
                      </span>
                    ) : (
                      'AI 🧠'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {/* زر إيقاف الكلام الفوري */}
                {isSpeaking && (
                  <Button
                    onClick={() => {
                      window.speechSynthesis.cancel()
                      setIsSpeaking(false)
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-white hover:bg-red-500/30 bg-red-500/20 animate-pulse"
                    title="إيقاف الكلام"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-white hover:bg-white/20"
                  title={voiceEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
                >
                  {voiceEnabled ? (
                    <SpeakerHigh className="w-3 h-3" />
                  ) : (
                    <SpeakerSlash className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  onClick={clearHistory}
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-white hover:bg-white/20"
                  title="مسح"
                >
                  <Eraser className="w-2.5 h-2.5" />
                </Button>
                <Button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-white hover:bg-white/20"
                  title={isFullScreen ? 'تصغير' : 'توسيع'}
                >
                  {isFullScreen ? (
                    <ArrowsIn className="w-3 h-3" />
                  ) : (
                    <ArrowsOut className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-white hover:bg-white/20"
                  title="إغلاق"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-2" ref={scrollRef} style={{ maxHeight: 'calc(70vh - 140px)' }}>
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div key={msg.id} className="w-full">
                    <div
                      className={`flex items-start gap-1.5 ${
                        msg.sender === 'user' ? 'flex-row-reverse justify-start' : 'flex-row justify-start'
                      }`}
                    >
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
                            : 'bg-gradient-to-br from-teal-400 to-cyan-600'
                        }`}
                      >
                        {msg.sender === 'user' ? (
                          <UserCircle className="w-3 h-3 text-white" weight="fill" />
                        ) : (
                          <Robot className="w-3 h-3 text-white" weight="fill" />
                        )}
                      </div>
                      <div className={`flex-1 max-w-[85%]`}>
                        {/* اسم المرسل */}
                        <p className={`text-[10px] font-semibold mb-1 ${
                          msg.sender === 'user' ? 'text-right text-emerald-700' : 'text-left text-teal-700'
                        }`}>
                          {msg.sender === 'user' ? 'أنت' : 'المساعد'}
                        </p>
                        <div
                          className={`rounded-lg px-2.5 py-2 shadow-sm ${
                            msg.sender === 'user'
                              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
                              : msg.type === 'warning'
                              ? 'bg-amber-50 text-gray-900 border border-amber-300'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </p>
                          {msg.warnings && msg.warnings.length > 0 && (
                            <Alert className="mt-3 bg-amber-100 border-amber-400">
                              <Warning className="h-4 w-4 text-amber-600" />
                              <AlertDescription className="text-xs">
                                {msg.warnings.map((w, i) => (
                                  <div key={i}>{w}</div>
                                ))}
                              </AlertDescription>
                            </Alert>
                          )}
                          <p
                            className={`text-xs mt-1.5 ${
                              msg.sender === 'user' ? 'text-emerald-100' : 'text-gray-500'
                            }`}
                          >
                            {msg.timestamp.toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        {/* Chart Display */}
                        {msg.chartData && renderChart(msg.chartData)}

                        {/* Suggestions */}
                        {msg.sender === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {msg.suggestions.map((suggestion, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="cursor-pointer hover:bg-emerald-50 hover:border-emerald-500 transition-colors text-sm px-3 py-1.5"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                {suggestion}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-start gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                      <Robot className="w-5 h-5 text-teal-700" weight="fill" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input Area - Sticky at bottom */}
            <div className="sticky bottom-0 p-2 border-t bg-gray-50 shadow-lg">
              <div className="flex gap-1.5">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={isListening ? "🎤 أستمع..." : "اكتب سؤالك..."}
                  className="flex-1 text-right resize-none text-xs"
                  style={{ minHeight: '40px', maxHeight: '80px' }}
                  rows={2}
                  disabled={isTyping || isListening}
                />
                <div className="flex flex-col gap-1 items-center">
                  <Button
                    onClick={isListening ? stopListening : startListening}
                    className={`h-9 w-9 rounded-full shadow-md transition-all ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700'
                    }`}
                    size="icon"
                    title={isListening ? 'إيقاف الاستماع' : 'ابدأ التحدث'}
                  >
                    {isListening ? (
                      <MicrophoneSlash className="w-4 h-4 text-white" weight="fill" />
                    ) : (
                      <Microphone className="w-4 h-4 text-white" weight="fill" />
                    )}
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={!inputText.trim() || isTyping}
                    className="bg-emerald-500 hover:bg-emerald-600 h-9 w-9 rounded-full shadow-md"
                    size="icon"
                    title="إرسال"
                  >
                    <PaperPlaneRight className="w-4 h-4" weight="fill" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-600 mt-1">
                <span>Enter للإرسال</span>
                {voiceEnabled && (
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <SpeakerHigh className="w-3 h-3" weight="fill" />
                    <span>صوت</span>
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart Expansion Dialog */}
      <Dialog open={!!expandedChart} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col"
          dir="rtl"
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-center">
              📊 {expandedChart?.title}
            </DialogTitle>
          </DialogHeader>

          {/* منطقة الرسم البياني مع تمرير عمودي وأفقي */}
          <div
            className="flex-1 overflow-x-auto overflow-y-auto mt-4 mb-4"
            style={{
              scrollbarWidth: 'thin',
              maxHeight: 'calc(95vh - 150px)'
            }}
          >
            <div className="min-w-[800px] min-h-[500px]">
              {expandedChart && renderChart(expandedChart, true)}
            </div>
          </div>

          {/* زر الإغلاق */}
          <div className="flex-shrink-0 flex justify-center gap-2 pt-4 border-t bg-white">
            <Button
              onClick={() => setExpandedChart(null)}
              variant="outline"
              className="w-full max-w-xs"
            >
              إغلاق ✕
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
