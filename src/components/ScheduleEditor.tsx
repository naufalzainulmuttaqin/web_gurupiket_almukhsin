import React, { useState, useEffect } from 'react';
import { ClassRoom, DayOfWeek, Period, ScheduleSlot, Teacher, UserRole } from '../types/piket';
import { getTeacherColor } from '../utils/defaultData';
import {
  Calendar,
  Lock,
  Unlock,
  Edit3,
  Check,
  X,
  Clock,
  KeyRound,
  Sparkles,
  Plus,
  Trash2,
  Coffee,
  BookOpen
} from 'lucide-react';

interface ScheduleEditorProps {
  days: DayOfWeek[];
  classes: ClassRoom[];
  periods: Period[];
  scheduleSlots: ScheduleSlot[];
  teachers: Teacher[];
  userRole?: UserRole;
  dayPeriodsMap?: Partial<Record<DayOfWeek, Period[]>>;
  onRequestRoleSwitch?: () => void;
  onUpdateSlot: (
    day: DayOfWeek,
    classId: string,
    periodId: string,
    teacherId?: string,
    subject?: string,
    isLocked?: boolean
  ) => void;
  onUpdatePeriods?: (periods: Period[], targetDay?: DayOfWeek) => void;
}

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  days,
  classes,
  periods,
  scheduleSlots,
  teachers,
  userRole = 'GURU_PIKET',
  dayPeriodsMap = {},
  onRequestRoleSwitch,
  onUpdateSlot,
  onUpdatePeriods,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Senin');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number | 'ALL'>('ALL');
  const [showRoleAlert, setShowRoleAlert] = useState(false);
  const [showPeriodTimeModal, setShowPeriodTimeModal] = useState(false);

  // Mode simpan waktu JP: khusus hari ini atau semua hari
  const [applyScope, setApplyScope] = useState<'SINGLE_DAY' | 'ALL_DAYS'>('SINGLE_DAY');

  // Waktu JP aktif untuk hari yang dipilih
  const currentActivePeriods = dayPeriodsMap[selectedDay] || periods;
  const [editablePeriods, setEditablePeriods] = useState<Period[]>(currentActivePeriods);

  const [editingSlot, setEditingSlot] = useState<{
    classId: string;
    periodId: string;
    teacherId: string;
    subject: string;
    isLocked: boolean;
  } | null>(null);

  // Sinkronkan form saat pergantian hari atau props periods terupdate
  useEffect(() => {
    const active = dayPeriodsMap[selectedDay] || periods;
    setEditablePeriods(active.map(p => ({ ...p })));
  }, [selectedDay, dayPeriodsMap, periods]);

  // Filter kelas berdasarkan jenjang (VII, VIII, IX)
  const filteredClasses = classes.filter(cls => {
    if (selectedGradeFilter === 'ALL') return true;
    return cls.grade === selectedGradeFilter;
  });

  // Tambah baris JP baru
  const handleAddNewPeriod = (isBreak: boolean) => {
    const currentMaxJP = editablePeriods.reduce(
      (max, p) => (!p.isBreak && p.periodNumber > max ? p.periodNumber : max),
      0
    );
    const newId = `p-${Date.now()}`;
    const newPeriod: Period = {
      id: newId,
      periodNumber: isBreak ? 0 : currentMaxJP + 1,
      label: isBreak ? 'ISHOMA / ISTIRAHAT' : `JP ${currentMaxJP + 1}`,
      startTime: '12.00',
      endTime: '12.30',
      isBreak: isBreak,
    };
    setEditablePeriods([...editablePeriods, newPeriod]);
  };

  // Hapus baris JP
  const handleDeletePeriod = (id: string) => {
    if (editablePeriods.length <= 1) {
      alert('Minimal harus tersisa 1 slot kegiatan!');
      return;
    }
    const updated = editablePeriods.filter(p => p.id !== id);
    // Tata ulang nomor JP secara teratur
    let jpCounter = 1;
    const reindexed = updated.map(p => {
      if (!p.isBreak) {
        const num = jpCounter++;
        return { ...p, periodNumber: num, label: `JP ${num}` };
      }
      return p;
    });
    setEditablePeriods(reindexed);
  };

  // Ubah status istirahat (break) atau jam KBM
  const handleToggleBreak = (index: number) => {
    const updated = [...editablePeriods];
    const target = updated[index];
    const willBeBreak = !target.isBreak;
    target.isBreak = willBeBreak;
    if (willBeBreak) {
      target.periodNumber = 0;
      target.label = 'ISHOMA';
    } else {
      target.label = `JP Baru`;
    }
    // Rapikan kembali nomor JP
    let jpCounter = 1;
    const reindexed = updated.map(p => {
      if (!p.isBreak) {
        const num = jpCounter++;
        return { ...p, periodNumber: num, label: `JP ${num}` };
      }
      return p;
    });
    setEditablePeriods(reindexed);
  };

  // Saat slot jam KBM diklik
  const handleOpenEdit = (cls: ClassRoom, period: Period) => {
    if (period.isBreak) return;

    if (userRole === 'GURU_BIASA') {
      setShowRoleAlert(true);
      return;
    }

    const current = scheduleSlots.find(
      s => s.day === selectedDay && s.classId === cls.id && s.periodId === period.id
    );

    setEditingSlot({
      classId: cls.id,
      periodId: period.id,
      teacherId: current?.teacherId || '',
      subject: current?.subject || '',
      isLocked: !!current?.isLocked || !current?.teacherId,
    });
  };

  const handleTeacherSelect = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) {
      setEditingSlot(prev =>
        prev
          ? {
              ...prev,
              teacherId,
              subject: prev.subject || teacher.subject,
              isLocked: false,
            }
          : null
      );
    } else {
      setEditingSlot(prev =>
        prev
          ? {
              ...prev,
              teacherId: '',
              subject: '',
              isLocked: true,
            }
          : null
      );
    }
  };

  const handleSaveModal = () => {
    if (!editingSlot) return;

    onUpdateSlot(
      selectedDay,
      editingSlot.classId,
      editingSlot.periodId,
      editingSlot.isLocked ? undefined : editingSlot.teacherId,
      editingSlot.isLocked ? undefined : editingSlot.subject,
      editingSlot.isLocked
    );
    setEditingSlot(null);
  };

  const handleSavePeriodTimes = () => {
    if (onUpdatePeriods) {
      if (applyScope === 'SINGLE_DAY') {
        onUpdatePeriods(editablePeriods, selectedDay);
      } else {
        onUpdatePeriods(editablePeriods, undefined);
      }
    }
    setShowPeriodTimeModal(false);
  };

  const daySchedule = scheduleSlots.filter(s => s.day === selectedDay);
  const selectedClassObj = editingSlot ? classes.find(c => c.id === editingSlot.classId) : null;
  const selectedPeriodObj = editingSlot ? currentActivePeriods.find(p => p.id === editingSlot.periodId) : null;

  return (
    <div className="space-y-6">
      {/* Mode Guru Biasa Alert / Info */}
      {userRole === 'GURU_BIASA' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Mode Hanya Lihat:</strong> Pengaturan slot jadwal KBM terkunci untuk akun Guru Biasa. Silakan beralih ke Guru Piket untuk mengubah susunan jadwal.
            </span>
          </div>
          {onRequestRoleSwitch && (
            <button
              type="button"
              onClick={onRequestRoleSwitch}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition shrink-0 self-start sm:self-auto cursor-pointer"
            >
              Masuk sebagai Guru Piket
            </button>
          )}
        </div>
      )}

      {/* Role Alert Modal when clicked in read-only mode */}
      {showRoleAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 text-center mb-1">
              Pengaturan Jadwal Terkunci
            </h3>
            <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
              Anda sedang berada dalam <strong>Mode Guru Biasa</strong>. Pengubahan jadwal KBM madrasah hanya dapat dilakukan oleh <strong>Guru Piket</strong> atau Admin Kurikulum.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRoleAlert(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Tutup
              </button>
              {onRequestRoleSwitch && (
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleAlert(false);
                    onRequestRoleSwitch();
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Beralih Role
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header & Day Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-800" />
                Kelola & Ubah Jadwal KBM (Guru Piket & Admin)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                Hari {selectedDay}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik tombol di bawah untuk menambah JP, menghapus JP, atau mengatur jam Ishoma/Istirahat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {userRole !== 'GURU_BIASA' && onUpdatePeriods && (
              <button
                type="button"
                onClick={() => {
                  const active = dayPeriodsMap[selectedDay] || periods;
                  setEditablePeriods(active.map(p => ({ ...p })));
                  setApplyScope('SINGLE_DAY');
                  setShowPeriodTimeModal(true);
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title={`Atur jam mulai, selesai, tambah/hapus JP untuk hari ${selectedDay}`}
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Atur JP & Ishoma ({selectedDay})</span>
              </button>
            )}

            {/* Filter Jenjang Kelas */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setSelectedGradeFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  selectedGradeFilter === 'ALL'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setSelectedGradeFilter(7)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  selectedGradeFilter === 7
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kls VII
              </button>
              <button
                type="button"
                onClick={() => setSelectedGradeFilter(8)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  selectedGradeFilter === 8
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kls VIII
              </button>
              <button
                type="button"
                onClick={() => setSelectedGradeFilter(9)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  selectedGradeFilter === 9
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kls IX
              </button>
            </div>
          </div>
        </div>

        {/* Day selection tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3">
          {days.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedDay === day
                  ? 'bg-emerald-800 text-white shadow-xs scale-[1.02]'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{day}</span>
              {dayPeriodsMap[day] && (
                <span className={`w-2 h-2 rounded-full ${selectedDay === day ? 'bg-amber-300' : 'bg-emerald-500'}`} title="Memiliki susunan waktu JP khusus" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Table Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center border-r border-slate-200 w-32">Waktu / JP</th>
                {filteredClasses.map(cls => (
                  <th key={cls.id} className="py-3 px-3 border-r border-slate-200 min-w-[130px]">
                    <div className="font-extrabold text-slate-800">{cls.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate">
                      {cls.homeroomTeacher}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentActivePeriods.map(period => {
                if (period.isBreak) {
                  return (
                    <tr key={period.id} className="bg-amber-50/60 border-y border-amber-200/60">
                      <td className="py-2.5 px-3 text-center border-r border-amber-200 font-mono text-[11px] text-amber-900 font-bold">
                        {period.startTime} - {period.endTime}
                      </td>
                      <td
                        colSpan={filteredClasses.length}
                        className="py-2.5 px-3 text-center font-extrabold tracking-wider text-amber-900 uppercase text-[11px]"
                      >
                        ☕ {period.label}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={period.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-center border-r border-slate-200 bg-slate-50/30">
                      <div className="font-extrabold text-slate-800">JP {period.periodNumber}</div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {period.startTime} - {period.endTime}
                      </div>
                    </td>

                    {filteredClasses.map(cls => {
                      const slot = daySchedule.find(
                        s => s.classId === cls.id && s.periodId === period.id
                      );

                      const teacher = teachers.find(t => t.id === slot?.teacherId);
                      const isLocked = !slot?.teacherId || slot?.isLocked;
                      const colors = getTeacherColor(teacher?.code);

                      return (
                        <td
                          key={cls.id}
                          onClick={() => handleOpenEdit(cls, period)}
                          className={`p-2 border-r border-slate-200 align-top transition group ${
                            userRole !== 'GURU_BIASA'
                              ? 'cursor-pointer hover:bg-emerald-50/40'
                              : 'cursor-default'
                          }`}
                        >
                          {isLocked ? (
                            <div className="h-14 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 group-hover:border-slate-300">
                              <span className="text-[10px] font-bold">Kosong / Terkunci</span>
                              {userRole !== 'GURU_BIASA' && (
                                <span className="text-[9px] text-emerald-800 opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                                  <Edit3 className="w-2.5 h-2.5" /> Klik isi
                                </span>
                              )}
                            </div>
                          ) : (
                            <div
                              className={`h-14 p-1.5 rounded-xl border flex flex-col justify-between transition ${colors.bg} ${colors.border}`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-mono font-bold text-[11px] px-1 rounded bg-white/70 shadow-2xs">
                                    {teacher?.code}
                                  </span>
                                  {userRole !== 'GURU_BIASA' && (
                                    <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                                  )}
                                </div>
                                <div
                                  className={`font-semibold text-[11px] truncate leading-tight mt-0.5 ${colors.text}`}
                                  title={teacher?.name}
                                >
                                  {teacher?.name}
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-600 truncate font-medium">
                                {slot?.subject || teacher?.subject}
                              </div>
                            </div>
                          )}
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

      {/* MODAL: ATUR, TAMBAH, HAPUS JP & ISHOMA (FULL KONTROL) */}
      {showPeriodTimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in">
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-700" />
                    Atur JP, Jam KBM & Ishoma
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Hari {selectedDay}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tambah JP, kurangi JP, atau ubah urutan jam istirahat/ishoma sesuai jadwal madrasah.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPeriodTimeModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pilihan Cakupan Hari (Scope Switcher) */}
            <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Terapkan ke:</span>
                <button
                  type="button"
                  onClick={() => setApplyScope('SINGLE_DAY')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    applyScope === 'SINGLE_DAY'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hanya Hari {selectedDay}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApplyScope('ALL_DAYS')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    applyScope === 'ALL_DAYS'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Semua Hari</span>
                </button>
              </div>

              {/* Action Buttons: Tambah JP / Tambah Ishoma */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddNewPeriod(false)}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah JP</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddNewPeriod(true)}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>+ Tambah Ishoma</span>
                </button>
              </div>
            </div>

            {/* List Input Baris Jam JP */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                {editablePeriods.map((p, index) => (
                  <div
                    key={p.id}
                    className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                      p.isBreak ? 'bg-amber-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Kolom Jenis & Label */}
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleBreak(index)}
                        className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                          p.isBreak
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                        title="Klik untuk mengubah jenis antara Jam Mengajar (KBM) atau Jam Istirahat/Ishoma"
                      >
                        {p.isBreak ? <Coffee className="w-3.5 h-3.5" /> : <BookOpen className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{p.isBreak ? 'Istirahat' : 'Jam KBM'}</span>
                      </button>

                      {/* Edit Nama Label */}
                      <input
                        type="text"
                        value={p.label}
                        onChange={(e) => {
                          const updated = [...editablePeriods];
                          updated[index] = { ...p, label: e.target.value };
                          setEditablePeriods(updated);
                        }}
                        className="w-full sm:w-44 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="Nama JP / Kegiatan..."
                      />
                    </div>

                    {/* Kolom Jam Mulai - Jam Selesai & Delete */}
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <input
                        type="text"
                        value={p.startTime}
                        onChange={(e) => {
                          const updated = [...editablePeriods];
                          updated[index] = { ...p, startTime: e.target.value };
                          setEditablePeriods(updated);
                        }}
                        className="w-16 sm:w-20 px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-center font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="08.00"
                      />
                      <span className="text-slate-400 font-bold">-</span>
                      <input
                        type="text"
                        value={p.endTime}
                        onChange={(e) => {
                          const updated = [...editablePeriods];
                          updated[index] = { ...p, endTime: e.target.value };
                          setEditablePeriods(updated);
                        }}
                        className="w-16 sm:w-20 px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-center font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        placeholder="08.30"
                      />

                      {/* Tombol Hapus Baris */}
                      <button
                        type="button"
                        onClick={() => handleDeletePeriod(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus jam / JP ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl">
              <span className="text-[11px] text-slate-500 font-medium">
                Total: <strong>{editablePeriods.length}</strong> kegiatan ({editablePeriods.filter(p => !p.isBreak).length} JP KBM)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPeriodTimeModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSavePeriodTimes}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {applyScope === 'SINGLE_DAY'
                      ? `Simpan Khusus Hari ${selectedDay}`
                      : 'Simpan ke Semua Hari'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Slot Detail */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Ubah Jadwal KBM • {selectedDay}
                </span>
                <h3 className="font-bold text-sm text-slate-800">
                  {selectedClassObj?.name} • {selectedPeriodObj?.label} ({selectedPeriodObj?.startTime} - {selectedPeriodObj?.endTime})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Toggle Locked Slot */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-700 block">Status Slot</span>
                  <span className="text-[10px] text-slate-500">
                    {editingSlot.isLocked ? 'Slot ini dikosongkan (diarsir gelap pada presensi)' : 'Slot ini aktif memiliki guru pengampu'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingSlot(prev =>
                      prev ? { ...prev, isLocked: !prev.isLocked } : null
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    editingSlot.isLocked
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {editingSlot.isLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Dikosongkan
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" /> Aktif
                    </>
                  )}
                </button>
              </div>

              {!editingSlot.isLocked && (
                <>
                  {/* Select Teacher from Database */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Guru Pengampu (Dari Database):
                    </label>
                    <select
                      value={editingSlot.teacherId}
                      onChange={e => handleTeacherSelect(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    >
                      <option value="">-- Pilih Guru Pengampu --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          [{t.code}] {t.name} - {t.subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Name */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Mata Pelajaran (Mapel):
                    </label>
                    <input
                      type="text"
                      value={editingSlot.subject}
                      onChange={e =>
                        setEditingSlot(prev =>
                          prev ? { ...prev, subject: e.target.value } : null
                        )
                      }
                      placeholder="Masukkan nama mata pelajaran..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Simpan Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};