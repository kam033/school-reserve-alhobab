export type UserRole = 'admin' | 'director' | 'teacher'

export interface User {
  id: string
  username: string
  password: string
  role: UserRole
  schoolId?: string
  name: string
}

export interface Teacher {
  id: string
  originalId?: string
  name: string
  short?: string
  subject: string
  schoolId: string
  color?: string
}

export interface Period {
  id: string
  day: string
  periodNumber: number
  teacherId: string
  subject: string
  className?: string
  startTime?: string
  endTime?: string
}

export interface Day {
  day: string
  name: string
  short: string
}

export interface Class {
  id: string
  originalId?: string
  name: string
  short: string
  classroomids?: string
  teacherid?: string
  grade?: string
}

export interface Subject {
  id: string
  originalId?: string
  name: string
  short: string
}

export interface Classroom {
  id: string
  originalId?: string
  name: string
  short: string
}

export interface TimeTableSchedule {
  id: string
  dayID: string
  period: number
  lengthID?: string
  schoolRoomID?: string
  subjectGradeID?: string
  classID?: string
  optionalClassID?: string
  teacherID: string
}

export interface Absence {
  id: string
  teacherId: string
  date: string
  day?: string // Day name (e.g., "الأحد", "الاثنين")
  periods: number[]
  substituteTeacherId?: string
  schoolId: string
}

export interface School {
  id: string
  name: string
  xmlData?: string
}

export interface ScheduleData {
  teachers: Teacher[]
  periods: Period[]
  classes: Class[]
  subjects: Subject[]
  classrooms: Classroom[]
  days: Day[]
  schedules: TimeTableSchedule[]
  schoolId: string
  uploadDate: string
  approved?: boolean
  approvedDate?: string
  approvedBy?: string
}

export interface DashboardStats {
  totalTeachers: number
  totalSubjects: number
  totalPeriods: number
  absencesToday: number
  coverageRate: number
  warnings: string[]
}
