import { createContext, useContext, ReactNode, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { User, UserRole } from './types'

interface AuthContextType {
  currentUser: User | null
  users: User[]
  login: (username: string, password: string) => boolean
  logout: () => void
  addUser: (user: Omit<User, 'id'>) => boolean
  updateUser: (userId: string, updates: Partial<User>) => boolean
  deleteUser: (userId: string) => boolean
  isAdmin: boolean
  isDirector: boolean
  isTeacher: boolean
  canAccessAllSchools: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEFAULT_USERS: User[] = [
  {
    id: 'admin-1',
    username: 'admin',
    password: 'admin123',
    role: 'admin' as UserRole,
    name: 'مدير النظام',
    schoolId: undefined, // System admin has access to all schools
  },
  {
    id: 'director-1',
    username: 'alhbab',
    password: 'alhbab123',
    role: 'director' as UserRole,
    name: 'مدير مدرسة الحباب بن المنذر',
    schoolId: 'school-alhbab',
  },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useKV<User | null>('current-user', null)
  const [users, setUsers] = useKV<User[]>('users', [])

  useEffect(() => {
    if (!users || users.length === 0) {
      setUsers(DEFAULT_USERS)
    }
  }, [])

  const login = (username: string, password: string): boolean => {
    const userList = users || []
    const user = userList.find(
      (u) => u.username === username && u.password === password
    )
    if (user) {
      setCurrentUser(user)
      return true
    }
    return false
  }

  const logout = () => {
    setCurrentUser(null)
  }

  const addUser = (newUser: Omit<User, 'id'>): boolean => {
    const userList = users || []

    // Check if username already exists
    if (userList.some(u => u.username === newUser.username)) {
      return false
    }

    const user: User = {
      ...newUser,
      id: `user-${Date.now()}`,
    }

    setUsers([...userList, user])
    return true
  }

  const updateUser = (userId: string, updates: Partial<User>): boolean => {
    const userList = users || []
    const userIndex = userList.findIndex(u => u.id === userId)

    if (userIndex === -1) return false

    const updatedUsers = [...userList]
    updatedUsers[userIndex] = { ...updatedUsers[userIndex], ...updates }
    setUsers(updatedUsers)
    return true
  }

  const deleteUser = (userId: string): boolean => {
    const userList = users || []
    const filteredUsers = userList.filter(u => u.id !== userId)

    if (filteredUsers.length === userList.length) return false

    setUsers(filteredUsers)
    return true
  }

  const value: AuthContextType = {
    currentUser: currentUser || null,
    users: users || [],
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    isAdmin: currentUser?.role === 'admin',
    isDirector: currentUser?.role === 'director',
    isTeacher: currentUser?.role === 'teacher',
    canAccessAllSchools: currentUser?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
