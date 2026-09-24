import { Teacher, ClassRoom, Period, ScheduleSlot, AttendanceRecord, DailyPiketMeta, PiketReportRecord, DayOfWeek, PiketOfficer, UserRole, AppCredentials, SchoolSettings } from '../types/piket';
import { INITIAL_TEACHERS, INITIAL_CLASSES, INITIAL_PERIODS, generateInitialSchedule, DAYS_LIST, INITIAL_PIKET_OFFICERS } from './defaultData';

const STORAGE_KEYS = {
  TEACHERS: 'mts_piket_teachers_v2026_final',
  PIKET_OFFICERS: 'mts_piket_officers_v2026_final',
  USER_ROLE: 'mts_piket_user_role_v3',
  CREDENTIALS: 'mts_piket_credentials_v1',
  CLASSES: 'mts_piket_classes_v2',
  PERIODS: 'mts_piket_periods_v2',
  SCHEDULE: 'mts_piket_schedule_v2026_final',
  ATTENDANCE: 'mts_piket_attendance_v2',
  DAILY_META: 'mts_piket_daily_meta_v2',
  REPORTS: 'mts_piket_reports_v2',
  SCHOOL_SETTINGS: 'mts_piket_school_settings_v1',
};

export const DEFAULT_CREDENTIALS: AppCredentials = {
  piketId: 'gurupiket123',
  piketPw: '123321123',
  adminId: 'admin',
  adminPw: 'admin12332123',
};

export function loadCredentials(): AppCredentials {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.piketId && parsed.piketPw && parsed.adminId && parsed.adminPw) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading credentials', e);
  }
  saveCredentials(DEFAULT_CREDENTIALS);
  return DEFAULT_CREDENTIALS;
}

export function saveCredentials(credentials: AppCredentials): void {
  localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

export function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const d = new Date(dateStr);
  const dayIndex = d.getDay(); // 0 is Sunday
  switch (dayIndex) {
    case 1: return 'Senin';
    case 2: return 'Selasa';
    case 3: return 'Rabu';
    case 4: return 'Kamis';
    case 5: return "Jum'at";
    case 6: return 'Sabtu';
    default: return 'Senin'; // Fallback for Sunday to Senin for madrasah schedule
  }
}

// Master Guru
export function loadTeachers(): Teacher[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (data) {
      const parsed = JSON.parse(data);
      // Validasi: pastikan data memuat kode pecahan baru dan minimal 30 guru
      const hasNewCodes = Array.isArray(parsed) && parsed.some(t => t.code === '7a' || t.code === '21a');
      if (hasNewCodes && parsed.length >= 30) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading teachers from localStorage', e);
  }
  saveTeachers(INITIAL_TEACHERS);
  saveSchedule(generateInitialSchedule());
  return INITIAL_TEACHERS;
}

export function saveTeachers(teachers: Teacher[]): void {
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
}

// Master Database Guru Piket (Terpisah dari Database Guru Mapel)
export const STORAGE_KEY_HONOR_RATE = 'mts_piket_honor_rate_v1';

export function loadHonorRatePerJP(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY_HONOR_RATE);
    if (data) {
      const val = parseInt(data, 10);
      if (!isNaN(val) && val > 0) return val;
    }
  } catch (e) {
    console.error('Error loading honor rate', e);
  }
  return 25000; // Default Rp 25.000 / JP
}

export function saveHonorRatePerJP(rate: number): void {
  localStorage.setItem(STORAGE_KEY_HONOR_RATE, rate.toString());
}
export function loadPiketOfficers(): PiketOfficer[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PIKET_OFFICERS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading piket officers', e);
  }
  savePiketOfficers(INITIAL_PIKET_OFFICERS);
  return INITIAL_PIKET_OFFICERS;
}

export function savePiketOfficers(officers: PiketOfficer[]): void {
  localStorage.setItem(STORAGE_KEYS.PIKET_OFFICERS, JSON.stringify(officers));
}

export interface UserRoleSession {
  isLoggedIn: boolean;
  role: UserRole; // 'ADMIN' | 'GURU_PIKET' | 'GURU_BIASA'
  activeOfficerId?: string;
  activeTeacherId?: string; // for Guru Biasa to highlight own schedule
  userName?: string;
}

export function loadUserRoleSession(): UserRoleSession {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading user role session', e);
  }
  // Default: not logged in yet so user lands on login view
  return { isLoggedIn: false, role: 'GURU_BIASA' };
}

export function saveUserRoleSession(session: UserRoleSession): void {
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, JSON.stringify(session));
}

export function clearUserSession(): void {
  saveUserRoleSession({ isLoggedIn: false, role: 'GURU_BIASA' });
}

export function loadUserRole(): UserRole {
  return loadUserRoleSession().role;
}

export function saveUserRole(role: UserRole): void {
  const session = loadUserRoleSession();
  session.role = role;
  saveUserRoleSession(session);
}

export function loadActiveOfficerId(): string {
  return loadUserRoleSession().activeOfficerId || '';
}

export function saveActiveOfficerId(id: string): void {
  const session = loadUserRoleSession();
  session.activeOfficerId = id;
  saveUserRoleSession(session);
}

export function loadActiveTeacherId(): string {
  return loadUserRoleSession().activeTeacherId || '';
}

export function saveActiveTeacherId(id: string): void {
  const session = loadUserRoleSession();
  session.activeTeacherId = id;
  saveUserRoleSession(session);
}

// Master Kelas
export function loadClasses(): ClassRoom[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading classes', e);
  }
  saveClasses(INITIAL_CLASSES);
  return INITIAL_CLASSES;
}

export function saveClasses(classes: ClassRoom[]): void {
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
}

// Periods
export function loadPeriods(): Period[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PERIODS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading periods', e);
  }
  savePeriods(INITIAL_PERIODS);
  return INITIAL_PERIODS;
}

export function savePeriods(periods: Period[]): void {
  localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(periods));
}

// Schedule Master
export function loadSchedule(): ScheduleSlot[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading schedule', e);
  }
  const initial = generateInitialSchedule();
  saveSchedule(initial);
  return initial;
}

export function saveSchedule(schedule: ScheduleSlot[]): void {
  localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
}

// Daily Attendance Records
// Map key: `${date}_${classId}_${periodId}`
export function loadAttendanceRecords(): Record<string, AttendanceRecord> {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading attendance', e);
  }

  // Pre-seed today with realistic demo attendance if completely fresh
  const today = getTodayDateString();
  const dayName = getDayOfWeekFromDate(today);
  const demoSeed: Record<string, AttendanceRecord> = {};
  
  // Seed sample records for today's display
  const initialSchedule = loadSchedule();
  const todaySlots = initialSchedule.filter(s => s.day === dayName && s.teacherId);
  const teachers = loadTeachers();

  // Make first 12 slots HADIR, 1 IZIN with Inval, 1 SAKIT with task
  todaySlots.forEach((slot, index) => {
    const teacher = teachers.find(t => t.id === slot.teacherId);
    if (!teacher) return;
    const key = `${today}_${slot.classId}_${slot.periodId}`;

    if (index === 2) {
      // Sample Izin with Inval
      demoSeed[key] = {
        date: today,
        day: dayName,
        classId: slot.classId,
        periodId: slot.periodId,
        teacherId: teacher.id,
        teacherName: teacher.name,
        subject: slot.subject || teacher.subject,
        status: 'IZIN',
        reason: 'Menghadiri rapat dinas Kemenag Kab. Magelang',
        invalTeacherId: 't-3',
        invalTeacherName: 'Ust. Muhammad Ridwan, Lc., M.Hum',
        taskDescription: 'Mengerjakan LKS Bab 3 hal 34-37 & diskusi kelompok',
        isTaskDelivered: true,
        notes: 'Surat dinas terlampir di meja piket',
        updatedAt: new Date().toISOString(),
      };
    } else if (index === 5) {
      // Sample Sakit
      demoSeed[key] = {
        date: today,
        day: dayName,
        classId: slot.classId,
        periodId: slot.periodId,
        teacherId: teacher.id,
        teacherName: teacher.name,
        subject: slot.subject || teacher.subject,
        status: 'SAKIT',
        reason: 'Sakit demam tinggi (Surat dokter menyusul)',
        invalTeacherId: 't-15',
        invalTeacherName: 'K.H. Zainal Arifin (Guru Senior)',
        taskDescription: 'Membaca modul mandiri di Perpustakaan Madrasah',
        isTaskDelivered: true,
        notes: 'Didampingi guru piket di perpustakaan',
        updatedAt: new Date().toISOString(),
      };
    } else if (index < 10) {
      // Default Hadir
      demoSeed[key] = {
        date: today,
        day: dayName,
        classId: slot.classId,
        periodId: slot.periodId,
        teacherId: teacher.id,
        teacherName: teacher.name,
        subject: slot.subject || teacher.subject,
        status: 'HADIR',
        updatedAt: new Date().toISOString(),
      };
    }
  });

  saveAttendanceRecords(demoSeed);
  return demoSeed;
}

export function saveAttendanceRecords(records: Record<string, AttendanceRecord>): void {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
}

// Daily Piket Metadata
export function loadDailyMeta(date: string): DailyPiketMeta {
  try {
    const allMeta = localStorage.getItem(STORAGE_KEYS.DAILY_META);
    if (allMeta) {
      const parsed = JSON.parse(allMeta);
      if (parsed[date]) return parsed[date];
    }
  } catch (e) {
    console.error('Error loading daily meta', e);
  }

  const day = getDayOfWeekFromDate(date);
  const defaultMeta: DailyPiketMeta = {
    date,
    day,
    piketOfficers: ['Ust. Abdul Malik, S.Pd.I', 'Rina Kartika, S.Kom'],
    generalNotes: 'Kondisi madrasah tertib, sholat Dhuha berjamaah terlaksana dengan lancar di Masjid MTs Al Mukhsin, seluruh gerbang ditutup pukul 07.15 WIB.',
    weather: 'Cerah',
    flagCeremonyStatus: day === 'Senin' ? 'Terlaksana Khidmat' : undefined,
  };
  return defaultMeta;
}

export function saveDailyMeta(arg1: string | DailyPiketMeta, arg2?: DailyPiketMeta): void {
  let date: string;
  let meta: DailyPiketMeta;
  if (typeof arg1 === 'string') {
    date = arg1;
    meta = arg2!;
  } else {
    meta = arg1;
    date = meta.date;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_META);
    const all = raw ? JSON.parse(raw) : {};
    all[date] = meta;
    localStorage.setItem(STORAGE_KEYS.DAILY_META, JSON.stringify(all));
  } catch (e) {
    console.error('Error saving daily meta', e);
  }
}

// Reports History
export function loadReportHistory(): PiketReportRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading reports', e);
  }
  return [];
}

export function saveReportHistory(reportOrReports: PiketReportRecord | PiketReportRecord[]): void {
  if (Array.isArray(reportOrReports)) {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reportOrReports.slice(0, 20)));
  } else {
    const existing = loadReportHistory();
    const updated = [reportOrReports, ...existing.slice(0, 19)]; // keep latest 20
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
  }
}

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'MTs Al-Mukhsin',
  subTitle: 'Madrasah Tsanawiyah Al-Mukhsin Cibinong',
  logoUrl: '', // Default icon if empty
  semester: 'Ganjil',
  academicYear: '2025/2026',
  headmasterName: 'Drs. H. Ahmad Fauzi, M.Pd.I',
  headmasterNip: '197104121998031002',
  tuHeadName: 'Syaipul Yusuf, S.Kom',
  address: 'Jl. Kauman No. 12, Cibinong, Kab. Bogor',
};

export function loadSchoolSettings(): SchoolSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHOOL_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SCHOOL_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error loading school settings', e);
  }
  return DEFAULT_SCHOOL_SETTINGS;
}

export function saveSchoolSettings(settings: SchoolSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving school settings', e);
  }
}
