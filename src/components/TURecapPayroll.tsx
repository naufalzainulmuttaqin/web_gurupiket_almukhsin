import React, { useState, useMemo } from 'react';
import { AttendanceRecord, ClassRoom, DayOfWeek, Period, ScheduleSlot, Teacher, UserRole, SchoolSettings } from '../types/piket';
import { 
  FileText, 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  UserX, 
  ShieldCheck, 
  Users, 
  Filter,
  Download,
  BookOpen,
  Lock,
  ArrowRight
} from 'lucide-react';
import { downloadHtmlAsWord } from '../utils/wordExport';

interface TURecapPayrollProps {
  teachers: Teacher[];
  scheduleSlots: ScheduleSlot[];
  periods: Period[];
  classes: ClassRoom[];
  attendanceRecords: Record<string, AttendanceRecord>;
  userRole: UserRole;
  schoolSettings?: SchoolSettings;
  onRequestRoleSwitch?: () => void;
}

export const TURecapPayroll: React.FC<TURecapPayrollProps> = ({
  teachers,
  scheduleSlots,
  periods,
  classes,
  attendanceRecords,
  userRole,
  schoolSettings,
  onRequestRoleSwitch,
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAKIT' | 'IZIN' | 'ALPHA' | 'TUGAS'>('ALL');
  const [searchTeacher, setSearchTeacher] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  const monthsList = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  // Restrict access: strictly for ADMIN
  if (userRole !== 'ADMIN') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto shadow-sm my-10 space-y-4">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Akses Khusus Administrator & Tata Usaha</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Menu Rekapitulasi Ketidakhadiran & Penggantian (Inval) ini dirancang khusus untuk verifikasi berkas Tata Usaha (TU). Guru Mapel dan Petugas Piket tidak diizinkan mengakses halaman ini.
        </p>
        {onRequestRoleSwitch && (
          <button
            onClick={onRequestRoleSwitch}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <span>Masuk Sebagai Admin</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Filter records that are in the selected month & year and have absent status
  const absenceRecords = useMemo(() => {
    const list: (AttendanceRecord & { periodObj?: Period; classObj?: ClassRoom })[] = [];

    const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    Object.entries(attendanceRecords).forEach(([key, rec]) => {
      if (!rec.date.startsWith(monthPrefix)) return;

      // Only absent / sick / permit / alpha / tugas
      if (['SAKIT', 'IZIN', 'ALPHA', 'TUGAS'].includes(rec.status)) {
        const periodObj = periods.find(p => p.id === rec.periodId);
        const classObj = classes.find(c => c.id === rec.classId);

        list.push({
          ...rec,
          periodObj,
          classObj,
        });
      }
    });

    // Sort by date ascending, then period number
    return list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const aNum = a.periodObj?.periodNumber || 0;
      const bNum = b.periodObj?.periodNumber || 0;
      return aNum - bNum;
    });
  }, [attendanceRecords, selectedMonth, selectedYear, periods, classes]);

  // Filtered view
  const filteredList = useMemo(() => {
    return absenceRecords.filter(rec => {
      // Status filter
      if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;

      // Class filter
      if (selectedClassFilter !== 'ALL' && rec.classId !== selectedClassFilter) return false;

      // Teacher search
      if (searchTeacher.trim()) {
        const q = searchTeacher.toLowerCase();
        const matchesTeacher = rec.teacherName.toLowerCase().includes(q) || (rec.teacherCode && rec.teacherCode.toLowerCase().includes(q));
        const matchesInval = rec.invalTeacherName?.toLowerCase().includes(q) || (rec.invalTeacherCode && rec.invalTeacherCode.toLowerCase().includes(q));
        const matchesSubject = rec.subject.toLowerCase().includes(q);
        if (!matchesTeacher && !matchesInval && !matchesSubject) return false;
      }

      return true;
    });
  }, [absenceRecords, statusFilter, selectedClassFilter, searchTeacher]);

  // Aggregate stats per teacher for the selected month
  const teacherAbsenceSummary = useMemo(() => {
    const map = new Map<string, {
      teacherName: string;
      teacherCode?: string;
      subject: string;
      sakitCount: number;
      izinCount: number;
      alphaCount: number;
      tugasCount: number;
      totalJP: number;
    }>();

    absenceRecords.forEach(rec => {
      const key = rec.teacherId || rec.teacherName;
      const existing = map.get(key) || {
        teacherName: rec.teacherName,
        teacherCode: rec.teacherCode,
        subject: rec.subject,
        sakitCount: 0,
        izinCount: 0,
        alphaCount: 0,
        tugasCount: 0,
        totalJP: 0,
      };

      if (rec.status === 'SAKIT') existing.sakitCount += 1;
      else if (rec.status === 'IZIN') existing.izinCount += 1;
      else if (rec.status === 'ALPHA') existing.alphaCount += 1;
      else if (rec.status === 'TUGAS') existing.tugasCount += 1;

      existing.totalJP += 1;
      map.set(key, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.totalJP - a.totalJP);
  }, [absenceRecords]);

  // Total metrics
  const totalAbsenceJP = absenceRecords.length;
  const totalSakit = absenceRecords.filter(r => r.status === 'SAKIT').length;
  const totalIzin = absenceRecords.filter(r => r.status === 'IZIN').length;
  const totalAlpha = absenceRecords.filter(r => r.status === 'ALPHA').length;
  const totalReplacedByPiket = absenceRecords.filter(r => Boolean(r.invalTeacherName || r.invalTeacherId)).length;

  const currentMonthName = monthsList.find(m => m.value === selectedMonth)?.label || 'Bulan Ini';

  // Export to Word (.doc) for TU
  const handleExportWord = () => {
    const schoolName = schoolSettings?.schoolName || 'MTs Al-Mukhsin';
    const subTitle = schoolSettings?.subTitle || 'Madrasah Tsanawiyah Al-Mukhsin Cibinong';
    const semester = schoolSettings?.semester || 'Ganjil';
    const academicYear = schoolSettings?.academicYear || '2025/2026';
    const headmaster = schoolSettings?.headmasterName || 'Drs. H. Ahmad Fauzi, M.Pd.I';
    const headmasterNip = schoolSettings?.headmasterNip || '197104121998031002';
    const tuHead = schoolSettings?.tuHeadName || 'Syaipul Yusuf, S.Kom';

    let tableRows = '';
    filteredList.forEach((r, idx) => {
      const invalText = r.invalTeacherName 
        ? `${r.invalTeacherName} (${r.invalTeacherCode || 'Piket'})`
        : (r.isTaskDelivered ? 'Tugas Mandiri di Kelas' : 'Belum Ditunjuk / Mandiri');

      tableRows += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center;">${r.date} (${r.day})</td>
          <td style="text-align: center;">${r.periodObj?.label || r.periodId}</td>
          <td style="text-align: center; font-weight: bold;">${r.classObj?.name || r.classId}</td>
          <td><b>${r.teacherName}</b> [${r.teacherCode || '-'}]</td>
          <td>${r.subject}</td>
          <td style="text-align: center; font-weight: bold;">
            ${r.status} ${r.reason ? `<br/><i style="font-weight: normal; font-size: 9pt;">(${r.reason})</i>` : ''}
          </td>
          <td><b>${invalText}</b></td>
          <td>${r.taskDescription || r.notes || '-'}</td>
        </tr>
      `;
    });

    if (filteredList.length === 0) {
      tableRows = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 20px; font-style: italic;">
            Nihil. Tidak ada catatan ketidakhadiran guru pada filter periode ini.
          </td>
        </tr>
      `;
    }

    let summaryRows = '';
    teacherAbsenceSummary.forEach((t, idx) => {
      summaryRows += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><b>${t.teacherName}</b></td>
          <td style="text-align: center;">${t.teacherCode || '-'}</td>
          <td>${t.subject}</td>
          <td style="text-align: center;">${t.sakitCount}</td>
          <td style="text-align: center;">${t.izinCount}</td>
          <td style="text-align: center;">${t.alphaCount}</td>
          <td style="text-align: center; font-weight: bold; background-color: #f1f5f9;">${t.totalJP} JP</td>
        </tr>
      `;
    });

    const htmlContent = `
      <div class="header-kop">
        <div class="kop-title">${subTitle.toUpperCase()}</div>
        <div class="kop-sub">REKAPITULASI KETIDAKHADIRAN GURU & GURU PENGGANTI (INVAL) PIKET</div>
        <div class="kop-address">
          Bulan: ${currentMonthName} ${selectedYear} • Semester: ${semester} TP ${academicYear}<br/>
          Bagian Tata Usaha (TU) Administrasi Madrasah
        </div>
      </div>

      <h3 style="font-size: 11pt; margin-top: 15px; margin-bottom: 5px; font-family: 'Calibri', sans-serif;">
        A. DAFTAR KETIDAKHADIRAN & PENGGANTIAN GURU (INVAL)
      </h3>
      <table class="report-table">
        <thead>
          <tr>
            <th style="width: 4%;">No</th>
            <th style="width: 12%;">Tanggal & Hari</th>
            <th style="width: 8%;">JP</th>
            <th style="width: 8%;">Kelas</th>
            <th style="width: 18%;">Guru Berhalangan</th>
            <th style="width: 14%;">Mata Pelajaran</th>
            <th style="width: 12%;">Status</th>
            <th style="width: 14%;">Guru Piket Pengganti (Inval)</th>
            <th style="width: 10%;">Ket. Tugas</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <h3 style="font-size: 11pt; margin-top: 25px; margin-bottom: 5px; font-family: 'Calibri', sans-serif;">
        B. REKAPITULASI FREKUENSI KETIDAKHADIRAN PER GURU (${currentMonthName} ${selectedYear})
      </h3>
      <table class="report-table">
        <thead>
          <tr>
            <th style="width: 5%;">No</th>
            <th style="width: 25%;">Nama Guru</th>
            <th style="width: 10%;">Kode</th>
            <th style="width: 20%;">Mata Pelajaran</th>
            <th style="width: 10%;">Sakit (JP)</th>
            <th style="width: 10%;">Izin (JP)</th>
            <th style="width: 10%;">Alpha (JP)</th>
            <th style="width: 10%;">Total Tidak Hadir</th>
          </tr>
        </thead>
        <tbody>
          ${summaryRows}
        </tbody>
      </table>

      <div class="footer-signatures" style="margin-top: 35px;">
        <table class="sig-table">
          <tr>
            <td style="width: 50%; text-align: center;">
              Mengetahui,<br/>
              <b>Kepala Madrasah</b><br/><br/><br/><br/>
              <u><b>${headmaster}</b></u><br/>
              NIP. ${headmasterNip}
            </td>
            <td style="width: 50%; text-align: center;">
              Cibinong, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
              <b>Kepala Bagian Tata Usaha</b><br/><br/><br/><br/>
              <u><b>${tuHead}</b></u>
            </td>
          </tr>
        </table>
      </div>
    `;

    downloadHtmlAsWord(
      `Rekap_TU_Ketidakhadiran_${currentMonthName}_${selectedYear}`,
      `Rekap Ketidakhadiran TU ${currentMonthName} ${selectedYear}`,
      htmlContent
    );
  };

  // Export to CSV / Spreadsheet
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'No,Tanggal,Hari,JP,Kelas,Kode Guru,Nama Guru,Mata Pelajaran,Status,Alasan,Guru Pengganti Inval,Kode Inval,Keterangan Tugas\n';

    filteredList.forEach((r, idx) => {
      const row = [
        idx + 1,
        `"${r.date}"`,
        `"${r.day}"`,
        `"${r.periodObj?.label || r.periodId}"`,
        `"${r.classObj?.name || r.classId}"`,
        `"${r.teacherCode || ''}"`,
        `"${r.teacherName.replace(/"/g, '""')}"`,
        `"${r.subject.replace(/"/g, '""')}"`,
        `"${r.status}"`,
        `"${(r.reason || '').replace(/"/g, '""')}"`,
        `"${(r.invalTeacherName || '').replace(/"/g, '""')}"`,
        `"${r.invalTeacherCode || ''}"`,
        `"${(r.taskDescription || r.notes || '').replace(/"/g, '""')}"`,
      ];
      csvContent += row.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_TU_Absensi_Guru_${currentMonthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-emerald-900/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Khusus Tata Usaha & Admin
              </span>
              <span className="bg-slate-800 text-slate-300 text-[11px] font-medium px-2 py-0.5 rounded-full">
                Semester {schoolSettings?.semester || 'Ganjil'} {schoolSettings?.academicYear || '2025/2026'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              Rekap Ketidakhadiran & Guru Pengganti (Inval)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Laporan resmi untuk bagian Tata Usaha (TU) mengenai guru yang berhalangan hadir (Sakit, Izin, Alpha) serta penugasan Guru Piket / Pengganti di kelas.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportWord}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
              title="Download Berkas Resmi TU (.doc)"
            >
              <FileText className="w-4 h-4" />
              <span>Download Word (.doc)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
              title="Export Tabel Spreadsheet (.csv)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Jam Tidak Hadir</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">
            {totalAbsenceJP} <span className="text-xs font-bold text-slate-400">JP</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Pada {currentMonthName} {selectedYear}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sakit / Izin</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {totalSakit + totalIzin} <span className="text-xs font-bold text-slate-400">JP</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sakit: {totalSakit} | Izin: {totalIzin}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tanpa Kabar (Alpha)</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">
            {totalAlpha} <span className="text-xs font-bold text-slate-400">JP</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Perlu konfirmasi piket/TU</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Digantikan Guru Piket</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {totalReplacedByPiket} <span className="text-xs font-bold text-slate-400">JP</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Didampingi guru piket (inval)</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {monthsList.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer ml-1"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-slate-50 text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>Kelas {c.name}</option>
              ))}
            </select>
          </div>

          {/* Teacher Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTeacher}
              onChange={(e) => setSearchTeacher(e.target.value)}
              placeholder="Cari guru berhalangan / piket..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition"
            />
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {(['ALL', 'SAKIT', 'IZIN', 'ALPHA', 'TUGAS'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'Semua Berhalangan' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table: Absenteeism & Piket Replacement */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Rincian Guru Tidak Hadir & Guru Pengganti (Inval)
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredList.length} catatan jam pelajaran tidak hadir pada {currentMonthName} {selectedYear}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5 text-center w-12">No</th>
                <th className="py-3 px-3">Tanggal / Hari</th>
                <th className="py-3 px-3 text-center">JP</th>
                <th className="py-3 px-3 text-center">Kelas</th>
                <th className="py-3 px-3.5">Guru Berhalangan</th>
                <th className="py-3 px-3">Mata Pelajaran</th>
                <th className="py-3 px-3 text-center">Status & Alasan</th>
                <th className="py-3 px-3.5">Guru Pengganti (Inval)</th>
                <th className="py-3 px-3.5">Keterangan / Tugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <div className="font-bold text-slate-700">Tidak ada catatan ketidakhadiran</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Seluruh guru hadir sesuai jadwal pada kriteria filter yang dipilih.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((rec, idx) => {
                  const statusBadgeColor = 
                    rec.status === 'SAKIT' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                    rec.status === 'IZIN' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    rec.status === 'ALPHA' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                    'bg-purple-100 text-purple-800 border-purple-200';

                  return (
                    <tr key={`${rec.date}_${rec.classId}_${rec.periodId}`} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3.5 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                        <div>{rec.date}</div>
                        <span className="text-[10px] text-slate-400">{rec.day}</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {rec.periodObj?.label || rec.periodId}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {rec.periodObj?.startTime} - {rec.periodObj?.endTime}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-200">
                          {rec.classObj?.name || rec.classId}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{rec.teacherName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                            Kode: {rec.teacherCode || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {rec.subject}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeColor}`}>
                          {rec.status}
                        </span>
                        {rec.reason && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5 max-w-[140px] truncate mx-auto" title={rec.reason}>
                            "{rec.reason}"
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        {rec.invalTeacherName ? (
                          <div>
                            <span className="font-bold text-emerald-800">{rec.invalTeacherName}</span>
                            <div className="text-[10px] text-emerald-600">
                              Kode Inval: {rec.invalTeacherCode || 'Guru Piket'}
                            </div>
                          </div>
                        ) : rec.isTaskDelivered ? (
                          <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                            Tugas Mandiri
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Tidak ada guru pengganti
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 max-w-xs">
                        {rec.taskDescription ? (
                          <div className="truncate" title={rec.taskDescription}>
                            {rec.taskDescription}
                          </div>
                        ) : rec.notes ? (
                          <div className="truncate text-slate-500" title={rec.notes}>
                            {rec.notes}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary per Teacher Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            Akumulasi Frekuensi Ketidakhadiran per Guru ({currentMonthName} {selectedYear})
          </h3>
          <p className="text-xs text-slate-500">
            Daftar guru yang tercatat memiliki jam tidak hadir dalam periode bulan ini
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">No</th>
                <th className="py-2.5 px-3.5">Nama Guru</th>
                <th className="py-2.5 px-3 text-center">Kode</th>
                <th className="py-2.5 px-3.5">Mata Pelajaran</th>
                <th className="py-2.5 px-3 text-center">Sakit (JP)</th>
                <th className="py-2.5 px-3 text-center">Izin (JP)</th>
                <th className="py-2.5 px-3 text-center">Alpha (JP)</th>
                <th className="py-2.5 px-3.5 text-center">Total Tidak Hadir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teacherAbsenceSummary.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nihil. Tidak ada guru yang berhalangan hadir pada bulan ini.
                  </td>
                </tr>
              ) : (
                teacherAbsenceSummary.map((t, idx) => (
                  <tr key={t.teacherName} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3.5 font-bold text-slate-800">{t.teacherName}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">
                      {t.teacherCode || '-'}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600">{t.subject}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-amber-700">{t.sakitCount}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-blue-700">{t.izinCount}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-rose-700">{t.alphaCount}</td>
                    <td className="py-2.5 px-3.5 text-center font-black text-rose-800 bg-rose-50/40">
                      {t.totalJP} JP
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
