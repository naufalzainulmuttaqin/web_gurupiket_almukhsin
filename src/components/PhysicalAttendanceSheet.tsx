import React, { useState } from 'react';
import { AttendanceRecord, AttendanceStatus, ClassRoom, DayOfWeek, Period, ScheduleSlot, Teacher, UserRole, SchoolSettings } from '../types/piket';
import { 
  Check, 
  X, 
  Calendar, 
  Search, 
  ChevronDown, 
  FileText,
  Share2,
  Settings,
  Users
} from 'lucide-react';
import { downloadHtmlAsWord } from '../utils/wordExport';

interface PhysicalAttendanceSheetProps {
  currentDay: DayOfWeek;
  currentDate: string; // YYYY-MM-DD
  classes: ClassRoom[];
  periods: Period[];
  scheduleSlots: ScheduleSlot[];
  attendanceRecords: Record<string, AttendanceRecord>;
  teachers: Teacher[];
  userRole: UserRole;
  schoolSettings?: SchoolSettings;
  activeOfficerName?: string;
  onRequestRoleSwitch?: () => void;
  onSlotClick?: (cls: ClassRoom, period: Period, slot?: ScheduleSlot, existingRecord?: AttendanceRecord) => void;
  onUpdateAttendanceStatus: (slot: ScheduleSlot, status: AttendanceStatus, reason?: string) => void;
  onBulkMarkTeacher: (teacherId: string, status: AttendanceStatus) => void;
  onMarkAllPresent: () => void;
  onNavigateToScheduleEditor?: () => void;
  onNavigateToAIReport?: () => void;
}

export const PhysicalAttendanceSheet: React.FC<PhysicalAttendanceSheetProps> = ({
  currentDay,
  currentDate,
  classes,
  periods,
  scheduleSlots,
  attendanceRecords,
  teachers,
  userRole,
  schoolSettings,
  activeOfficerName = 'Guru Piket',
  onRequestRoleSwitch,
  onSlotClick,
  onUpdateAttendanceStatus,
  onBulkMarkTeacher,
  onMarkAllPresent,
  onNavigateToScheduleEditor,
  onNavigateToAIReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'HADIR' | 'TIDAK_HADIR'>('ALL');
  const [showOnlyTeachingToday, setShowOnlyTeachingToday] = useState(true); // Default hanya guru KBM hari ini
  const [popoverSlot, setPopoverSlot] = useState<{
    teacher: Teacher;
    slot: ScheduleSlot;
    period: Period;
    cls: ClassRoom;
    existing?: AttendanceRecord;
  } | null>(null);

  // Active teaching periods (non-break)
  const activePeriods = periods
    .filter(p => !p.isBreak)
    .sort((a, b) => a.periodNumber - b.periodNumber);

  // Slots KBM khusus hari ini yang memiliki guru pengampu
  const daySlots = scheduleSlots.filter(s => s.day === currentDay && !s.isLocked && s.teacherId);

  // Urutkan guru berdasarkan kode angka/huruf secara rapi
  const sortedTeachers = [...teachers].sort((a, b) => {
    const numA = parseInt(a.code, 10);
    const numB = parseInt(b.code, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA !== numB) return numA - numB;
      return a.code.localeCompare(b.code);
    }
    return a.code.localeCompare(b.code);
  });

  // FILTER: Hanya guru yang terjadwal mengajar di hari ini
  const filteredTeachers = sortedTeachers.filter(t => {
    const teacherDaySlots = daySlots.filter(s => s.teacherId === t.id);

    // Jika filter "Hanya Guru Mengajar Hari Ini" aktif, sembunyikan guru yang tidak punya jam KBM
    if (showOnlyTeachingToday && teacherDaySlots.length === 0) {
      return false;
    }

    const matchSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchSearch) return false;

    if (statusFilter === 'ALL') return true;

    const hasAbsent = teacherDaySlots.some(s => {
      const key = `${currentDate}_${s.classId}_${s.periodId}`;
      const rec = attendanceRecords[key];
      return rec && (rec.status === 'SAKIT' || rec.status === 'IZIN' || rec.status === 'ALPHA');
    });

    if (statusFilter === 'TIDAK_HADIR') return hasAbsent;
    if (statusFilter === 'HADIR') return !hasAbsent;

    return true;
  });

  const formatDateIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Download Word (.doc)
  const handleDownloadWord = () => {
    const tableRows = filteredTeachers.map((t, idx) => {
      const teacherSlots = daySlots.filter(s => s.teacherId === t.id);
      
      let emptyCount = 0;
      let presentCount = 0;

      const jpCells = activePeriods.map(p => {
        const slot = teacherSlots.find(s => s.periodId === p.id);
        if (!slot) {
          return `<td class="text-center bg-dark" style="background-color: #334155; color: #64748b;">-</td>`;
        }

        const key = `${currentDate}_${slot.classId}_${p.id}`;
        const rec = attendanceRecords[key];
        const status = rec?.status || 'BELUM_ABSEN';
        const cls = classes.find(c => c.id === slot.classId)?.name || '';

        if (status === 'HADIR') {
          presentCount++;
          return `<td class="text-center status-hadir" style="background-color: #ecfdf5;">&#10003;<br><small style="font-size:7pt;color:#555;">${cls}</small></td>`;
        } else if (status === 'SAKIT') {
          emptyCount++;
          return `<td class="text-center status-sakit" style="background-color: #fff1f2;"><b>S</b><br><small style="font-size:7pt;">${cls}</small></td>`;
        } else if (status === 'IZIN') {
          emptyCount++;
          return `<td class="text-center status-izin" style="background-color: #fffbeb;"><b>I</b><br><small style="font-size:7pt;">${cls}</small></td>`;
        } else if (status === 'ALPHA') {
          emptyCount++;
          return `<td class="text-center status-alpa" style="background-color: #fef2f2;"><b>A</b><br><small style="font-size:7pt;">${cls}</small></td>`;
        } else {
          return `<td class="text-center" style="background-color: #ffffff;">&#9675;<br><small style="font-size:7pt;color:#555;">${cls}</small></td>`;
        }
      }).join('');

      const kosongInfo = teacherSlots.length === 0 
        ? '-' 
        : emptyCount > 0 
        ? `<b>${emptyCount} JP Kosong</b>` 
        : `0 JP (${presentCount} Hadir)`;

      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td class="text-center"><b>${t.code}</b></td>
          <td><b>${t.name}</b><br><small style="color:#666;">${t.subject}</small></td>
          <td class="text-center">${emptyCount === 0 && teacherSlots.length > 0 ? '<span class="status-hadir">&#10003; Hadir</span>' : emptyCount > 0 ? '<span class="status-sakit">Tidak Hadir Sebagian</span>' : '-'}</td>
          ${jpCells}
          <td class="text-center">${kosongInfo}</td>
        </tr>
      `;
    }).join('');

    const schoolTitle = (schoolSettings?.subTitle || 'MADRASAH TSANAWIYAH AL-MUKHSIN').toUpperCase();
    const schoolAddress = schoolSettings?.address || 'Jl. Kauman No. 12, Cibinong, Kab. Bogor';
    const semesterInfo = `Semester ${schoolSettings?.semester || 'Ganjil'} TP ${schoolSettings?.academicYear || '2026/2027'}`;

    const htmlBody = `
      <div class="header-kop">
        <div class="kop-title">${schoolTitle}</div>
        <div class="kop-sub">DAFTAR HADIR GURU KBM HARI ${currentDay.toUpperCase()} (${semesterInfo})</div>
        <div class="kop-address">${schoolAddress}</div>
      </div>
      <p style="font-size: 11pt; margin-bottom: 8px;">
        <b>1. Hari/Tanggal/Bulan :</b> ${currentDay}, ${formatDateIndo(currentDate)}<br>
        <b>2. Daftar Hadir Guru Pengampu KBM Hari Ini</b>
      </p>
      <table>
        <thead>
          <tr>
            <th rowspan="2" style="width: 30px;">NO</th>
            <th rowspan="2" style="width: 45px;">KODE</th>
            <th rowspan="2" style="min-width: 170px;">Nama Guru</th>
            <th rowspan="2" style="width: 80px;">Ceklis Kehadiran</th>
            <th colspan="${activePeriods.length}">Ceklis / Silang Kehadiran (JP)</th>
            <th rowspan="2" style="width: 90px;">Jumlah Jam Yang Kosong</th>
          </tr>
          <tr>
            ${activePeriods.map(p => `<th style="width: 28px;">${p.periodNumber}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <div class="footer-signatures">
        <table class="sig-table">
          <tr>
            <td style="width: 60%;"></td>
            <td style="width: 40%; text-align: center;">
              Cibinong, ${formatDateIndo(currentDate)}<br>
              <b>Guru Piket Harian,</b><br><br><br><br>
              <u><b>${activeOfficerName}</b></u><br>
              Petugas Piket Madrasah
            </td>
          </tr>
        </table>
      </div>
    `;

    downloadHtmlAsWord(
      `Daftar_Hadir_Guru_${currentDay}_${currentDate}`,
      `Daftar Hadir Guru ${currentDay} - MTs Al-Mukhsin`,
      htmlBody
    );
  };

  // Hitung berapa guru yang mengajar hari ini
  const teachingTodayCount = sortedTeachers.filter(t => daySlots.some(s => s.teacherId === t.id)).length;

  return (
    <div className="space-y-4">
      {/* Top Header & Action Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              1. Hari/Tanggal/Bulan : {currentDay}, {formatDateIndo(currentDate)}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              2. Daftar Hadir Guru Mengajar
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {teachingTodayCount} Guru Terjadwal Hari {currentDay}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hanya menampilkan dewan guru yang memiliki jam KBM aktif pada hari {currentDay}.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {userRole !== 'GURU_BIASA' && (
              <button
                onClick={onMarkAllPresent}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                title="Ceklis semua guru yang mengajar hari ini sebagai Hadir"
              >
                <Check className="w-4 h-4" />
                <span>Ceklis Semua Hadir</span>
              </button>
            )}
            <button
              onClick={handleDownloadWord}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              title="Download tabel presensi ini sebagai Word (.doc)"
            >
              <FileText className="w-4 h-4" />
              <span>Download Word (.doc)</span>
            </button>
            {onNavigateToAIReport && (
              <button
                onClick={onNavigateToAIReport}
                className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Laporan AI & WA</span>
              </button>
            )}
            {onNavigateToScheduleEditor && (
              <button
                onClick={onNavigateToScheduleEditor}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Ubah Jadwal KBM</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari kode, nama guru, atau mapel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            {/* Toggle: Hanya Guru KBM Hari Ini vs Semua Guru */}
            <button
              type="button"
              onClick={() => setShowOnlyTeachingToday(!showOnlyTeachingToday)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                showOnlyTeachingToday
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{showOnlyTeachingToday ? 'Hanya Guru Hari Ini' : 'Tampilkan Semua Guru'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            <span className="text-slate-400 text-[11px] font-medium shrink-0">Filter:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({filteredTeachers.length})
            </button>
            <button
              onClick={() => setStatusFilter('HADIR')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                statusFilter === 'HADIR'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Lengkap Hadir
            </button>
            <button
              onClick={() => setStatusFilter('TIDAK_HADIR')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                statusFilter === 'TIDAK_HADIR'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Jam Kosong / Absen
            </button>
          </div>
        </div>
      </div>

      {/* The Main Physical Table */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left select-none text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b-2 border-slate-300 text-[11px] font-black uppercase tracking-wider">
                <th className="py-2.5 px-2 text-center border-r border-slate-300 w-10">NO</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-300 w-14">KODE</th>
                <th className="py-2.5 px-3 border-r border-slate-300 min-w-[180px]">Nama Guru</th>
                <th className="py-2.5 px-2 text-center border-r border-slate-300 w-28">
                  Ceklis Kehadiran
                </th>
                <th colSpan={activePeriods.length} className="py-2 px-1 text-center border-r border-slate-300 bg-emerald-50/70 text-emerald-950 font-bold">
                  Ceklis / Silang Kehadiran (JP 1 sampai {activePeriods.length})
                </th>
                <th className="py-2.5 px-3 text-center w-32 bg-slate-100 text-slate-800">
                  Jumlah Jam Yang Kosong
                </th>
              </tr>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-300 text-[11px] font-bold">
                <th className="border-r border-slate-300"></th>
                <th className="border-r border-slate-300"></th>
                <th className="border-r border-slate-300"></th>
                <th className="border-r border-slate-300"></th>
                {activePeriods.map(p => (
                  <th key={p.id} className="py-1.5 px-0.5 text-center border-r border-slate-300 w-11 font-mono text-[11px] text-slate-700 bg-emerald-50/40">
                    {p.periodNumber}
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={5 + activePeriods.length} className="text-center py-8 text-slate-400 italic">
                    Tidak ada guru yang terjadwal mengajar pada hari {currentDay}.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher, index) => {
                  const teacherSlotsToday = daySlots.filter(s => s.teacherId === teacher.id);
                  const totalSlotsScheduled = teacherSlotsToday.length;

                  let attendedCount = 0;
                  let absentCount = 0;
                  let absentType: string[] = [];

                  teacherSlotsToday.forEach(s => {
                    const key = `${currentDate}_${s.classId}_${s.periodId}`;
                    const rec = attendanceRecords[key];
                    if (rec) {
                      if (rec.status === 'HADIR') {
                        attendedCount++;
                      } else if (rec.status === 'SAKIT') {
                        absentCount++;
                        if (!absentType.includes('Sakit')) absentType.push('Sakit');
                      } else if (rec.status === 'IZIN') {
                        absentCount++;
                        if (!absentType.includes('Izin')) absentType.push('Izin');
                      } else if (rec.status === 'ALPHA') {
                        absentCount++;
                        if (!absentType.includes('Alpa')) absentType.push('Alpa');
                      }
                    }
                  });

                  const isAllPresent = totalSlotsScheduled > 0 && attendedCount === totalSlotsScheduled;

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* NO */}
                      <td className="py-2 px-2 text-center font-semibold text-slate-600 border-r border-slate-200">
                        {index + 1}
                      </td>
                      {/* KODE */}
                      <td className="py-2 px-2 text-center border-r border-slate-200 font-mono font-bold text-slate-800 bg-slate-50/50">
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-200/80 text-slate-800 text-xs">
                          {teacher.code}
                        </span>
                      </td>
                      {/* NAMA GURU */}
                      <td className="py-2 px-3 border-r border-slate-200">
                        <div className="font-bold text-slate-900 text-xs leading-tight">
                          {teacher.name}
                        </div>
                        <div className="text-[10px] text-slate-500 leading-normal flex items-center gap-1.5 mt-0.5">
                          <span>{teacher.subject}</span>
                          {totalSlotsScheduled > 0 && (
                            <span className="text-[9px] px-1 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                              {totalSlotsScheduled} JP Hari Ini
                            </span>
                          )}
                        </div>
                      </td>
                      {/* CEKLIS KEHADIRAN */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        {totalSlotsScheduled === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">Libur / No JP</span>
                        ) : userRole === 'GURU_BIASA' ? (
                          <div className="flex justify-center">
                            {isAllPresent ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                <Check className="w-3 h-3" /> Hadir
                              </span>
                            ) : absentCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                {absentType.join('/')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Belum Absen</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onBulkMarkTeacher(teacher.id, 'HADIR')}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                isAllPresent 
                                  ? 'bg-emerald-600 text-white shadow-xs' 
                                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                              }`}
                              title="Tandai semua jam mengajar guru ini sebagai Hadir"
                            >
                              <Check className="w-3 h-3" />
                              <span>Hadir</span>
                            </button>
                            <div className="relative group">
                              <button
                                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200 cursor-pointer"
                                title="Ubah status tidak hadir (Sakit / Izin / Alpa)"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              <div className="absolute left-0 top-full mt-1 hidden group-hover:flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 min-w-[110px]">
                                <button
                                  onClick={() => onBulkMarkTeacher(teacher.id, 'SAKIT')}
                                  className="px-2.5 py-1 text-left text-[11px] font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span className="w-3.5 h-3.5 rounded bg-rose-100 text-rose-800 flex items-center justify-center text-[9px]">S</span>
                                  Sakit
                                </button>
                                <button
                                  onClick={() => onBulkMarkTeacher(teacher.id, 'IZIN')}
                                  className="px-2.5 py-1 text-left text-[11px] font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span className="w-3.5 h-3.5 rounded bg-amber-100 text-amber-800 flex items-center justify-center text-[9px]">I</span>
                                  Izin
                                </button>
                                <button
                                  onClick={() => onBulkMarkTeacher(teacher.id, 'ALPHA')}
                                  className="px-2.5 py-1 text-left text-[11px] font-bold text-red-700 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span className="w-3.5 h-3.5 rounded bg-red-100 text-red-800 flex items-center justify-center text-[9px]">A</span>
                                  Tanpa Kabar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* JP 1 TO JP N */}
                      {activePeriods.map(period => {
                        const slot = teacherSlotsToday.find(s => s.periodId === period.id);
                        if (!slot) {
                          // Arsir gelap (Tidak Ada JP)
                          return (
                            <td
                              key={period.id}
                              className="p-0 border-r border-slate-700/60 bg-slate-900 cursor-not-allowed select-none group relative"
                              title={`Tidak ada jam mengajar untuk ${teacher.name} di JP ${period.periodNumber}.`}
                            >
                              <div className="w-full h-10 sm:h-11 flex items-center justify-center bg-[linear-gradient(45deg,rgba(51,65,85,0.7)_25%,transparent_25%,transparent_50%,rgba(51,65,85,0.7)_50%,rgba(51,65,85,0.7)_75%,transparent_75%,transparent)] bg-[length:8px_8px]">
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-mono text-slate-400 bg-slate-950/80 px-1 py-0.5 rounded">
                                  Kosong
                                </span>
                              </div>
                            </td>
                          );
                        }

                        const key = `${currentDate}_${slot.classId}_${period.id}`;
                        const rec = attendanceRecords[key];
                        const status = rec?.status || 'BELUM_ABSEN';
                        const cls = classes.find(c => c.id === slot.classId);

                        let badgeColor = 'bg-white text-slate-400 hover:bg-slate-50 border-slate-200';
                        let symbol = '○';
                        if (status === 'HADIR') {
                          badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black';
                          symbol = '✓';
                        } else if (status === 'SAKIT') {
                          badgeColor = 'bg-rose-100 text-rose-900 border-rose-400 font-black';
                          symbol = 'S';
                        } else if (status === 'IZIN') {
                          badgeColor = 'bg-amber-100 text-amber-900 border-amber-400 font-black';
                          symbol = 'I';
                        } else if (status === 'ALPHA') {
                          badgeColor = 'bg-red-100 text-red-900 border-red-400 font-black';
                          symbol = 'A';
                        } else if (status === 'TUGAS') {
                          badgeColor = 'bg-purple-100 text-purple-900 border-purple-400 font-black';
                          symbol = 'T';
                        }

                        return (
                          <td
                            key={period.id}
                            className={`p-0.5 text-center border-r border-slate-300 transition-colors ${
                              userRole !== 'GURU_BIASA' ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400 hover:z-10' : ''
                            }`}
                            onClick={() => {
                              if (userRole === 'GURU_BIASA') {
                                if (onRequestRoleSwitch) onRequestRoleSwitch();
                                return;
                              }
                              setPopoverSlot({
                                teacher,
                                slot,
                                period,
                                cls: cls!,
                                existing: rec,
                              });
                            }}
                          >
                            <div className={`w-full h-10 sm:h-11 rounded-lg border flex flex-col items-center justify-center transition ${badgeColor}`}>
                              <span className="text-xs sm:text-sm font-black leading-none">{symbol}</span>
                              <span className="text-[8px] font-bold opacity-80 mt-0.5 tracking-tight">
                                {cls?.name || 'Kls'}
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      {/* JUMLAH JAM YANG KOSONG */}
                      <td className="py-2 px-3 text-center border-l border-slate-200">
                        {totalSlotsScheduled === 0 ? (
                          <span className="text-slate-400 text-xs">-</span>
                        ) : absentCount > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-xs">
                              {absentCount} JP Kosong
                            </span>
                            <span className="text-[9px] text-rose-600 font-medium mt-0.5">
                              ({absentType.join(', ')})
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                            0 Jam (Lengkap)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              Cibinong, <strong>{formatDateIndo(currentDate)}</strong>
            </span>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-[11px] text-slate-500 font-medium">Petugas Guru Piket Harian:</div>
            <div className="text-sm font-bold text-slate-900">{activeOfficerName}</div>
            <div className="text-[10px] text-emerald-700 font-medium">MTs Al-Mukhsin Cibinong</div>
          </div>
        </div>
      </div>

      {/* Quick Action Popover Modal */}
      {popoverSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Presensi KBM • JP {popoverSlot.period.periodNumber} ({popoverSlot.period.startTime} - {popoverSlot.period.endTime})
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  {popoverSlot.cls.name} • {popoverSlot.teacher.name}
                </h3>
              </div>
              <button
                onClick={() => setPopoverSlot(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Mata Pelajaran: <strong>{popoverSlot.slot.subject || popoverSlot.teacher.subject}</strong>
            </p>
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase">
                Ubah Status Kehadiran:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onUpdateAttendanceStatus(popoverSlot.slot, 'HADIR');
                    setPopoverSlot(null);
                  }}
                  className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                  <span>Hadir (✓)</span>
                </button>
                <button
                  onClick={() => {
                    onUpdateAttendanceStatus(popoverSlot.slot, 'SAKIT', 'Sakit');
                    setPopoverSlot(null);
                  }}
                  className="p-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">S</span>
                  <span>Sakit (S)</span>
                </button>
                <button
                  onClick={() => {
                    onUpdateAttendanceStatus(popoverSlot.slot, 'IZIN', 'Izin urusan dinas / keluarga');
                    setPopoverSlot(null);
                  }}
                  className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">I</span>
                  <span>Izin (I)</span>
                </button>
                <button
                  onClick={() => {
                    onUpdateAttendanceStatus(popoverSlot.slot, 'ALPHA', 'Tanpa Keterangan');
                    setPopoverSlot(null);
                  }}
                  className="p-2.5 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-900 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">A</span>
                  <span>Tanpa Kabar (A)</span>
                </button>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {onSlotClick && (
                <button
                  onClick={() => {
                    const { cls, period, slot, existing } = popoverSlot;
                    setPopoverSlot(null);
                    onSlotClick(cls, period, slot, existing);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Form Lengkap & Guru Inval →</span>
                </button>
              )}
              <button
                onClick={() => setPopoverSlot(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer ml-auto"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
