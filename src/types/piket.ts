export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | "Jum'at" | 'Sabtu';

export type UserRole = 'ADMIN' | 'GURU_PIKET' | 'GURU_BIASA';

export interface AppCredentials {
  piketId: string;
  piketPw: string;
  adminId: string;
  adminPw: string;
}

export interface PiketOfficer {
  id: string;
  name: string;
  code?: string; // optional teacher code if linked
  assignedDays: DayOfWeek[]; // e.g. ['Senin']
  phone?: string;
  roleTitle?: string; // e.g. "Koordinator Piket", "Piket Dhuha & Gerbang", "Anggota Piket"
  isActive: boolean;
}

export type AttendanceStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'TUGAS' | 'ALPHA' | 'BELUM_ABSEN';

export interface Teacher {
  id: string;
  code: string; // e.g. "14a", "15", "3b", "7a", "20", "2"
  name: string;
  nip?: string;
  subject: string;
  phone?: string;
  isActive: boolean;
  colorBg?: string; // Optional custom color class
  colorText?: string;
}

export interface Period {
  id: string;
  periodNumber: number; // 1 to 8, or 0 for break
  label: string; // e.g. "JP 1", "Istirahat 1"
  startTime: string; // e.g. "07.15"
  endTime: string; // e.g. "07.55"
  isBreak: boolean; // if true, strictly locked/disabled and unclickable
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "VII-A"
  grade: 7 | 8 | 9;
  homeroomTeacher?: string; // Wali Kelas
}

export interface ScheduleSlot {
  day: DayOfWeek;
  classId: string;
  periodId: string;
  teacherId?: string; // from Master Guru
  subject?: string; // Mata Pelajaran
  isLocked?: boolean; // if true, slot is locked/disabled and unclickable
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  day: DayOfWeek;
  classId: string;
  periodId: string;
  teacherId: string;
  teacherCode?: string;
  teacherName: string;
  subject: string;
  status: AttendanceStatus;
  reason?: string; // Alasan izin/sakit
  invalTeacherId?: string; // Guru pengganti (from master guru)
  invalTeacherCode?: string;
  invalTeacherName?: string;
  taskDescription?: string; // Tugas untuk kelas
  isTaskDelivered?: boolean; // Apakah tugas sudah diserahkan ke kelas
  notes?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface DailyPiketMeta {
  date: string; // YYYY-MM-DD
  day: DayOfWeek;
  piketOfficers: string[]; // Daftar nama guru piket hari ini
  generalNotes: string; // Catatan umum / ketertiban / dhuha
  weather?: string;
  flagCeremonyStatus?: string; // Upacara Senin
}

export interface PiketReportRecord {
  id: string;
  date: string;
  day: DayOfWeek;
  reportText: string;
  generatedByAI: boolean;
  modelUsed?: string;
  createdAt: string;
  officers: string[];
}

export interface SchoolSettings {
  schoolName: string;
  subTitle: string;
  logoUrl: string;
  semester: 'Ganjil' | 'Genap';
  academicYear: string;
  headmasterName: string;
  headmasterNip?: string;
  tuHeadName?: string;
  address?: string;
}
