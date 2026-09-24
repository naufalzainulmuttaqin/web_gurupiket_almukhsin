import { Teacher, Period, ClassRoom, ScheduleSlot, DayOfWeek, PiketOfficer } from '../types/piket';

// Helper pewarnaan badge kode jadwal di tabel KBM
export function getTeacherColor(code?: string): { bg: string; text: string; border: string } {
  if (!code) {
    return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' };
  }
  const clean = code.trim().toLowerCase();
  switch (clean) {
    case '1': return { bg: 'bg-zinc-100', text: 'text-zinc-900', border: 'border-zinc-300' };
    case '2': return { bg: 'bg-amber-100', text: 'text-amber-950', border: 'border-amber-300' };
    case '3':
    case '3b': return { bg: 'bg-lime-100', text: 'text-lime-950', border: 'border-lime-300' };
    case '4': return { bg: 'bg-yellow-100', text: 'text-yellow-950', border: 'border-yellow-300' };
    case '5': return { bg: 'bg-blue-100', text: 'text-blue-950', border: 'border-blue-300' };
    case '6': return { bg: 'bg-slate-200', text: 'text-slate-900', border: 'border-slate-400' };
    case '7a':
    case '7b': return { bg: 'bg-orange-100', text: 'text-orange-950', border: 'border-orange-300' };
    case '8': return { bg: 'bg-emerald-100', text: 'text-emerald-950', border: 'border-emerald-300' };
    case '9a':
    case '9b': return { bg: 'bg-rose-100', text: 'text-rose-950', border: 'border-rose-300' };
    case '10': return { bg: 'bg-amber-200', text: 'text-amber-950', border: 'border-amber-400' };
    case '11': return { bg: 'bg-teal-100', text: 'text-teal-950', border: 'border-teal-300' };
    case '12': return { bg: 'bg-zinc-200', text: 'text-zinc-900', border: 'border-zinc-400' };
    case '13a':
    case '13b': return { bg: 'bg-cyan-100', text: 'text-cyan-950', border: 'border-cyan-300' };
    case '14a':
    case '14b': return { bg: 'bg-sky-100', text: 'text-sky-950', border: 'border-sky-300' };
    case '15': return { bg: 'bg-stone-200', text: 'text-stone-900', border: 'border-stone-400' };
    case '16': return { bg: 'bg-indigo-100', text: 'text-indigo-950', border: 'border-indigo-300' };
    case '17': return { bg: 'bg-green-100', text: 'text-green-950', border: 'border-green-300' };
    case '18': return { bg: 'bg-blue-200', text: 'text-blue-950', border: 'border-blue-400' };
    case '19a':
    case '19b': return { bg: 'bg-purple-100', text: 'text-purple-950', border: 'border-purple-300' };
    case '20': return { bg: 'bg-pink-100', text: 'text-pink-950', border: 'border-pink-300' };
    case '21a':
    case '21b': return { bg: 'bg-violet-100', text: 'text-violet-950', border: 'border-violet-300' };
    case '22': return { bg: 'bg-fuchsia-100', text: 'text-fuchsia-950', border: 'border-fuchsia-300' };
    case '23a':
    case '23b': return { bg: 'bg-teal-50', text: 'text-teal-950', border: 'border-teal-200' };
    default: return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' };
  }
}

// Master Data Guru & Kode sesuai Tabel PDF Jadwal Pelajaran MTs Al-Mukhsin TA 2026-2027
export const INITIAL_TEACHERS: Teacher[] = [
  { id: 't-1', code: '1', name: 'Drs. A. Sumanta, M. Pd', subject: 'Pembina Yayasan', isActive: true },
  { id: 't-2', code: '2', name: 'Siti Maisaroh, M. Pd', subject: 'B. Indonesia', isActive: true },
  { id: 't-3', code: '3', name: 'Epi Sudiyati, M. Pd', subject: 'Ilmu Pengetahuan Alam', isActive: true },
  { id: 't-3b', code: '3b', name: 'Epi Sudiyati, M. Pd', subject: 'Kookurikuler', isActive: true },
  { id: 't-4', code: '4', name: 'Dewi Ratna Sari, M.Pd', subject: 'Bahasa Inggris', isActive: true },
  { id: 't-5', code: '5', name: 'Siti Maesaroh, M. Pd', subject: 'Ilmu Pengetahuan Sosial', isActive: true },
  { id: 't-6', code: '6', name: 'Novie Wulandari, M. Pd', subject: 'Matematika', isActive: true },
  { id: 't-7a', code: '7a', name: 'Naswir, S. Pd.I', subject: 'Fiqih', isActive: true },
  { id: 't-7b', code: '7b', name: 'Naswir, S. Pd.I', subject: "Alqur'an Hadits", isActive: true },
  { id: 't-8', code: '8', name: 'Ari Nurhayati, M.Pd', subject: 'Ilmu Pengetahuan Alam', isActive: true },
  { id: 't-9a', code: '9a', name: 'Maryanih, M. Pd.', subject: 'Aqidah Akhlaq', isActive: true },
  { id: 't-9b', code: '9b', name: 'Maryanih, M. Pd', subject: 'Sejarah Kebudayaan Islam', isActive: true },
  { id: 't-10', code: '10', name: 'Amsih, S. Pd', subject: 'Pendidikan Kewarganegaraan', isActive: true },
  { id: 't-11', code: '11', name: 'Evita Anggraeni, SE', subject: 'Baca Tulis Al Quran', isActive: true },
  { id: 't-12', code: '12', name: 'Syaiful Yusuf, S.Kom', subject: 'Kookurikuler', isActive: true },
  { id: 't-13a', code: '13a', name: 'Erva Nurfillah, S.Si, M.Pd', subject: 'Seni Budaya', isActive: true },
  { id: 't-13b', code: '13b', name: 'Erva Nurfillah, S.Si, M.Pd', subject: 'Matematika', isActive: true },
  { id: 't-14a', code: '14a', name: 'Syarifuddin, S. Pd.', subject: "Al-Qur'an Hadits", isActive: true },
  { id: 't-14b', code: '14b', name: 'Syarifuddin, S. Pd.', subject: "Bimbingan Membaca Qur'an", isActive: true },
  { id: 't-15', code: '15', name: "Robi'ul Ikhwan, S. Pd.", subject: 'Penjaskes', isActive: true },
  { id: 't-16', code: '16', name: 'M. Iman Tajam Prayugo, S. Pd.', subject: 'Bahasa Arab', isActive: true },
  { id: 't-17', code: '17', name: 'Nanda Rayhan Firdaus', subject: 'TIK', isActive: true },
  { id: 't-18', code: '18', name: 'Ryan Putra, S. M', subject: 'TIK', isActive: true },
  { id: 't-19a', code: '19a', name: 'Yoga Kurniawan', subject: 'Seni Budaya', isActive: true },
  { id: 't-19b', code: '19b', name: 'Yoga Kurniawan', subject: 'Kookurikuler', isActive: true },
  { id: 't-20', code: '20', name: 'Cucu Rosliani, S. Pd', subject: 'Bahasa Sunda', isActive: true },
  { id: 't-21a', code: '21a', name: 'Naufal Zainul Muttaqien', subject: 'Bahasa Indonesia', isActive: true },
  { id: 't-21b', code: '21b', name: 'Naufal Zainul Muttaqien', subject: "Bimbingan Membaca Qur'an", isActive: true },
  { id: 't-22', code: '22', name: 'M. Hasan Annasrullah', subject: 'Kookurikuler', isActive: true },
  { id: 't-23a', code: '23a', name: 'Inne Kurnia Haqi, S. Ag', subject: 'Al Quran Hadits', isActive: true },
  { id: 't-23b', code: '23b', name: 'Inne Kurnia Haqi, S. Ag', subject: "Bimbingan Membaca Qur'an", isActive: true }
];

// src/utils/defaultData.ts

export const INITIAL_CLASSES: ClassRoom[] = [
  { id: 'c-vii-1', name: 'VII.1', grade: 7, homeroomTeacher: 'Dewi Ratna Sari, M.Pd' },
  { id: 'c-vii-2', name: 'VII.2', grade: 7, homeroomTeacher: 'Epi Sudiyati, M. Pd' },
  { id: 'c-vii-3', name: 'VII.3', grade: 7, homeroomTeacher: 'Amsih, S. Pd' },
  { id: 'c-vii-4', name: 'VII.4', grade: 7, homeroomTeacher: 'Siti Maesaroh, M. Pd' },
  { id: 'c-viii-1', name: 'VIII.1', grade: 8, homeroomTeacher: 'M. Hasan Annasrullah' },
  { id: 'c-viii-2', name: 'VIII.2', grade: 8, homeroomTeacher: 'Evita Anggraeni, SE' },
  { id: 'c-viii-3', name: 'VIII.3', grade: 8, homeroomTeacher: 'Cucu Rosliani, S. Pd' },
  { id: 'c-viii-4', name: 'VIII.4', grade: 8, homeroomTeacher: 'M. Iman Tajam Prayugo, S. Pd.' },
  { id: 'c-ix-1', name: 'IX.1', grade: 9, homeroomTeacher: 'Siti Maisaroh, M. Pd' },
  { id: 'c-ix-2', name: 'IX.2', grade: 9, homeroomTeacher: 'Maryanih, M. Pd' },
  { id: 'c-ix-3', name: 'IX.3', grade: 9, homeroomTeacher: 'Novie Wulandari, M. Pd' },
  { id: 'c-ix-4', name: 'IX.4', grade: 9, homeroomTeacher: 'Naswir, S. Pd.I' },
];

// Jam Pelajaran (JP) resmi sesuai tabel waktu PDF
export const INITIAL_PERIODS: Period[] = [
  { id: 'p-1', periodNumber: 1, label: 'JP 1', startTime: '08.00', endTime: '08.30', isBreak: false },
  { id: 'p-2', periodNumber: 2, label: 'JP 2', startTime: '08.30', endTime: '09.00', isBreak: false },
  { id: 'p-3', periodNumber: 3, label: 'JP 3', startTime: '09.00', endTime: '09.30', isBreak: false },
  { id: 'p-4', periodNumber: 4, label: 'JP 4', startTime: '09.30', endTime: '10.00', isBreak: false },
  { id: 'p-ist1', periodNumber: 0, label: 'ISTIRAHAT', startTime: '10.00', endTime: '10.35', isBreak: true },
  { id: 'p-5', periodNumber: 5, label: 'JP 5', startTime: '10.35', endTime: '11.05', isBreak: false },
  { id: 'p-6', periodNumber: 6, label: 'JP 6', startTime: '11.05', endTime: '11.35', isBreak: false },
  { id: 'p-bahasa', periodNumber: 0, label: 'PENGEMBANGAN BAHASA', startTime: '11.35', endTime: '11.55', isBreak: true },
  { id: 'p-ishoma', periodNumber: 0, label: 'ISHOMA', startTime: '11.55', endTime: '12.30', isBreak: true },
  { id: 'p-7', periodNumber: 7, label: 'JP 7', startTime: '12.30', endTime: '13.00', isBreak: false },
  { id: 'p-8', periodNumber: 8, label: 'JP 8', startTime: '13.00', endTime: '13.30', isBreak: false },
  { id: 'p-9', periodNumber: 9, label: 'JP 9', startTime: '13.30', endTime: '14.00', isBreak: false },
  { id: 'p-10', periodNumber: 10, label: 'JP 10', startTime: '14.00', endTime: '14.30', isBreak: false },
  { id: 'p-11', periodNumber: 11, label: 'JP 11', startTime: '14.30', endTime: '15.00', isBreak: false },
  { id: 'p-12', periodNumber: 12, label: 'JP 12', startTime: '15.00', endTime: '15.30', isBreak: false },
];

export const DAYS_LIST: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];

// Pilihan mata pelajaran untuk filter dan dropdown
export const SUBJECT_OPTIONS = [
  'B. Indonesia',
  'Bahasa Indonesia',
  'Ilmu Pengetahuan Alam',
  'Kookurikuler',
  'Bahasa Inggris',
  'Ilmu Pengetahuan Sosial',
  'Matematika',
  'Fiqih',
  "Alqur'an Hadits",
  "Al-Qur'an Hadits",
  'Aqidah Akhlaq',
  'Sejarah Kebudayaan Islam',
  'Pendidikan Kewarganegaraan',
  'Baca Tulis Al Quran',
  'Seni Budaya',
  "Bimbingan Membaca Qur'an",
  'Penjaskes',
  'Bahasa Arab',
  'TIK',
  'Bahasa Sunda',
  'Pembina Yayasan'
];

// Matriks Jadwal KBM per Kelas (JP 1 sampai JP 12) diekstrak langsung dari kolom PDF
const MONDAY_SCHEDULE_RAW: Record<string, string[]> = {
  'c-vii-1': ['3', '3', '14a', '14a', '20', '20', '9b', '9b', '3b', '21a', '14a', '9b'],
  'c-vii-2': ['20', '20', '15', '15', '14a', '14a', '3b', '3b', '7a', '15', '9b', '14a'],
  'c-vii-3': ['21a', '21a', '3b', '3b', '11', '6', '10', '10', '5', '3b', '21a', '21a'],
  'c-vii-4': ['6', '6', '7a', '7a', '15', '11', '19a', '19a', '9a', '7a', '6', '2'],
  'c-viii-1': ['5', '5', '6', '6', '6', '15', '5', '5', '15', '9a', '2', '6'],
  'c-viii-2': ['6', '6', '20', '4', '19a', '8', '8', '14b', '23a', '10', '5', '23a'],
  'c-viii-3': ['21a', '21a', '4', '20', '4', '19a', '14b', '7a', '10', '6', '23a', '5'],
  'c-viii-4': ['20', '20', '2', '2', '3', '3', '7a', '23a', '6', '5', '11', '11'],
  'c-ix-1': ['8', '8', '11', '11', '9b', '9b', '16', '16', '16', '4', '4', '4'],
  'c-ix-2': ['3', '3', '9a', '16', '5', '21b', '2', '21b', '11', '11', '16', '16'],
  'c-ix-3': ['13a', '13a', '5', '16', '16', '4', '4', '13a', '13a', '2', '13a', '13a'],
  'c-ix-4': ['16', '16', '16', '5', '2', '2', '13a', '4', '2', '16', '15', '15'],
};

const TUESDAY_SCHEDULE_RAW: Record<string, string[]> = {
  'c-vii-1': ['9b', '9b', '19a', '19a', '21a', '21a', '7a', '7a', '23b', '23b', '13b', '13b'],
  'c-vii-2': ['7a', '7a', '5', '5', '4', '15', '16', '23b', '7a', '7a', '3', '3'],
  'c-vii-3': ['13a', '13a', '8', '8', '10', '16', '23b', '16', '21a', '21a', '9a', '9a'],
  'c-vii-4': ['16', '16', '21a', '21a', '3', '10', '6', '6', '13b', '13b', '11', '12'],
  'c-viii-1': ['2', '2', '4', '4', '20', '19b', '21a', '21a', '9a', '9a', '12', '11'],
  'c-viii-2': ['11', '11', '16', '16', '19b', '9b', '11', '13a', '2', '5', '21b', '21b'],
  'c-viii-3': ['15', '15', '9b', '9b', '9b', '13a', '13a', '9a', '5', '2', '5', '4'],
  'c-viii-4': ['13a', '13a', '10', '10', '6', '22', '9a', '8', '6', '4', '19a', '22'],
  'c-ix-1': ['7a', '7a', '7b', '7b', '22', '6', '8', '5', '15', '11', '22', '19a'],
  'c-ix-2': ['15', '15', '15', '15', '7a', '7a', '5', '2', '8', '12', '4', '2'],
  'c-ix-3': ['2', '2', '20', '20', '2', '2', '2', '12', '11', '8', '2', '2'],
  'c-ix-4': ['11', '11', '2', '2', '14a', '14a', '12', '9a', '12', '6', '6', '6'],
};

const WEDNESDAY_SCHEDULE_RAW: Record<string, string[]> = {
  'c-vii-1': ['7a', '7a', '16', '16', '17', '4', '5', '5', '5', '19a', '4', '4'],
  'c-vii-2': ['16', '16', '3b', '3b', '4', '17', '12', '12', '19a', '4', '8', '8'],
  'c-vii-3': ['20', '20', '4', '4', '23b', '19a', '9b', '9b', '9a', '9a', '16', '16'],
  'c-vii-4': ['11', '11', '21a', '21a', '19a', '23b', '4', '4', '4', '16', '12', '12'],
  'c-viii-1': ['22', '22', '15', '15', '12', '12', '15', '10', '16', '8', '19a', '19a'],
  'c-viii-2': ['4', '4', '4', '16', '16', '16', '16', '2', '10', '5', '5', '5'],
  'c-viii-3': ['18', '18', '22', '22', '20', '20', '10', '16', '8', '2', '2', '2'],
  'c-viii-4': ['8', '8', '6', '6', '3', '3', '2', '15', '2', '10', '6', '6'],
  'c-ix-1': ['17', '17', '9b', '9b', '6', '6', '3', '3', '12', '12', '10', '10'],
  'c-ix-2': ['6', '6', '10', '10', '9a', '9a', '7a', '7a', '15', '15', '17', '17'],
  'c-ix-3': ['15', '15', '20', '20', '10', '10', '19b', '19b', '17', '6', '9a', '9a'],
  'c-ix-4': ['9b', '9b', '12', '12', '7a', '7a', '6', '6', '6', '17', '3', '3'],
};

const THURSDAY_SCHEDULE_RAW: Record<string, string[]> = {
  'c-vii-1': ['16', '16', '16', '21a', '21a', '21a', '9b', '9b', '3', '3'],
  'c-vii-2': ['3', '3', '9b', '9b', '20', '20', '23b', '23b', '17', '17'],
  'c-vii-3': ['4', '4', '4', '16', '16', '16', '17', '17', '10', '10'],
  'c-vii-4': ['8', '8', '10', '10', '9a', '9a', '14a', '14a', '12', '12'],
  'c-viii-1': ['9a', '19a', '12', '6', '7a', '7a', '5', '18', '5', '9a'],
  'c-viii-2': ['14b', '9a', '16', '14b', '14b', '14b', '19b', '19b', '9a', '8'],
  'c-viii-3': ['10', '14b', '2', '7b', '6', '4', '18', '2', '8', '2'],
  'c-viii-4': ['19a', '10', '7b', '20', '4', '6', '4', '5', '2', '6'],
  'c-ix-1': ['5', '5', '6', '2', '5', '5', '3', '3', '6', '2'],
  'c-ix-2': ['21b', '21b', '20', '3', '19b', '2', '12', '4', '7b', '7b'],
  'c-ix-3': ['20', '20', '15', '12', '8', '19b', '2', '6', '16', '4'],
  'c-ix-4': ['17', '17', '12', '8', '2', '12', '6', '16', '4', '16'],
};

const FRIDAY_SCHEDULE_RAW: Record<string, string[]> = {
  'c-vii-1': ['13b', '7a', '23a', '3'],
  'c-vii-2': ['18', '23a', '17', '11'],
  'c-vii-3': ['9b', '21b', '18', '21a'],
  'c-vii-4': ['7a', '13b', '9b', '9b'],
  'c-viii-1': ['23a', '18', '11', '2'],
  'c-viii-2': ['21b', '9b', '21a', '17'],
  'c-viii-3': ['8', '20', '3', '23a'],
  'c-viii-4': ['20', '8', '2', '18'],
  'c-ix-1': ['11', '11', '12', '12'],
  'c-ix-2': ['3', '3', '20', '20'],
  'c-ix-3': ['2', '2', '8', '8'],
  'c-ix-4': ['17', '17', '7b', '7b'],
};

// Fungsi pembangun slot jadwal awal
export function generateInitialSchedule(): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const activePeriods = INITIAL_PERIODS.filter(p => !p.isBreak);

  const teacherMapByCode = new Map<string, Teacher>();
  INITIAL_TEACHERS.forEach(t => {
    teacherMapByCode.set(t.code.toLowerCase(), t);
  });

  DAYS_LIST.forEach((day) => {
    INITIAL_CLASSES.forEach((cls) => {
      activePeriods.forEach((period, idx) => {
        let code = '';
        if (day === 'Senin') {
          const list = MONDAY_SCHEDULE_RAW[cls.id];
          if (list && list[idx]) code = list[idx];
        } else if (day === 'Selasa') {
          const list = TUESDAY_SCHEDULE_RAW[cls.id];
          if (list && list[idx]) code = list[idx];
        } else if (day === 'Rabu') {
          const list = WEDNESDAY_SCHEDULE_RAW[cls.id];
          if (list && list[idx]) code = list[idx];
        } else if (day === 'Kamis') {
          const list = THURSDAY_SCHEDULE_RAW[cls.id];
          if (list && list[idx]) code = list[idx];
        } else if (day === "Jum'at") {
          // Jum'at pulang sholat jum'at (hanya JP 1 s.d JP 4 aktif)
          if (period.periodNumber > 4) {
            code = '';
          } else {
            const list = FRIDAY_SCHEDULE_RAW[cls.id];
            if (list && list[idx]) code = list[idx];
          }
        }

        const teacher = code ? teacherMapByCode.get(code.toLowerCase()) : undefined;
        const isSlotLocked = !code || !teacher;

        slots.push({
          day,
          classId: cls.id,
          periodId: period.id,
          teacherId: isSlotLocked ? undefined : teacher?.id,
          subject: isSlotLocked ? undefined : teacher?.subject,
          isLocked: isSlotLocked,
        });
      });
    });
  });

  return slots;
}

// Guru Piket Harian sesuai footer jadwal KBM PDF
export const INITIAL_PIKET_OFFICERS: PiketOfficer[] = [
  { id: 'pkt-senin-1', name: 'Naufal Zainul Muttaqin', code: '21a', assignedDays: ['Senin'], roleTitle: 'Petugas Guru Piket', isActive: true },
  { id: 'pkt-selasa-1', name: 'Nanda Rayhan Firdaus', code: '17', assignedDays: ['Selasa'], roleTitle: 'Petugas Guru Piket', isActive: true },
  { id: 'pkt-rabu-1', name: 'M. Hasan Annasrullah', code: '22', assignedDays: ['Rabu'], roleTitle: 'Petugas Guru Piket', isActive: true },
  { id: 'pkt-kamis-1', name: 'Naufal Zainul Muttaqin', code: '21a', assignedDays: ['Kamis'], roleTitle: 'Petugas Guru Piket', isActive: true },
  { id: 'pkt-jumat-1', name: 'Amsih, S. Pd. I', code: '10', assignedDays: ["Jum'at"], roleTitle: 'Petugas Guru Piket', isActive: true },
  { id: 'pkt-jumat-2', name: 'Robi\'ul Ikhwan, S. Pd.', code: '15', assignedDays: ['Senin', 'Selasa'], roleTitle: 'Imam Shalat & Piket', isActive: true },
  { id: 'pkt-jumat-3', name: 'Naswir, S. Pd.I', code: '7a', assignedDays: ['Kamis'], roleTitle: 'Imam Shalat & Piket', isActive: true }
];