import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useScheduleStorage } from '@/lib/useScheduleStorage'
import { Teacher, ScheduleData } from '@/lib/types'
import {
  ChatCircleDots,
  X,
  PaperPlaneRight,
  Sparkle,
  UserCircle,
  Robot,
  SpeakerHigh,
  SpeakerSlash,
  ChartBar,
  Download,
  Eraser
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
  type?: 'text' | 'chart'
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
}

export function AdvancedSmartChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [context, setContext] = useState<ConversationContext>({})
  const [isTyping, setIsTyping] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [showChartBuilder, setShowChartBuilder] = useState(false)
  const [chartConfig, setChartConfig] = useState({
    type: 'bar' as 'bar' | 'line' | 'pie',
    xAxis: 'teacher',
    yAxis: 'periods'
  })
  const scrollRef = useRef<HTMLDivElement>(null)
  const { approvedSchedules } = useScheduleStorage()

  // Load conversation history
  useEffect(() => {
    const saved = localStorage.getItem('advanced-chatbot-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })))
      } catch (error) {
        console.error('Error loading chat history:', error)
        initializeWelcomeMessage()
      }
    } else {
      initializeWelcomeMessage()
    }
  }, [])

  const initializeWelcomeMessage = () => {
    const welcomeMsg: Message = {
      id: Date.now().toString(),
      text: '👋 مرحباً! أنا المساعد الذكي المتطور.\n\n🎯 يمكنني:\n• الإجابة على أسئلتك بالصوت 🔊\n• رسم بيانات تفصيلية 📊\n• اقتراح بدلاء أذكياء 🧠\n• تحليل توزيع الحصص 📈\n\nجرّب: "اعرض لي رسم بياني" أو "من بديل أحمد؟"',
      sender: 'bot',
      timestamp: new Date(),
      suggestions: ['رسم بياني', 'جدول معلم', 'اقترح بديل', 'تحليل العدالة'],
      type: 'text'
    }
    setMessages([welcomeMsg])
  }

  // Save conversation
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('advanced-chatbot-history', JSON.stringify(messages))
    }
  }, [messages])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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

  // Speech Synthesis
  const speak = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return

    // Stop any ongoing speech
    window.speechSynthesis.cancel()

    // Clean text from emojis and special characters for better pronunciation
    const cleanText = text.replace(/[📊📈📋🎯✅❌🤔💡🔊⚠️✨🧠👥📅📘]/g, '')

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

  // Enhanced NLP Parser
  const parseQuery = (query: string) => {
    const q = query.toLowerCase().trim()

    // Extract teacher name with improved matching
    let teacherName: string | undefined
    const teacherMatch = allTeachers.find(t => {
      const name = t.name.toLowerCase()
      return q.includes(name) ||
             name.split(' ').some(part => q.includes(part) && part.length > 2)
    })
    if (teacherMatch) {
      teacherName = teacherMatch.name
    }

    // Extract day with variations
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

    // Determine intent with improved detection
    let intent = 'unknown'

    if (q.includes('رسم') || q.includes('بيان') || q.includes('شارت') || q.includes('chart') || q.includes('اعرض')) {
      intent = 'show_chart'
    } else if (q.includes('جدول') || q.includes('برنامج') || q.includes('توقيت')) {
      intent = 'get_schedule'
    } else if (q.includes('بديل') || q.includes('بدائل') || q.includes('استبدال') || q.includes('احتياط')) {
      intent = 'suggest_substitute'
    } else if ((q.includes('عدد') || q.includes('كم') || q.includes('كام')) && (q.includes('حصص') || q.includes('حصة'))) {
      intent = 'count_periods'
    } else if (q.includes('أيام') || q.includes('متى') || q.includes('ايام')) {
      intent = 'teaching_days'
    } else if (q.includes('تحليل') || q.includes('عدالة') || q.includes('توزيع') || q.includes('احصائي')) {
      intent = 'analysis'
    } else if (q.includes('مساعدة') || q.includes('ساعدني') || q.includes('كيف') || q.includes('help')) {
      intent = 'help'
    } else if (q.includes('شكرا') || q.includes('شكراً') || q.includes('thanks')) {
      intent = 'thanks'
    }

    return { intent, teacherName, day, period, subject: undefined }
  }

  // Generate chart data
  const generateChartData = (type: string): ChartData | null => {
    if (!latestSchedule) return null

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

  // Get teacher schedule
  const getTeacherSchedule = (teacherName: string, day?: string) => {
    if (!latestSchedule) return null

    const teacher = allTeachers.find(t => t.name === teacherName)
    if (!teacher) return null

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

  // Smart substitute suggestion
  const suggestSubstitute = (teacherName: string, day: string, period?: number) => {
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

    const rankedSubstitutes = availableTeachers
      .map(t => {
        const tId = t.originalId || t.id.split('-').pop()
        const workload = teacherWorkload.get(tId!) || 0
        const subjectMatch = subject && t.subject === subject.name ? 100 : 0
        const fairnessScore = 100 - workload
        return {
          teacher: t,
          workload,
          score: subjectMatch + fairnessScore
        }
      })
      .sort((a, b) => b.score - a.score)

    return {
      absentTeacher: teacher,
      subject: subject?.name,
      substitutes: rankedSubstitutes.slice(0, 3),
      busyCount: busyTeachers.size
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
      lastQuery: parsed.intent
    }))

    let responseText = ''
    let suggestions: string[] = []
    let chartData: ChartData | null = null
    let messageType: 'text' | 'chart' = 'text'

    if (approvedSchedules.length === 0) {
      responseText = '⚠️ عذراً، لا يوجد جدول معتمد في النظام.\n\nيرجى رفع ملف XML واعتماده أولاً من صفحة "تحميل الجدول".'
      suggestions = []
    } else {
      switch (parsed.intent) {
        case 'show_chart': {
          responseText = '📊 اختر نوع الرسم البياني:\n\n'
          responseText += '1️⃣ عدد الحصص لكل معلم\n'
          responseText += '2️⃣ توزيع الحصص حسب الأيام\n'
          responseText += '3️⃣ توزيع الحصص حسب المواد\n\n'
          responseText += 'أو اضغط على أحد الاقتراحات أدناه:'

          suggestions = [
            'حصص المعلمين',
            'توزيع الأيام',
            'توزيع المواد'
          ]
          break
        }

        case 'get_schedule': {
          const teacherName = parsed.teacherName || context.teacherName
          if (!teacherName) {
            responseText = '🤔 من هو المعلم الذي تريد معرفة جدوله؟\n\nمثال: "جدول أحمد محمد" أو "برنامج فاطمة"'
            suggestions = allTeachers.slice(0, 5).map(t => `جدول ${t.name}`)
          } else {
            const scheduleInfo = getTeacherSchedule(teacherName, parsed.day)
            if (!scheduleInfo) {
              responseText = `❌ لم أجد المعلم "${teacherName}" في النظام.`
              suggestions = ['عرض جميع المعلمين']
            } else {
              const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
              const dayStr = parsed.day ? ` يوم ${dayNames[parseInt(parsed.day)]}` : ''
              responseText = `📋 جدول المعلم/ة ${teacherName}${dayStr}:\n\n`

              if (scheduleInfo.schedules.length === 0) {
                responseText += 'لا توجد حصص مجدولة.'
              } else {
                scheduleInfo.schedules.forEach(s => {
                  const subject = latestSchedule?.subjects.find(sub => sub.originalId === s.subjectGradeID)
                  const className = latestSchedule?.classes.find(c => c.originalId === s.classID)
                  const day = latestSchedule?.days.find(d => d.day === s.dayID)
                  responseText += `• ${day?.name} - الحصة ${s.period}: ${subject?.name || 'مادة'} (${className?.name || 'صف'})\n`
                })
                responseText += `\n📊 الإجمالي: ${scheduleInfo.totalPeriods} حصة`
              }
              suggestions = [
                `عدد حصص ${teacherName}`,
                `بديل ${teacherName}`,
                'رسم بياني'
              ]
            }
          }
          break
        }

        case 'suggest_substitute': {
          const teacherName = parsed.teacherName || context.teacherName
          const day = parsed.day || context.day

          if (!teacherName) {
            responseText = '🤔 من هو المعلم الغائب؟\n\nمثال: "بديل أحمد الثلاثاء"'
            suggestions = allTeachers.slice(0, 3).map(t => `بديل ${t.name}`)
          } else if (!day) {
            responseText = `🤔 في أي يوم تحتاج بديلاً للمعلم/ة ${teacherName}؟\n\nمثال: "يوم الأحد" أو "الثلاثاء"`
            suggestions = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
          } else {
            const suggestion = suggestSubstitute(teacherName, day, parsed.period)
            if (!suggestion) {
              responseText = `❌ لم أجد معلومات عن المعلم "${teacherName}".`
            } else {
              const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
              responseText = `🎯 اقتراح بديل للمعلم/ة ${teacherName} يوم ${dayNames[parseInt(day)]}:\n\n`

              if (suggestion.subject) {
                responseText += `📘 المادة: ${suggestion.subject}\n\n`
              }

              if (suggestion.substitutes.length === 0) {
                responseText += '❌ للأسف، جميع المعلمين مشغولون في هذا الوقت.'
              } else {
                responseText += '✅ أفضل البدلاء المتاحين:\n\n'
                suggestion.substitutes.forEach((sub, idx) => {
                  const match = sub.teacher.subject === suggestion.subject ? '✨ ' : ''
                  responseText += `${idx + 1}. ${match}${sub.teacher.name} (${sub.teacher.subject})\n`
                  responseText += `   • عدد حصصه: ${sub.workload}\n`
                  responseText += `   • درجة الملاءمة: ${sub.score.toFixed(0)}%\n\n`
                })
              }
              suggestions = ['بديل آخر', 'تحليل العدالة', 'رسم بياني']
            }
          }
          break
        }

        case 'count_periods': {
          const teacherName = parsed.teacherName || context.teacherName
          if (!teacherName) {
            responseText = '🤔 عدد حصص أي معلم تريد معرفته؟'
            suggestions = allTeachers.slice(0, 5).map(t => `حصص ${t.name}`)
          } else {
            const scheduleInfo = getTeacherSchedule(teacherName)
            if (!scheduleInfo) {
              responseText = `❌ لم أجد المعلم "${teacherName}".`
            } else {
              responseText = `📊 المعلم/ة ${teacherName}:\n\n`
              responseText += `• عدد الحصص الأسبوعية: ${scheduleInfo.totalPeriods}\n`
              responseText += `• التخصص: ${scheduleInfo.teacher.subject}`
              suggestions = [`جدول ${teacherName}`, `بديل ${teacherName}`, 'رسم بياني']
            }
          }
          break
        }

        case 'teaching_days': {
          const teacherName = parsed.teacherName || context.teacherName
          if (!teacherName) {
            responseText = '🤔 أيام تدريس أي معلم تريد معرفتها؟'
            suggestions = allTeachers.slice(0, 5).map(t => `أيام ${t.name}`)
          } else {
            const scheduleInfo = getTeacherSchedule(teacherName)
            if (!scheduleInfo) {
              responseText = `❌ لم أجد المعلم "${teacherName}".`
            } else {
              const days = new Set(scheduleInfo.schedules.map(s => s.dayID))
              const dayNames = ['', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
              const daysList = Array.from(days).map(d => dayNames[parseInt(d)]).join('، ')

              responseText = `📅 المعلم/ة ${teacherName} يدرّس في:\n\n${daysList}\n\n`
              responseText += `📊 عدد الأيام: ${days.size} أيام`
              suggestions = [`جدول ${teacherName}`, `حصص ${teacherName}`, 'رسم بياني']
            }
          }
          break
        }

        case 'analysis': {
          const chartDataObj = generateChartData('teacher_workload')
          if (chartDataObj) {
            chartData = chartDataObj
            messageType = 'chart'
            responseText = '📊 تحليل توزيع الحصص:\n\nإليك رسم بياني يوضح عدد الحصص لكل معلم.'
            suggestions = ['توزيع الأيام', 'توزيع المواد', 'تحليل آخر']
          }
          break
        }

        case 'help':
          responseText = `💡 يمكنني مساعدتك في:\n\n`
          responseText += `1️⃣ معرفة جدول معلم:\n   "جدول أحمد" أو "برنامج فاطمة يوم الأحد"\n\n`
          responseText += `2️⃣ حساب الحصص:\n   "كم حصة لـ أحمد؟" أو "عدد حصص فاطمة"\n\n`
          responseText += `3️⃣ اقتراح بديل:\n   "من بديل أحمد الثلاثاء؟"\n\n`
          responseText += `4️⃣ رسومات بيانية:\n   "اعرض رسم بياني" أو "توزيع الحصص"\n\n`
          responseText += `🔊 يمكنني أيضاً قراءة الردود صوتياً!`
          suggestions = ['رسم بياني', 'جدول معلم', 'اقترح بديل']
          break

        case 'thanks':
          responseText = '😊 العفو! سعيد بمساعدتك.\n\nهل تحتاج مساعدة أخرى؟'
          suggestions = ['رسم بياني', 'جدول معلم', 'تحليل العدالة']
          break

        default:
          // Smart suggestions based on partial matches
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
          } else {
            responseText = `🤔 عذراً، لم أفهم سؤالك.\n\nجرّب:\n• "جدول أحمد"\n• "بديل فاطمة الأحد"\n• "كم حصة لـ خالد؟"\n• "رسم بياني"\n\nأو اكتب "مساعدة" لمعرفة المزيد.`
            suggestions = ['مساعدة', 'رسم بياني', 'جدول معلم']
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
      type: messageType
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

      // Speak the response if voice is enabled
      if (voiceEnabled && botResponse.type === 'text') {
        setTimeout(() => speak(botResponse.text), 300)
      }
    }, 800)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion)
    setTimeout(() => handleSend(), 100)
  }

  const clearHistory = () => {
    localStorage.removeItem('advanced-chatbot-history')
    initializeWelcomeMessage()
    setContext({})
  }

  const exportConversation = () => {
    const content = messages.map(m =>
      `[${m.timestamp.toLocaleString('ar-SA')}] ${m.sender === 'user' ? 'أنت' : 'المساعد'}: ${m.text}`
    ).join('\n\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `محادثة-${new Date().toLocaleDateString('ar-SA')}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Render chart component
  const renderChart = (chartData: ChartData) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D']

    return (
      <div className="w-full h-[300px] mt-4 bg-white p-4 rounded-lg border">
        <h4 className="text-sm font-semibold text-center mb-4">{chartData.title}</h4>
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
          className="fixed bottom-6 left-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 z-50 flex items-center justify-center group"
          size="icon"
        >
          <div className="relative">
            <ChatCircleDots className="w-8 h-8 text-white" weight="fill" />
            <Sparkle
              className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1 animate-pulse"
              weight="fill"
            />
          </div>
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            المساعد الذكي المتطور 🚀
          </span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 left-6 w-[480px] h-[700px] shadow-2xl z-50 flex flex-col" dir="rtl">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Robot className="w-6 h-6" weight="fill" />
                </div>
                <div>
                  <CardTitle className="text-lg">المساعد الذكي المتطور</CardTitle>
                  <p className="text-xs text-white/80 flex items-center gap-2">
                    <span>مدعوم بالذكاء الاصطناعي</span>
                    {isSpeaking && <span className="animate-pulse">🔊 يتحدث...</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  title={voiceEnabled ? 'إيقاف الصوت' : 'تشغيل الصوت'}
                >
                  {voiceEnabled ? (
                    <SpeakerHigh className="w-5 h-5" />
                  ) : (
                    <SpeakerSlash className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  onClick={exportConversation}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  title="تصدير المحادثة"
                >
                  <Download className="w-5 h-5" />
                </Button>
                <Button
                  onClick={clearHistory}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  title="مسح السجل"
                >
                  <Eraser className="w-5 h-5" />
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    <div
                      className={`flex items-start gap-2 ${
                        msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.sender === 'user'
                            ? 'bg-emerald-100'
                            : 'bg-gradient-to-br from-teal-100 to-emerald-100'
                        }`}
                      >
                        {msg.sender === 'user' ? (
                          <UserCircle className="w-5 h-5 text-emerald-700" weight="fill" />
                        ) : (
                          <Robot className="w-5 h-5 text-teal-700" weight="fill" />
                        )}
                      </div>
                      <div className={`flex-1 max-w-[85%]`}>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            msg.sender === 'user'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.text}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
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
                          <div className="mt-2 flex flex-wrap gap-2">
                            {msg.suggestions.map((suggestion, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="cursor-pointer hover:bg-emerald-50 hover:border-emerald-500 transition-colors"
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
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
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
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="اكتب سؤالك هنا..."
                  className="flex-1 text-right"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isTyping}
                  className="bg-emerald-500 hover:bg-emerald-600"
                  size="icon"
                >
                  <PaperPlaneRight className="w-5 h-5" weight="fill" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">
                  اضغط Enter للإرسال
                </p>
                {voiceEnabled && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <SpeakerHigh className="w-3 h-3" />
                    الردود الصوتية مفعّلة
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
