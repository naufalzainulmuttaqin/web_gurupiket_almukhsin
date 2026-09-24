import { AttendanceRecord, ClassRoom, DailyPiketMeta, Period, ScheduleSlot, Teacher } from '../types/piket';

export interface RAGPiketPayload {
  schoolName: string;
  dateStr: string;
  dateFormatted: string;
  dayName: string;
  piketOfficers: string[];
  stats: {
    totalActiveSlots: number;
    presentSlots: number;
    absentSlots: number;
    permitSlots: number;
    sickSlots: number;
    dutySlots: number;
    unexcusedSlots: number;
    unmarkedSlots: number;
    percentage: number;
  };
  invalCoverage: string;
  absences: Array<{
    className: string;
    periodLabel: string;
    periodTime: string;
    teacherName: string;
    teacherCode?: string;
    subject: string;
    status: string;
    reason: string;
    invalTeacher: string;
    invalTeacherCode?: string;
    task: string;
    isTaskDelivered: boolean;
  }>;
  generalNotes: string;
  classesSummary: string[];
}

export function buildRAGContext(
  date: string,
  dayName: string,
  classes: ClassRoom[],
  periods: Period[],
  scheduleSlots: ScheduleSlot[],
  attendance: Record<string, AttendanceRecord>,
  teachers: Teacher[],
  dailyMeta: DailyPiketMeta
): RAGPiketPayload {
  // Format Date in Indonesian locale
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const dateFormatted = d.toLocaleDateString('id-ID', options);

  // Active periods (not breaks)
  const activePeriods = periods.filter(p => !p.isBreak);

  // Active schedule slots for this day
  const daySchedule = scheduleSlots.filter(s => s.day === dayName);

  let totalActiveSlots = 0;
  let presentSlots = 0;
  let permitSlots = 0;
  let sickSlots = 0;
  let dutySlots = 0;
  let unexcusedSlots = 0;
  let unmarkedSlots = 0;

  const absencesList: RAGPiketPayload['absences'] = [];
  let unassignedInvalsCount = 0;

  classes.forEach(cls => {
    activePeriods.forEach(period => {
      const slot = daySchedule.find(s => s.classId === cls.id && s.periodId === period.id);
      
      // If slot is locked or has no teacher, it is not an active KBM slot
      if (!slot || slot.isLocked || !slot.teacherId) {
        return;
      }

      totalActiveSlots++;

      const key = `${date}_${cls.id}_${period.id}`;
      const record = attendance[key];

      const assignedTeacher = teachers.find(t => t.id === slot.teacherId);
      const teacherName = assignedTeacher ? assignedTeacher.name : 'Guru Mapel';
      const subject = slot.subject || (assignedTeacher ? assignedTeacher.subject : 'Mapel');

      if (!record || record.status === 'BELUM_ABSEN') {
        unmarkedSlots++;
      } else if (record.status === 'HADIR') {
        presentSlots++;
      } else {
        // Teacher is not present
        if (record.status === 'IZIN') permitSlots++;
        else if (record.status === 'SAKIT') sickSlots++;
        else if (record.status === 'TUGAS') dutySlots++;
        else if (record.status === 'ALPHA') unexcusedSlots++;

        if (!record.invalTeacherName && !record.invalTeacherId) {
          unassignedInvalsCount++;
        }

        const invalTeacherObj = record.invalTeacherId ? teachers.find(t => t.id === record.invalTeacherId) : undefined;
        const teacherCode = record.teacherCode || assignedTeacher?.code;
        const invalTeacherCode = record.invalTeacherCode || invalTeacherObj?.code;

        absencesList.push({
          className: cls.name,
          periodLabel: period.label,
          periodTime: `${period.startTime} - ${period.endTime}`,
          teacherName: record.teacherName || teacherName,
          teacherCode,
          subject: record.subject || subject,
          status: record.status === 'IZIN' ? 'Izin' : record.status === 'SAKIT' ? 'Sakit' : record.status === 'TUGAS' ? 'Tugas Luar' : 'Tanpa Keterangan',
          reason: record.reason || '-',
          invalTeacher: record.invalTeacherName || invalTeacherObj?.name || (record.invalTeacherId ? 'Ditunjuk Piket' : ''),
          invalTeacherCode,
          task: record.taskDescription || '',
          isTaskDelivered: !!record.isTaskDelivered,
        });
      }
    });
  });

  const absentSlots = permitSlots + sickSlots + dutySlots + unexcusedSlots;
  const percentage = totalActiveSlots > 0 ? Math.round((presentSlots / totalActiveSlots) * 100) : 100;

  let invalCoverage = 'Semua jam kelas yang kosong telah didampingi oleh Guru Piket.';
  if (absentSlots === 0) {
    invalCoverage = 'Tidak ada jam kosong (100% dewan guru hadir mengajar).';
  } else if (unassignedInvalsCount > 0) {
    invalCoverage = `Perhatian: Masih terdapat ${unassignedInvalsCount} slot KBM yang BELUM ditentukan Guru Piket pendampingnya!`;
  } else {
    invalCoverage = `Seluruh ${absentSlots} slot KBM yang gurunya berhalangan telah didampingi dan diawasi langsung oleh Guru Piket.`;
  }

  const classesSummary = classes.map(c => c.name);

  return {
    schoolName: 'MTs Al Mukhsin',
    dateStr: date,
    dateFormatted,
    dayName,
    piketOfficers: dailyMeta.piketOfficers || [],
    stats: {
      totalActiveSlots,
      presentSlots,
      absentSlots,
      permitSlots,
      sickSlots,
      dutySlots,
      unexcusedSlots,
      unmarkedSlots,
      percentage,
    },
    invalCoverage,
    absences: absencesList,
    generalNotes: dailyMeta.generalNotes || 'KBM dan ketertiban madrasah berlangsung tertib.',
    classesSummary,
  };
}
