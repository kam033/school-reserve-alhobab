import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Schedule } from '@/lib/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface WeeklyChartProps {
  schedules: Schedule[]
}

export function WeeklyChart({ schedules }: WeeklyChartProps) {
  // أيام الأسبوع
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
  const dayIds = ['1', '2', '3', '4', '5']

  // حساب عدد الحصص لكل يوم
  const totalPeriods = dayIds.map((dayId) => {
    return schedules.filter((s) => s.dayID === dayId).length
  })

  const data = {
    labels: days,
    datasets: [
      {
        label: 'عدد الحصص',
        data: totalPeriods,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(34, 197, 94, 0.9)',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          family: 'Arial',
        },
        bodyFont: {
          size: 13,
          family: 'Arial',
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            return `عدد الحصص: ${context.parsed.y}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 13,
            family: 'Arial',
          },
        },
        title: {
          display: true,
          text: 'الأيام',
          font: {
            size: 14,
            weight: 'bold' as const,
            family: 'Arial',
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 12,
            family: 'Arial',
          },
          stepSize: 5,
        },
        title: {
          display: true,
          text: 'عدد الحصص',
          font: {
            size: 14,
            weight: 'bold' as const,
            family: 'Arial',
          },
        },
      },
    },
  }

  return (
    <Card className="shadow-lg border-emerald-200">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50">
        <CardTitle className="text-center text-2xl text-emerald-900 flex items-center justify-center gap-2">
          <span>📊</span>
          <span>الرسم البياني لتوزيع الحصص الأسبوعي</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div style={{ height: '400px' }}>
          <Bar data={data} options={options} />
        </div>

        {/* إحصائيات سريعة */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3" dir="rtl">
          {days.map((day, index) => (
            <div
              key={day}
              className="bg-gradient-to-br from-emerald-50 to-green-50 p-3 rounded-lg border border-emerald-200 text-center"
            >
              <p className="text-xs text-gray-600 mb-1">{day}</p>
              <p className="text-2xl font-bold text-emerald-700">{totalPeriods[index]}</p>
              <p className="text-xs text-gray-500">حصة</p>
            </div>
          ))}
        </div>

        {/* معلومات إضافية */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200" dir="rtl">
          <p className="text-sm text-blue-900">
            <span className="font-bold">💡 ملاحظة:</span> يوضح الرسم البياني توزيع الحصص على
            مدار الأسبوع، مما يساعد في تحديد الأيام الأكثر ازدحامًا.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
