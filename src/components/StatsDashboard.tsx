import React, { useState } from 'react';
import { AttendanceRecord, PiketReportRecord, Teacher } from '../types/piket';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  FileText, 
  Copy, 
  Check, 
  Calendar, 
  History,
  ShieldCheck,
  Send
} from 'lucide-react';

interface StatsDashboardProps {
  attendanceRecords: Record<string, AttendanceRecord>;
  reportHistory: PiketReportRecord[];
  teachers: Teacher[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  attendanceRecords,
  reportHistory,
  teachers,
}) => {
  const [selectedReport, setSelectedReport] = useState<PiketReportRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allRecords = Object.values(attendanceRecords);

  const totalLogs = allRecords.length;
  const hadirCount = allRecords.filter(r => r.status === 'HADIR').length;
  const izinCount = allRecords.filter(r => r.status === 'IZIN').length;
  const sakitCount = allRecords.filter(r => r.status === 'SAKIT').length;
  const tugasCount = allRecords.filter(r => r.status === 'TUGAS').length;

  const attendanceRate = totalLogs > 0 ? Math.round((hadirCount / totalLogs) * 100) : 100;

  // Teacher absence frequency ranking
  const teacherAbsenceMap: Record<string, { code: string; name: string; count: number; invalCount: number }> = {};

  teachers.forEach(t => {
    teacherAbsenceMap[t.id] = { code: t.code, name: t.name, count: 0, invalCount: 0 };
  });

  allRecords.forEach(r => {
    if (r.status !== 'HADIR' && r.status !== 'BELUM_ABSEN' && teacherAbsenceMap[r.teacherId]) {
      teacherAbsenceMap[r.teacherId].count++;
    }
    if (r.invalTeacherId && teacherAbsenceMap[r.invalTeacherId]) {
      teacherAbsenceMap[r.invalTeacherId].invalCount++;
    }
  });

  const sortedAbsences = Object.values(teacherAbsenceMap)
    .filter(t => t.count > 0 || t.invalCount > 0)
    .sort((a, b) => b.count - a.count);

  const handleCopyHistory = async (report: PiketReportRecord) => {
    await navigator.clipboard.writeText(report.reportText);
    setCopiedId(report.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareHistoryToWhatsApp = (text: string) => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{attendanceRate}%</div>
            <div className="text-xs text-slate-500 font-medium">Rata-rata Kehadiran Guru</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{izinCount + sakitCount + tugasCount}</div>
            <div className="text-xs text-slate-500 font-medium">Jam Didampingi Guru Piket</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{teachers.length}</div>
            <div className="text-xs text-slate-500 font-medium">Database Dewan Guru Aktif</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{reportHistory.length}</div>
            <div className="text-xs text-slate-500 font-medium">Laporan AI Tersimpan</div>
          </div>
        </div>
      </div>

      {/* Grid: Teacher Absences & Inval Contribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Inval & Absence Logs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Rekap Kehadiran Guru & Pendampingan Piket</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <th className="py-2.5 px-3">Nama Guru</th>
                  <th className="py-2.5 px-3 text-center">Jam Izin/Sakit</th>
                  <th className="py-2.5 px-3 text-center">Mendampingi Piket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedAbsences.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400">
                      Belum ada catatan ketidakhadiran tercatat.
                    </td>
                  </tr>
                ) : (
                  sortedAbsences.slice(0, 8).map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-100 border border-slate-300 text-slate-700">
                          {t.code}
                        </span>
                        <span>{t.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${t.count > 0 ? 'bg-amber-100 text-amber-800' : 'text-slate-400'}`}>
                          {t.count} JP
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold ${t.invalCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'text-slate-400'}`}>
                          {t.invalCount} Kali
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Saved AI Reports History */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <span>Riwayat Laporan Piket AI Tersimpan</span>
          </h3>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {reportHistory.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada riwayat laporan yang dibuat.
              </div>
            ) : (
              reportHistory.map(report => (
                <div
                  key={report.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 transition bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700">
                      {report.day}, {report.date}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(report.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 font-mono">
                    {report.reportText}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">
                      Petugas: {report.officers?.join(', ') || 'Guru Piket'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyHistory(report)}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold flex items-center gap-1"
                      >
                        {copiedId === report.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === report.id ? 'Disalin' : 'Salin'}</span>
                      </button>

                      <button
                        onClick={() => handleShareHistoryToWhatsApp(report.reportText)}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Kirim WA</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
