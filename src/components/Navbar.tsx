import React from 'react';
import { 
  Calendar, 
  Users, 
  Sparkles, 
  BarChart3, 
  School, 
  ShieldCheck, 
  User, 
  Lock, 
  Shield, 
  LogOut, 
  KeyRound, 
  Crown, 
  FileCheck2,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CalendarDays,
  Building2
} from 'lucide-react';
import { DayOfWeek, UserRole, SchoolSettings } from '../types/piket';

export type AppTab = 'piket' | 'schedule' | 'tu-recap' | 'ai-report' | 'teachers' | 'piket-officers' | 'stats';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedDay: DayOfWeek;
  userRole: UserRole;
  userName?: string;
  activeOfficerName?: string;
  activeTeacherName?: string;
  schoolSettings?: SchoolSettings;
  onOpenRoleSwitcher: () => void;
  onOpenAdminCredentials?: () => void;
  onOpenSchoolSettings?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedDate,
  setSelectedDate,
  selectedDay,
  userRole,
  userName,
  activeOfficerName,
  activeTeacherName,
  schoolSettings,
  onOpenRoleSwitcher,
  onOpenAdminCredentials,
  onOpenSchoolSettings,
  onLogout,
}) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleStepDay = (step: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + step);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const date = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${date}`);
  };

  const handleSetToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${date}`);
  };

  // Define tab navigation based on UserRole
  // 1. GURU_BIASA: ONLY Schedule and Teacher Codes! Strictly no attendance/recap.
  // 2. GURU_PIKET: Presensi, Schedule, AI Report, Teachers, Piket Officers. Strictly NO TU Recap.
  // 3. ADMIN: Full access including TU Recap, Stats, and School Identity.
  const tabs = React.useMemo(() => {
    if (userRole === 'GURU_BIASA') {
      return [
        {
          id: 'schedule' as AppTab,
          label: 'Jadwal KBM Kelas',
          shortLabel: 'Jadwal Kelas',
          icon: CalendarDays,
          badge: 'Aktif',
        },
        {
          id: 'teachers' as AppTab,
          label: 'Daftar Kode Guru',
          shortLabel: 'Kode Guru',
          icon: BookOpen,
          badge: '21 Guru',
        },
      ];
    }

    if (userRole === 'GURU_PIKET') {
      return [
        {
          id: 'piket' as AppTab,
          label: 'Presensi Guru (Ceklis & Arsir)',
          shortLabel: 'Presensi Guru',
          icon: FileCheck2,
          badge: 'Piket',
        },
        {
          id: 'schedule' as AppTab,
          label: 'Atur Jadwal KBM & JP',
          shortLabel: 'Jadwal KBM',
          icon: CalendarDays,
        },
        {
          id: 'ai-report' as AppTab,
          label: 'Laporan AI & WhatsApp',
          shortLabel: 'Laporan Piket',
          icon: Sparkles,
          isAi: true,
        },
        {
          id: 'teachers' as AppTab,
          label: 'Database Guru',
          shortLabel: 'Master Guru',
          icon: BookOpen,
        },
        {
          id: 'piket-officers' as AppTab,
          label: 'Petugas Piket Harian',
          shortLabel: 'Guru Piket',
          icon: ShieldCheck,
        },
      ];
    }

    // Role: ADMIN
    return [
      {
        id: 'piket' as AppTab,
        label: 'Presensi Guru',
        shortLabel: 'Presensi',
        icon: FileCheck2,
      },
      {
        id: 'schedule' as AppTab,
        label: 'Jadwal KBM & Jam JP',
        shortLabel: 'Jadwal KBM',
        icon: CalendarDays,
      },
      {
        id: 'tu-recap' as AppTab,
        label: 'Rekap TU & Inval',
        shortLabel: 'Rekap TU',
        icon: FileSpreadsheet,
        badge: 'Khusus TU',
      },
      {
        id: 'ai-report' as AppTab,
        label: 'Laporan Piket AI & WA',
        shortLabel: 'Laporan AI',
        icon: Sparkles,
        isAi: true,
      },
      {
        id: 'teachers' as AppTab,
        label: 'Database Guru',
        shortLabel: 'Guru',
        icon: BookOpen,
      },
      {
        id: 'piket-officers' as AppTab,
        label: 'Jadwal Guru Piket',
        shortLabel: 'Piket',
        icon: ShieldCheck,
      },
      {
        id: 'stats' as AppTab,
        label: 'Statistik & Analisis',
        shortLabel: 'Statistik',
        icon: BarChart3,
      },
    ];
  }, [userRole]);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      {/* Top Bar: Brand, Identity, Role, & Quick Controls */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 border-b border-slate-800/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Logo & School Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-700 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/20 text-white font-bold shrink-0 border border-emerald-400/30 overflow-hidden">
              {schoolSettings?.logoUrl ? (
                <img 
                  src={schoolSettings.logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <School className="w-6 h-6 text-emerald-100" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-black text-base sm:text-lg tracking-tight text-white leading-tight">
                  {schoolSettings?.schoolName || 'MTs Al-Mukhsin'}
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Sem. {schoolSettings?.semester || 'Ganjil'} {schoolSettings?.academicYear || '2025/2026'}
                </span>
                {userRole === 'ADMIN' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Administrator
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-md">
                {schoolSettings?.subTitle || 'Madrasah Tsanawiyah Al-Mukhsin Cibinong'}
              </p>
            </div>
          </div>

          {/* Right Area: Day Picker, Admin Tools, Role Switcher, & Logout */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Quick Date Stepper */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-xl p-1 shadow-inner text-xs">
              <button
                type="button"
                onClick={() => handleStepDay(-1)}
                className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 px-2">
                <span className="font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-700/50 text-[11px]">
                  {selectedDay}
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-hidden cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => handleStepDay(1)}
                className="p-1 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSetToday}
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="Lompat ke Hari Ini"
            >
              Hari Ini
            </button>

            {/* Admin Exclusive: School Identity & Credentials */}
            {userRole === 'ADMIN' && (
              <>
                {onOpenSchoolSettings && (
                  <button
                    type="button"
                    onClick={onOpenSchoolSettings}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Ubah Logo MTs Al-Mukhsin, Nama, Semester & Info Pejabat"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Identitas Madrasah</span>
                  </button>
                )}

                {onOpenAdminCredentials && (
                  <button
                    type="button"
                    onClick={onOpenAdminCredentials}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Ubah ID & Password Akun"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Kelola Password</span>
                  </button>
                )}
              </>
            )}

            {/* Active Role Indicator / Switcher */}
            {userRole === 'ADMIN' ? (
              <button
                type="button"
                onClick={onOpenRoleSwitcher}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/20 transition cursor-pointer"
                title="Ganti Peran / Akun"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <div className="text-left leading-tight">
                  <div className="text-[9px] text-amber-400 uppercase font-black">Admin</div>
                  <div className="text-xs truncate max-w-[120px] text-white">
                    {userName || 'Admin'}
                  </div>
                </div>
              </button>
            ) : userRole === 'GURU_PIKET' ? (
              <button
                type="button"
                onClick={onOpenRoleSwitcher}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer border bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/20"
                title="Ganti Akun / Peran"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div className="text-left leading-tight">
                  <div className="text-[9px] text-emerald-400 uppercase font-black">Petugas Piket</div>
                  <div className="text-xs truncate max-w-[120px] text-white">
                    {activeOfficerName || userName || 'Guru Piket'}
                  </div>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenRoleSwitcher}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer border bg-blue-950/80 hover:bg-blue-900 text-blue-300 border-blue-500/40 ring-1 ring-blue-500/20"
                title="Ganti Akun / Peran"
              >
                <User className="w-4 h-4 text-blue-400" />
                <div className="text-left leading-tight">
                  <div className="text-[9px] text-blue-400 uppercase font-black">Guru Mapel</div>
                  <div className="text-xs truncate max-w-[120px] text-white">
                    {activeTeacherName || userName || 'Guru Mapel'}
                  </div>
                </div>
              </button>
            )}

            {/* Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-300 border border-slate-700 hover:border-rose-700/50 transition cursor-pointer active:scale-95"
              title="Keluar dari akun saat ini"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Responsive Navigation Segmented Bar (NO horizontal scroll friction!) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
        <nav className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/30 scale-[1.02]'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.isAi ? 'text-teal-400' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
