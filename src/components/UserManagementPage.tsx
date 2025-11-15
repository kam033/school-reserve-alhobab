import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { User, UserRole } from '@/lib/types'
import {
  UserPlus,
  Trash,
  PencilSimple,
  ShieldCheck,
  UserCircle,
  Building,
  Warning
} from '@phosphor-icons/react'

export function UserManagementPage() {
  const { users, addUser, updateUser, deleteUser, currentUser, isAdmin } = useAuth()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Form state for add/edit
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'director' as UserRole,
    schoolId: '',
  })

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
        <Alert variant="destructive" className="max-w-md">
          <Warning className="h-5 w-5" />
          <AlertDescription>
            <p className="font-bold mb-2">⛔ غير مصرح</p>
            <p>هذه الصفحة متاحة فقط لمدير النظام.</p>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleAddUser = () => {
    if (!formData.username || !formData.password || !formData.name) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    const success = addUser({
      username: formData.username,
      password: formData.password,
      name: formData.name,
      role: formData.role,
      schoolId: formData.role === 'director' ? formData.schoolId : undefined,
    })

    if (success) {
      toast.success('✅ تم إضافة المستخدم بنجاح')
      setAddDialogOpen(false)
      resetForm()
    } else {
      toast.error('❌ اسم المستخدم موجود مسبقاً')
    }
  }

  const handleEditUser = () => {
    if (!selectedUser) return

    if (!formData.name) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    const success = updateUser(selectedUser.id, {
      name: formData.name,
      role: formData.role,
      schoolId: formData.role === 'director' ? formData.schoolId : undefined,
      ...(formData.password && { password: formData.password }),
    })

    if (success) {
      toast.success('✅ تم تحديث المستخدم بنجاح')
      setEditDialogOpen(false)
      setSelectedUser(null)
      resetForm()
    } else {
      toast.error('❌ فشل في تحديث المستخدم')
    }
  }

  const handleDeleteUser = () => {
    if (!selectedUser) return

    // Prevent deleting yourself
    if (selectedUser.id === currentUser?.id) {
      toast.error('❌ لا يمكنك حذف حسابك الخاص')
      return
    }

    const success = deleteUser(selectedUser.id)

    if (success) {
      toast.success('🗑️ تم حذف المستخدم بنجاح')
      setDeleteDialogOpen(false)
      setSelectedUser(null)
    } else {
      toast.error('❌ فشل في حذف المستخدم')
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
      schoolId: user.schoolId || '',
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'director',
      schoolId: '',
    })
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500">👑 مدير النظام</Badge>
      case 'director':
        return <Badge className="bg-blue-500">👤 مدير مدرسة</Badge>
      case 'teacher':
        return <Badge variant="secondary">👨‍🏫 معلم</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  // Filter out the current system admin from the list for safety
  const managedUsers = users.filter(u => u.id !== currentUser?.id)

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-emerald-600" weight="fill" />
                إدارة المستخدمين
              </h1>
              <p className="text-muted-foreground">
                إضافة وتعديل وحذف مديري المدارس والمستخدمين
              </p>
            </div>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="gap-2"
              size="lg"
            >
              <UserPlus className="w-5 h-5" />
              إضافة مستخدم جديد
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                    <p className="text-3xl font-bold text-emerald-600">{users.length}</p>
                  </div>
                  <UserCircle className="w-12 h-12 text-emerald-600/20" weight="fill" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">مديري المدارس</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {users.filter(u => u.role === 'director').length}
                    </p>
                  </div>
                  <Building className="w-12 h-12 text-blue-600/20" weight="fill" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">مديري النظام</p>
                    <p className="text-3xl font-bold text-red-600">
                      {users.filter(u => u.role === 'admin').length}
                    </p>
                  </div>
                  <ShieldCheck className="w-12 h-12 text-red-600/20" weight="fill" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة المستخدمين</CardTitle>
              <CardDescription>
                جميع المستخدمين المسجلين في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              {managedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <UserCircle className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">لا يوجد مستخدمون بعد</p>
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    variant="outline"
                    className="mt-4"
                  >
                    إضافة أول مستخدم
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="text-right">اسم المستخدم</TableHead>
                        <TableHead className="text-right">الدور</TableHead>
                        <TableHead className="text-right">المدرسة</TableHead>
                        <TableHead className="text-center">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {managedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.username}
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            {user.schoolId ? (
                              <span className="text-sm">{user.schoolId}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">جميع المدارس</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                onClick={() => openEditDialog(user)}
                                variant="outline"
                                size="sm"
                                className="gap-1"
                              >
                                <PencilSimple className="w-4 h-4" />
                                تعديل
                              </Button>
                              <Button
                                onClick={() => openDeleteDialog(user)}
                                variant="destructive"
                                size="sm"
                                className="gap-1"
                              >
                                <Trash className="w-4 h-4" />
                                حذف
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current User Info */}
          <Card className="mt-8 border-emerald-500/50 bg-emerald-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600" weight="fill" />
                <div>
                  <p className="font-medium">أنت مسجل حالياً كـ: {currentUser?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    الدور: {currentUser?.role === 'admin' ? 'مدير النظام' : currentUser?.role}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            <DialogDescription>
              أضف مدير مدرسة أو مستخدم جديد للنظام
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-username">اسم المستخدم *</Label>
              <Input
                id="add-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="مثال: director1"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-password">كلمة المرور *</Label>
              <Input
                id="add-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="كلمة مرور قوية"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-name">الاسم الكامل *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: محمد أحمد"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-role">الدور *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger id="add-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">👑 مدير النظام</SelectItem>
                  <SelectItem value="director">👤 مدير مدرسة</SelectItem>
                  <SelectItem value="teacher">👨‍🏫 معلم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === 'director' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="add-school">معرّف المدرسة *</Label>
                <Input
                  id="add-school"
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                  placeholder="مثال: school-alhbab"
                />
                <p className="text-xs text-muted-foreground">
                  يجب أن يتطابق مع معرّف المدرسة في ملف XML
                </p>
              </div>
            )}
            <Button onClick={handleAddUser} className="w-full">
              إضافة المستخدم
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل مستخدم</DialogTitle>
            <DialogDescription>
              تحديث معلومات المستخدم: {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-username">اسم المستخدم (للعرض فقط)</Label>
              <Input
                id="edit-username"
                value={formData.username}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-password">كلمة المرور الجديدة (اختياري)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="اتركه فارغاً إذا لم ترد التغيير"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-name">الاسم الكامل *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-role">الدور *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">👑 مدير النظام</SelectItem>
                  <SelectItem value="director">👤 مدير مدرسة</SelectItem>
                  <SelectItem value="teacher">👨‍🏫 معلم</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === 'director' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-school">معرّف المدرسة *</Label>
                <Input
                  id="edit-school"
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                />
              </div>
            )}
            <Button onClick={handleEditUser} className="w-full">
              حفظ التعديلات
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              ⚠️ هل أنت متأكد من حذف هذا المستخدم؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المستخدم <strong>{selectedUser?.name}</strong> نهائياً من النظام.
              هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
