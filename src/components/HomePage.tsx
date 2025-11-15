import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useKV } from "@github/spark/hooks";
import { ScheduleData, Absence } from "@/lib/types";
import {
  SignIn,
  UserPlus,
  Upload,
  CalendarBlank,
  ListBullets,
  ChartBar,
  Users,
  WarningCircle,
  CheckCircle,
  Sparkle,
  Trash,
  UserCircleMinus,
  GraduationCap,
  Info,
} from "@phosphor-icons/react";
import schoolLogo from '@/assets/images/school_header_with_logo_(1).png';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setIsLoading(true);

    // تأخير بسيط لإظهار الحركة
    await new Promise(resolve => setTimeout(resolve, 1500));

    // إزالة المسافات الزائدة من البداية والنهاية (مهم للهواتف المحمولة)
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (login(trimmedUsername, trimmedPassword)) {
      toast.success("تم تسجيل الدخول بنجاح");
      onOpenChange(false);
      setUsername("");
      setPassword("");
    } else {
      toast.error("اسم المستخدم أو كلمة المرور غير صحيحة");
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700" dir="rtl">
        {isLoading ? (
          // شاشة التحميل مع الحركة الدائرية
          <div className="flex flex-col items-center justify-center py-16 relative">
            {/* الحلقة الدائرية المتحركة */}
            <div className="relative w-80 h-80 flex items-center justify-center">
              {/* الدوائر المتحركة */}
              <div className="absolute inset-0 animate-spin-slow">
                {[...Array(40)].map((_, i) => {
                  const rotation = i * 9;
                  const delay = i * 0.05;
                  return (
                    <div
                      key={i}
                      className="absolute left-1/2 top-1/2 origin-center"
                      style={{
                        transform: `rotate(${rotation}deg) translateY(-130px)`,
                        animation: `pulse-${i} 2s ease-in-out infinite`,
                        animationDelay: `${delay}s`,
                      }}
                    >
                      <div
                        className="w-2 h-10 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600"
                        style={{
                          opacity: 0.3 + (i / 40) * 0.7,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* النص في المنتصف */}
              <div className="relative z-10 text-center">
                <p className="text-4xl font-bold text-cyan-400 mb-2 animate-pulse">{username || 'ah 123'}</p>
                <p className="text-base text-cyan-300/80">جاري تسجيل الدخول...</p>
              </div>
            </div>

            <style>{`
              @keyframes spin-slow {
                from {
                  transform: rotate(0deg);
                }
                to {
                  transform: rotate(360deg);
                }
              }

              .animate-spin-slow {
                animation: spin-slow 3s linear infinite;
              }

              ${[...Array(40)].map((_, i) => `
                @keyframes pulse-${i} {
                  0%, 100% {
                    transform: rotate(${i * 9}deg) translateY(-130px) scaleY(1);
                  }
                  50% {
                    transform: rotate(${i * 9}deg) translateY(-130px) scaleY(1.3);
                  }
                }
              `).join('\n')}
            `}</style>
          </div>
        ) : (
          // نموذج تسجيل الدخول العادي
          <>
            <DialogHeader>
              {/* شعار المدرسة */}
              <div className="flex justify-center mb-4">
                <img
                  src={schoolLogo}
                  alt="شعار مدرسة الحباب بن المنذر"
                  className="h-24 w-auto object-contain"
                />
              </div>
              <DialogTitle className="text-center text-white">تسجيل الدخول</DialogTitle>
              <DialogDescription className="text-center text-slate-300">
                أدخل اسم المستخدم وكلمة المرور للوصول إلى النظام
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="username" className="text-slate-200">اسم المستخدم</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-slate-200">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              <Button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
              >
                تسجيل الدخول
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>("director");
  const [schoolId, setSchoolId] = useState("");
  const { addUser } = useAuth();

  const handleAddUser = () => {
    // إزالة المسافات الزائدة من الحقول
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();
    const trimmedSchoolId = schoolId.trim();

    if (!trimmedUsername || !trimmedPassword || !trimmedName) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // التحقق من معرف المدرسة لمدير المدرسة
    if (role === "director" && !trimmedSchoolId) {
      toast.error("يرجى إدخال معرّف المدرسة لمدير المدرسة");
      return;
    }

    const success = addUser({
      username: trimmedUsername,
      password: trimmedPassword,
      name: trimmedName,
      role: role as any,
      schoolId: role === "director" ? trimmedSchoolId : undefined,
    });

    if (success) {
      toast.success("✅ تم إضافة المستخدم بنجاح وحفظه في النظام");
      onOpenChange(false);
      setUsername("");
      setPassword("");
      setName("");
      setRole("director");
      setSchoolId("");
    } else {
      toast.error("❌ اسم المستخدم موجود مسبقاً");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مستخدم جديد</DialogTitle>
          <DialogDescription>
            أضف مستخدم جديد وحدد صلاحياته في النظام
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-username">اسم المستخدم</Label>
            <Input
              id="new-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="أدخل اسم المستخدم"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">كلمة المرور</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة المرور"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-name">الاسم الكامل</Label>
            <Input
              id="new-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل الاسم الكامل"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">الصلاحية</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">👑 مدير النظام</SelectItem>
                <SelectItem value="director">👤 مدير المدرسة</SelectItem>
                <SelectItem value="teacher">👨‍🏫 معلم</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === "director" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="school-id">معرّف المدرسة *</Label>
              <Input
                id="school-id"
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
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
  );
}

interface HomePageProps {
  onNavigate: (
    page:
      | "home"
      | "upload"
      | "allSchedules"
      | "absences"
      | "stats"
      | "view"
      | "analytics"
      | "users"
      | "info"
  ) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllUnknownDialogOpen, setDeleteAllUnknownDialogOpen] =
    useState(false);
  const [absenceToDelete, setAbsenceToDelete] = useState<string | null>(null);
  const { currentUser, logout } = useAuth();

  // ✅ تعريف المتغيرات الوحيدة دون تكرار
  const [allSchedules, setAllSchedules] = useKV<ScheduleData[]>(
    "allSchedules",
    []
  );
  const [absences, setAbsences] = useKV<Absence[]>("absences", []);

  const hasApprovedSchedule =
    allSchedules &&
    Array.isArray(allSchedules) &&
    allSchedules.some((s) => s.approved);
  const hasUnapprovedSchedule =
    allSchedules &&
    Array.isArray(allSchedules) &&
    allSchedules.length > 0 &&
    !hasApprovedSchedule;

  const allTeachers = useMemo(() => {
    if (
      !allSchedules ||
      !Array.isArray(allSchedules) ||
      allSchedules.length === 0
    )
      return [];
    const approvedSchedules = allSchedules.filter((s) => s.approved);
    return approvedSchedules.flatMap((schedule) => schedule.teachers || []);
  }, [allSchedules]);

  function getTeacherName(teacherId: string): string {
    return allTeachers.find((t) => t.id === teacherId)?.name || "غير معروف";
  }

  const recentAbsences = useMemo(() => {
    if (!absences || !Array.isArray(absences)) return [];
    return absences
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [absences]);

  const unknownAbsencesCount = useMemo(() => {
    if (!absences || !Array.isArray(absences)) return 0;
    return absences.filter((absence) => {
      const teacherName = getTeacherName(absence.teacherId);
      return teacherName === "غير معروف";
    }).length;
  }, [absences, allTeachers]);

  const handleDeleteAbsence = (absenceId: string) => {
    setAbsenceToDelete(absenceId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAbsence = () => {
    if (absenceToDelete) {
      setAbsences((current) =>
        (current || []).filter((a) => a.id !== absenceToDelete)
      );
      toast.success("🗑️ تم حذف الغياب بنجاح");
      setDeleteDialogOpen(false);
      setAbsenceToDelete(null);
    }
  };

  const handleDeleteAllUnknown = () => {
    setDeleteAllUnknownDialogOpen(true);
  };

  const confirmDeleteAllUnknown = () => {
    const count = unknownAbsencesCount;
    setAbsences((current) => {
      if (!current || !Array.isArray(current)) return [];
      return current.filter((absence) => {
        const teacherName = getTeacherName(absence.teacherId);
        return teacherName !== "غير معروف";
      });
    });
    toast.success(`✅ تم حذف ${count} سجل غير معروف بنجاح`);
    setDeleteAllUnknownDialogOpen(false);
  };

  const handleApproveUpload = () => {
    if (!allSchedules || allSchedules.length === 0) {
      toast.error("⚠️ لا يوجد جدول مرفوع لاعتماده.");
      return;
    }

    const updatedSchedules = allSchedules.map((schedule) => ({
      ...schedule,
      approved: true,
    }));

    setAllSchedules(updatedSchedules);
    toast.success("📂 تم اعتماد تحميل الجدول بنجاح!");
  };

  const menuItems = [
    {
      title: "معلومات النظام",
      description: "معلومات الإعداد وتعليمات رفع الجدول",
      icon: Info,
      action: () => onNavigate("info"),
      show: true,
    },
    {
      title: "تسجيل الدخول",
      description: "دخول المستخدم إلى النظام",
      icon: SignIn,
      action: () => setLoginOpen(true),
      show: !currentUser,
    },
    {
      title: "إدارة المستخدمين",
      description: "عرض وتعديل وحذف جميع المستخدمين",
      icon: Users,
      action: () => onNavigate("users"),
      show: currentUser?.role === "admin",
    },
    {
      title: "إضافة مستخدم جديد",
      description: "إضافة مدراء مدارس أو مستخدمين جدد",
      icon: UserPlus,
      action: () => setAddUserOpen(true),
      show: currentUser?.role === "admin",
    },
    {
      title: "مدير المدرسة",
      description: "إدارة الجداول الخاصة بمدرستك",
      icon: GraduationCap,
      action: () => onNavigate("allSchedules"),
      show: currentUser?.role === "director",
    },
    {
      title: "تحميل الجدول",
      description: "رفع ملف XML الخاص بالمدرسة",
      icon: Upload,
      action: () => onNavigate("upload"),
      show: !!currentUser,
    },
    {
      title: "عرض الجدول الكامل",
      description: "عرض جميع البيانات من الملف المحمل",
      icon: ListBullets,
      action: () => onNavigate("view"),
      show: !!currentUser,
    },
    {
      title: "جداول المعلمين",
      description: "عرض جدول كل معلم",
      icon: CalendarBlank,
      action: () => onNavigate("allSchedules"),
      show: !!currentUser,
    },
    {
      title: "غياب المعلمين",
      description: "تسجيل غياب المعلمين اليومي",
      icon: CalendarBlank,
      action: () => onNavigate("absences"),
      show: !!currentUser,
    },
    {
      title: "الرسم البياني الذكي",
      description: "تحليل الأحمال واختيار البديل الأمثل",
      icon: Sparkle,
      action: () => onNavigate("analytics"),
      show: !!currentUser,
    },
    {
      title: "تقرير إحصائي",
      description: "عرض إحصاءات وتقارير",
      icon: ChartBar,
      action: () => onNavigate("stats"),
      show: !!currentUser,
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* School Logo Header */}
        <div className="bg-white rounded-lg shadow-md border mb-6 p-6">
          <div className="flex items-center gap-6">
            <img
              src={schoolLogo}
              alt="شعار مدرسة الحباب بن المنذر"
              className="h-28 w-auto object-contain flex-shrink-0"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-1">
                نظام إدارة الحصص الاحتياطية
              </h1>
              <h2 className="text-lg text-gray-700 mb-1">
                المديرية العامة للتربية والتعليم لمحافظة مسقط
              </h2>
              <h3 className="text-base font-semibold text-emerald-700 mb-2">
                مدرسة الحباب بن المنذر (9-12)
              </h3>
              <p className="text-muted-foreground text-sm">
                إدارة ذكية لجداول المعلمين والحصص الاحتياطية
              </p>
            </div>
          </div>
        </div>

        {/* User Info Section */}
        {currentUser && (
          <div className="flex justify-end items-center gap-4 mb-6">
            <div className="text-right bg-white px-4 py-2 rounded-lg border shadow-sm">
              <p className="font-medium text-gray-800">{currentUser.name}</p>
              <p className="text-sm text-muted-foreground">
                {currentUser.role === "admin" && "مدير النظام"}
                {currentUser.role === "director" && "مدير المدرسة"}
                {currentUser.role === "teacher" && "معلم"}
              </p>
            </div>
            <Button variant="outline" onClick={logout}>
              تسجيل الخروج
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems
            .filter((item) => item.show)
            .map((item) => (
              <Card
                key={item.title}
                className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                onClick={item.action}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <item.icon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
        </div>

        {!currentUser && (
          <Card className="mt-8 bg-accent/10 border-accent">
            <CardContent className="pt-6">
              <p className="text-center text-lg bg-slate-400">
                مرحباً بك في نظام إدارة الحصص الاحتياطية.  يرجى تصديره من برنامج
                aSc Timetables بصيغة Oman XML.
              </p>
            </CardContent>
          </Card>
        )}

        {currentUser && !hasApprovedSchedule && (
          <Alert className="mt-8 border-blue-500 bg-blue-50/50">
            <WarningCircle className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <p className="font-medium mb-1">💡 ابدأ باستخدام النظام</p>
              <p className="text-sm">
                لم تقم برفع أي جدول معتمد بعد. اضغط على "تحميل الجدول" لرفع ملف
                XML. سيتم اعتماد الجدول تلقائيًا عند الرفع.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {currentUser && hasApprovedSchedule && (
          <Alert className="mt-8 border-accent bg-accent/10">
            <CheckCircle className="h-5 w-5 text-accent" />
            <AlertDescription>
              <p className="font-medium mb-1">✅ الجدول معتمد</p>
              <p className="text-sm">
                لديك جدول معتمد ونشط. يمكنك الآن استخدام جميع وظائف النظام.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {currentUser && recentAbsences.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <UserCircleMinus className="w-5 h-5" />
                    الغيابات الأخيرة
                    <Badge variant="secondary" className="mr-2">
                      {recentAbsences.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    آخر {recentAbsences.length} غيابات مسجلة في النظام
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* 🔘 أزرار التحكم في الغيابات */}
                  <div className="flex items-center gap-3">
                    {currentUser?.role === "admin" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleApproveUpload}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Upload className="w-4 h-4" />
                        اعتماد تحميل الجدول
                      </Button>
                    )}
                    {unknownAbsencesCount > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAllUnknown}
                        className="gap-2"
                      >
                        <Trash className="w-4 h-4" />
                        🧹 حذف جميع "غير معروف" ({unknownAbsencesCount})
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {recentAbsences.map((absence) => {
                  const teacherName = getTeacherName(absence.teacherId);
                  const isUnknown = teacherName === "غير معروف";

                  return (
                    <div
                      key={absence.id}
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors ${
                        isUnknown
                          ? "bg-destructive/5 border-destructive/30"
                          : ""
                      }`}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <p
                            className={`font-medium text-lg ${
                              isUnknown ? "text-destructive" : ""
                            }`}
                          >
                            {teacherName}
                          </p>
                          <Badge variant="destructive" className="text-xs">
                            غائب
                          </Badge>
                          {isUnknown && (
                            <Badge
                              variant="outline"
                              className="text-xs border-destructive text-destructive"
                            >
                              ⚠️ غير معروف
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <CalendarBlank className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {absence.date}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              الحصص:
                            </span>
                            <div className="flex gap-1">
                              {absence.periods.map((p) => (
                                <Badge
                                  key={p}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {absence.substituteTeacherId ? (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              البديل:
                            </span>
                            <span className="font-medium text-accent">
                              {getTeacherName(absence.substituteTeacherId)}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs w-fit">
                            بدون بديل
                          </Badge>
                        )}
                      </div>

                      <Button
                        variant={isUnknown ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => handleDeleteAbsence(absence.id)}
                        className="gap-2 shrink-0"
                      >
                        <Trash className="w-4 h-4" />
                        {isUnknown ? "🗑️ حذف" : "حذف الغياب"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* نوافذ الحوارات (Dialogs) */}
        <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
        <AddUserDialog open={addUserOpen} onOpenChange={setAddUserOpen} />
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                ⚠️ هل تريد حذف هذا الغياب نهائيًا من السجل؟
              </AlertDialogTitle>
              <AlertDialogDescription>
                هذا الإجراء لا يمكن التراجع عنه. سيتم حذف سجل الغياب بشكل دائم
                من قاعدة البيانات.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteAbsence}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                تأكيد الحذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={deleteAllUnknownDialogOpen}
          onOpenChange={setDeleteAllUnknownDialogOpen}
        >
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>
                ⚠️ هل تريد حذف جميع السجلات "غير معروف" نهائيًا؟
              </AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف {unknownAbsencesCount} سجل غياب بشكل دائم من قاعدة
                البيانات. هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteAllUnknown}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                🧹 حذف الكل
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
