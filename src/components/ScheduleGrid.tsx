import React, { useState, useMemo, useEffect } from 'react';
import { AttendanceRecord, ClassRoom, DayOfWeek, Period, ScheduleSlot, Teacher, UserRole } from '../types/piket';
import { getTeacherColor } from '../utils/defaultData';
import { 
  Lock, 
  Search, 
  KeyRound, 
  User, 
  X,
  Compass,
  Calendar,
  Layers,
  Smartphone,
  CheckCheck,
  Eye,
  BookOpen
} from 'lucide-react';

interface ScheduleGridProps {
  currentDay: DayOfWeek;
  currentDate: string;
  classes: ClassRoom[];
  periods: Period[];
  scheduleSlots: ScheduleSlot[];
  attendanceRecords: Record<string, AttendanceRecord>;
  teachers: Teacher[];
  userRole?: UserRole;
  activeTeacherId?: string;
  onRequestRoleSwitch?: () => void;
  onSlotClick: (cls: ClassRoom, period: Period, assignedTeacher: Teacher | null, subject: string, existingRecord?: AttendanceRecord) => void;
  onMarkAllPresent: () => void;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  currentDay,
  currentDate,
  classes,
  periods,
  scheduleSlots,
  attendanceRecords,
  teachers,
  userRole = 'GURU_BIASA',
  activeTeacherId,
  onRequestRoleSwitch,
  onSlotClick,
  onMarkAllPresent,
}) => {
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number | 'ALL'>('ALL');
  const [showConfirmBulk, setShowConfirmBulk] = useState(false);
  const [showCodeLegend, setShowCodeLegend] = useState(false);
  const [legendSearch, setLegendSearch] = useState('');

  // State pencarian & ID Guru aktif
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightTeacherId, setHighlightTeacherId] = useState<string>(activeTeacherId || '');

  // Mode Tampilan Default: Jika GURU_BIASA, paksa ke 'MY_SCHEDULE'
  const [viewMode, setViewMode] = useState<'MY_SCHEDULE' | 'MATRIX'>(
    userRole === 'GURU_BIASA' ? 'MY_SCHEDULE' : 'MATRIX'
  );

  // Pastikan saat role / ID guru berubah, state disesuaikan secara eksplisit
  useEffect(() => {
    if (userRole === 'GURU_BIASA') {
      setViewMode('MY_SCHEDULE');
    }
    if (activeTeacherId) {
      setHighlightTeacherId(activeTeacherId);
    }
  }, [userRole, activeTeacherId]);

  // Read-only modal state untuk Guru Biasa
  const [readOnlyModalData, setReadOnlyModalData] = useState<{
    cls: ClassRoom;
    period: Period;
    assignedTeacher: Teacher | null;
    subject: string;
    record?: AttendanceRecord;
  } | null>(null);

  const filteredClasses = classes.filter(cls => {
    if (selectedGradeFilter === 'ALL') return true;
    return cls.grade === selectedGradeFilter;
  });

  const daySchedule = scheduleSlots.filter(s => s.day === currentDay);

  // Guru yang dipilih/sedang login
  const selectedHighlightTeacher = useMemo(() => {
    return teachers.find(t => t.id === highlightTeacherId) || 
           teachers.find(t => t.id === activeTeacherId) || 
           teachers[0];
  }, [teachers, highlightTeacherId, activeTeacherId]);

  const effectiveTeacherId = selectedHighlightTeacher?.id || '';

  // Pencarian guru
  const searchNormalized = searchQuery.trim().toLowerCase();
  const matchingTeacherIds = useMemo(() => {
    if (!searchNormalized) return new Set<string>();
    const ids = new Set<string>();
    teachers.forEach(t => {
      if (
        t.name.toLowerCase().includes(searchNormalized) ||
        t.code.toLowerCase().includes(searchNormalized) ||
        t.subject.toLowerCase().includes(searchNormalized)
      ) {
        ids.add(t.id);
      }
    });
    return ids;
  }, [teachers, searchNormalized]);

  // Live status KBM
  const liveStatus = useMemo(() => {
    const teacherObj = selectedHighlightTeacher;
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeMinutes = currentHours * 60 + currentMinutes;

    const parseTimeToMinutes = (str: string) => {
      const parts = str.replace(':', '.').split('.');
      if (parts.length < 2) return 0;
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    };

    const currentPeriod = periods.find(p => {
      const start = parseTimeToMinutes(p.startTime);
      const end = parseTimeToMinutes(p.endTime);
      return currentTimeMinutes >= start && currentTimeMinutes <= end;
    });

    const teacherTodaySlots = daySchedule
      .filter(s => s.teacherId === effectiveTeacherId && !s.isLocked)
      .map(s => {
        const cls = classes.find(c => c.id === s.classId);
        const p = periods.find(per => per.id === s.periodId);
        const record = attendanceRecords[`${currentDate}_${s.classId}_${s.periodId}`];
        return { slot: s, classRoom: cls, period: p, record };
      })
      .filter(item => item.classRoom && item.period)
      .sort((a, b) => (a.period?.periodNumber || 0) - (b.period?.periodNumber || 0));

    const currentActiveSlot = currentPeriod
      ? teacherTodaySlots.find(item => item.period?.id === currentPeriod.id)
      : null;

    const nextSlot = teacherTodaySlots.find(item => {
      if (!item.period) return false;
      const start = parseTimeToMinutes(item.period.startTime);
      return start > currentTimeMinutes;
    });

    return {
      teacherObj,
      currentPeriod,
      currentActiveSlot,
      nextSlot,
      allSlotsToday: teacherTodaySlots,
      currentTimeString: `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`,
    };
  }, [selectedHighlightTeacher, effectiveTeacherId, periods, daySchedule, classes, attendanceRecords, currentDate]);

  const handleCellClick = (cls: ClassRoom, period: Period, assignedTeacher: Teacher | null, subject: string, attendanceRecord?: AttendanceRecord) => {
    if (userRole === 'GURU_BIASA') {
      setReadOnlyModalData({
        cls,
        period,
        assignedTeacher,
        subject,
        record: attendanceRecord,
      });
    } else {
      onSlotClick(cls, period, assignedTeacher, subject, attendanceRecord);
    }
  };

  return (
    <div className="space-y-4">
      {/* Indicator Header Guru Mapel */}
      {userRole === 'GURU_BIASA' && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-4 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold shrink-0 border border-blue-400/30">
              <Eye className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                  Role Guru Mapel
                </span>
                {selectedHighlightTeacher && (
                  <span className="text-xs font-black text-amber-300">
                    [{selectedHighlightTeacher.code}] {selectedHighlightTeacher.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-blue-100/80 mt-0.5">
                Menampilkan jadwal mengajar pribadi. Gunakan tombol switcher untuk melihat seluruh matriks madrasah.
              </p>
            </div>
          </div>
          {onRequestRoleSwitch && (
            <button
              type="button"
              onClick={onRequestRoleSwitch}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-blue-950 hover:bg-blue-50 transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Ganti Role</span>
            </button>
          )}
        </div>
      )}

      {/* Control Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari kode / nama guru / mapel..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative sm:w-64 shrink-0">
              <select
                value={effectiveTeacherId}
                onChange={e => setHighlightTeacherId(e.target.value)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 cursor-pointer"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.code}] {t.name.split(',')[0]} - {t.subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Switcher Tampilan (Jadwal Guru Terpilih vs Semua Jadwal) */}
          <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('MY_SCHEDULE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'MY_SCHEDULE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Jadwal Guru Ini</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('MATRIX')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'MATRIX'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Jadwal</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: HANYA DAFTAR GURU YANG DIPILIH */}
      {viewMode === 'MY_SCHEDULE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Jadwal Mengajar: {selectedHighlightTeacher ? `[${selectedHighlightTeacher.code}] ${selectedHighlightTeacher.name}` : '-'}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hari <strong>{currentDay}</strong> ({currentDate})
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('MATRIX')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              Lihat Matriks Lengkap →
            </button>
          </div>

          {liveStatus.allSlotsToday.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveStatus.allSlotsToday.map((item, idx) => {
                const isCurrentActive = liveStatus.currentActiveSlot?.period?.id === item.period?.id;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrentActive
                        ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500 shadow-xs'
                        : 'bg-slate-50/80 hover:bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border ${
                          isCurrentActive ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-slate-800 border-slate-300'
                        }`}>
                          JP {item.period?.periodNumber}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">
                            {item.period?.startTime} - {item.period?.endTime} WIB
                          </div>
                          <div className="text-xs font-semibold text-emerald-800 mt-0.5">
                            {item.slot.subject || selectedHighlightTeacher?.subject}
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-1 rounded-xl bg-slate-900 text-emerald-300 font-black text-xs">
                        Kelas {item.classRoom?.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-600">Tidak Ada Jam Mengajar Hari Ini</p>
              <p className="text-xs text-slate-400 mt-0.5">Guru yang dipilih tidak memiliki jadwal KBM pada hari {currentDay}.</p>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: MATRIKS LENGKAP SEMUA KELAS & GURU */}
      {viewMode === 'MATRIX' && (
        <div className="space-y-3">
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-xs sm:text-sm text-slate-800">
                MATRIKS LENGKAP KBM ({currentDay}, {currentDate})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Menampilkan jadwal seluruh kelas dan guru madrasah.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowCodeLegend(true)}
                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kode Guru</span>
              </button>

              <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                <button
                  type="button"
                  onClick={() => setSelectedGradeFilter('ALL')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${selectedGradeFilter === 'ALL' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'}`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGradeFilter(7)}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${selectedGradeFilter === 7 ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'}`}
                >
                  Kls 7
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGradeFilter(8)}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${selectedGradeFilter === 8 ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'}`}
                >
                  Kls 8
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGradeFilter(9)}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${selectedGradeFilter === 9 ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-slate-900'}`}
                >
                  Kls 9
                </button>
              </div>
            </div>
          </div>

          {/* Table Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold border-b border-slate-800 text-[11px]">
                    <th className="py-2 px-1 w-9 text-center border-r border-slate-800 sticky left-0 bg-slate-900 z-20">JP</th>
                    <th className="py-2 px-1 w-16 text-center border-r border-slate-800 sticky left-9 bg-slate-900 z-20 text-[10px]">WAKTU</th>
                    {filteredClasses.map(cls => (
                      <th key={cls.id} className="py-2 px-1 text-center border-r border-slate-800 min-w-[42px]">
                        <div className="font-black text-xs text-emerald-400">{cls.name}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {periods.map(period => {
                    if (period.isBreak) {
                      return (
                        <tr key={period.id} className="bg-amber-50 border-y border-amber-200">
                          <td className="py-1 px-1 font-bold text-center text-amber-900 border-r border-amber-200 sticky left-0 bg-amber-50 z-10 text-[10px]">-</td>
                          <td className="py-1 px-1 text-center font-bold text-amber-900 border-r border-amber-200 sticky left-9 bg-amber-50 z-10 text-[9px]">{period.startTime}</td>
                          <td colSpan={filteredClasses.length} className="py-1 px-2 text-center font-extrabold text-amber-900 uppercase text-[10px]">
                            {period.label} ({period.startTime} - {period.endTime})
                          </td>
                        </tr>
                      );
                    }
                    return (
                      <tr key={period.id} className="hover:bg-slate-50">
                        <td className="py-1 px-1 font-black text-center text-slate-800 border-r border-slate-200 sticky left-0 bg-white z-10">{period.periodNumber}</td>
                        <td className="py-1 px-1 text-center font-semibold text-slate-600 border-r border-slate-200 sticky left-9 bg-white z-10 text-[9px]">{period.startTime}</td>
                        {filteredClasses.map(cls => {
                          const slot = daySchedule.find(s => s.classId === cls.id && s.periodId === period.id);
                          if (!slot || slot.isLocked || !slot.teacherId) {
                            return (
                              <td key={cls.id} className="p-0.5 border-r border-slate-200 bg-slate-100/50 text-center">
                                <div className="w-full h-8 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                                  <Lock className="w-3 h-3 text-slate-300" />
                                </div>
                              </td>
                            );
                          }

                          const assignedTeacher = teachers.find(t => t.id === slot.teacherId) || null;
                          const teacherCode = assignedTeacher ? assignedTeacher.code : '-';
                          const color = getTeacherColor(teacherCode);
                          const isTargeted = effectiveTeacherId && assignedTeacher?.id === effectiveTeacherId;

                          return (
                            <td key={cls.id} className="p-0.5 border-r border-slate-200">
                              <button
                                type="button"
                                onClick={() => handleCellClick(cls, period, assignedTeacher, slot.subject || assignedTeacher?.subject || '')}
                                className={`w-full h-8 rounded border flex flex-col items-center justify-center ${color.bg} ${color.text} ${
                                  isTargeted ? 'ring-2 ring-emerald-500 font-black scale-105' : 'opacity-80'
                                }`}
                              >
                                <span className="font-black text-xs">{teacherCode}</span>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Modal */}
      {readOnlyModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                Info KBM Kelas {readOnlyModalData.cls.name}
              </span>
              <button type="button" onClick={() => setReadOnlyModalData(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="my-3 space-y-2 text-xs">
              <p><strong>Pengampu:</strong> [{readOnlyModalData.assignedTeacher?.code}] {readOnlyModalData.assignedTeacher?.name}</p>
              <p><strong>Mata Pelajaran:</strong> {readOnlyModalData.subject}</p>
              <p><strong>Waktu:</strong> {readOnlyModalData.period.startTime} - {readOnlyModalData.period.endTime} WIB</p>
            </div>
            <button
              type="button"
              onClick={() => setReadOnlyModalData(null)}
              className="w-full py-2 bg-slate-800 text-white font-bold rounded-xl text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};