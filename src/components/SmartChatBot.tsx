import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useScheduleStorage } from '@/lib/useScheduleStorage'
import { Teacher, ScheduleData } from '@/lib/types'
import {
  ChatCircleDots,
  X,
  PaperPlaneRight,
  Sparkle,
  UserCircle,
  Robot
} from '@phosphor-icons/react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  suggestions?: string[]
}

interface ConversationContext {
  teacherName?: string
  day?: string
  period?: number
  subject?: string
  lastQuery?: string
}

export function SmartChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [context, setContext] = useState<ConversationContext>({})
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { approvedSchedules } = useScheduleStorage()

  // Load conversation history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('chatbot-history')
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

  // Save conversation to localStorage
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem('chatbot-history', JSON.stringify(messages))
    }
  }, [messages])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Get all teachers from approved schedules
  const allTeachers = useMemo(() => {
    return approvedSchedules.flatMap(schedule => schedule.teachers || [])
  }, [approvedSchedules])

  // Get latest approved schedule
  const latestSchedule = useMemo(() => {
    return approvedSchedules.length > 0
      ? approvedSchedules[approvedSchedules.length - 1]
      : null
  }, [approvedSchedules])

  // Natural Language Parser
  const parseQuery = (query: string): {
    intent: string
    teacherName?: string
    day?: string
    period?: number
    subject?: string
  } => {
    const q = query.toLowerCase().trim()

    // Extract teacher name (looks for Arabic names)
    let teacherName: string | undefined
    const teacherMatch = allTeachers.find(t =>
      q.includes(t.name.toLowerCase())
    )
    if (teacherMatch) {
      teacherName = teacherMatch.name
    }

    // Extract day
    const dayMap: Record<string, string> = {
      'الأحد': '1',
      'أحد': '1',
      'الاثنين': '2',
      'اثنين': '2',
      'الثلاثاء': '3',
      'ثلاثاء': '3',
      'الأربعاء': '4',
      'أربعاء': '4',
      'الخميس': '5',
      'خميس': '5'
    }
    let day: string | undefined
    for (const [dayName, dayId] of Object.entries(dayMap)) {
      if (q.includes(dayName)) {
        day = dayId
        break
      }
    }

    // Extract period number
    const periodMatch = q.match(/حصة\s*(\d+)|الحصة\s*(\d+)|(\d+)\s*حصة/)
    const period = periodMatch
      ? parseInt(periodMatch[1] || periodMatch[2] || periodMatch[3])
      : undefined

    // Determine intent
    let intent = 'unknown'
    if (q.includes('جدول') || q.includes('برنامج')) {
      intent = 'get_schedule'
    } else if (q.includes('بديل') || q.includes('بدائل') || q.includes('استبدال')) {
      intent = 'suggest_substitute'
    } else if (q.includes('عدد') && (q.includes('حصص') || q.includes('حصة'))) {
      intent = 'count_periods'
    } else if (q.includes('أيام') || q.includes('متى يدرس') || q.includes('متى تدرس')) {
      intent = 'teaching_days'
    } else if (q.includes('مساعدة') || q.includes('ساعدني') || q.includes('كيف')) {
      intent = 'help'
    } else if (q.includes('شكرا') || q.includes('شكراً')) {
      intent = 'thanks'
    }

    return { intent, teacherName, day, period, subject: undefined }
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

    // Find what the absent teacher teaches at that time
    const teacherOriginalId = teacher.originalId || teacher.id.split('-').pop()
    const absentSlot = latestSchedule.schedules.find(s =>
      s.teacherID === teacherOriginalId &&
      s.dayID === day &&
      (!period || s.period === period)
    )

    const subject = absentSlot
      ? latestSchedule.subjects.find(s => s.originalId === absentSlot.subjectGradeID)
      : null

    // Find busy teachers at that time
    const busyTeachers = new Set(
      latestSchedule.schedules
        .filter(s => s.dayID === day && (!period || s.period === period))
        .map(s => s.teacherID)
    )

    // Calculate workload for all teachers
    const teacherWorkload = new Map<string, number>()
    latestSchedule.schedules.forEach(s => {
      const count = teacherWorkload.get(s.teacherID) || 0
      teacherWorkload.set(s.teacherID, count + 1)
    })

    // Find available substitutes
    const availableTeachers = allTeachers.filter(t => {
      const tId = t.originalId || t.id.split('-').pop()
      return tId !== teacherOriginalId && !busyTeachers.has(tId!)
    })

    // Sort by workload (prefer teachers with fewer periods) and subject match
    const rankedSubstitutes = availableTeachers
      .map(t => {
        const tId = t.originalId || t.id.split('-').pop()
        const workload = teacherWorkload.get(tId!) || 0
        const subjectMatch = subject && t.subject === subject.name ? 100 : 0
        const fairnessScore = 100 - workload // Lower workload = higher score
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

    // Update context
    setContext(prev => ({
      ...prev,
      teacherName: parsed.teacherName || prev.teacherName,
      day: parsed.day || prev.day,
      period: parsed.period || prev.period,
      lastQuery: parsed.intent
    }))

    let responseText = ''
    let suggestions: string[] = []

    if (approvedSchedules.length === 0) {
      responseText = '⚠️ عذراً، لا يوجد جدول معتمد في النظام.\n\nيرجى رفع ملف XML واعتماده أولاً من صفحة "تحميل الجدول".'
      suggestions = []
    } else {
      switch (parsed.intent) {
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
                'معلم آخر'
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
              suggestions = ['بديل آخر', 'تحليل العدالة', 'معلم آخر']
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
              suggestions = [`جدول ${teacherName}`, `بديل ${teacherName}`, 'معلم آخر']
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
              suggestions = [`جدول ${teacherName}`, `حصص ${teacherName}`]
            }
          }
          break
        }

        case 'help':
          responseText = `💡 يمكنني مساعدتك في:\n\n`
          responseText += `1️⃣ معرفة جدول معلم:\n   "جدول أحمد" أو "برنامج فاطمة يوم الأحد"\n\n`
          responseText += `2️⃣ حساب الحصص:\n   "كم حصة لـ أحمد؟" أو "عدد حصص فاطمة"\n\n`
          responseText += `3️⃣ اقتراح بديل:\n   "من بديل أحمد الثلاثاء؟"\n\n`
          responseText += `4️⃣ معرفة أيام التدريس:\n   "متى يدرس أحمد؟"`
          suggestions = ['جدول معلم', 'اقترح بديل', 'عدد الحصص']
          break

        case 'thanks':
          responseText = '😊 العفو! سعيد بمساعدتك.\n\nهل تحتاج مساعدة أخرى؟'
          suggestions = ['جدول معلم', 'اقترح بديل', 'تحليل العدالة']
          break

        default:
          responseText = `🤔 عذراً، لم أفهم سؤالك.\n\nجرّب:\n• "جدول أحمد"\n• "بديل فاطمة الأحد"\n• "كم حصة لـ خالد؟"\n\nأو اكتب "مساعدة" لمعرفة المزيد.`
          suggestions = ['مساعدة', 'جدول معلم', 'اقترح بديل']
      }
    }

    return {
      id: Date.now().toString(),
      text: responseText,
      sender: 'bot',
      timestamp: new Date(),
      suggestions
    }
  }

  const handleSend = () => {
    if (!inputText.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputText('')

    // Show typing indicator
    setIsTyping(true)

    // Generate bot response with delay for natural feel
    setTimeout(() => {
      const botResponse = generateResponse(inputText)
      setMessages(prev => [...prev, botResponse])
      setIsTyping(false)
    }, 800)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion)
    setTimeout(() => handleSend(), 100)
  }

  const clearHistory = () => {
    localStorage.removeItem('chatbot-history')
    const welcomeMsg: Message = {
      id: Date.now().toString(),
      text: '🔄 تم مسح السجل. كيف يمكنني مساعدتك؟',
      sender: 'bot',
      timestamp: new Date(),
      suggestions: ['جدول معلم', 'اقترح بديل', 'عدد الحصص']
    }
    setMessages([welcomeMsg])
    setContext({})
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
            المساعد الذكي
          </span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 left-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col" dir="rtl">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Robot className="w-6 h-6" weight="fill" />
                </div>
                <div>
                  <CardTitle className="text-lg">المساعد الذكي</CardTitle>
                  <p className="text-xs text-white/80">مدعوم بالذكاء الاصطناعي</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={clearHistory}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  title="مسح السجل"
                >
                  <span className="text-sm">🗑️</span>
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
                      <div
                        className={`rounded-2xl px-4 py-2 max-w-[75%] ${
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
                    </div>

                    {/* Suggestions */}
                    {msg.sender === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-2 mr-10 flex flex-wrap gap-2">
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
              <p className="text-xs text-gray-500 mt-2 text-center">
                اضغط Enter للإرسال
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
