import React, { useState, useEffect } from 'react';
import { AttendanceRecord, AttendanceStatus, ClassRoom, Period, PiketOfficer, Teacher } from '../types/piket';
import { getTeacherColor } from '../utils/defaultData';
import { CheckCircle2, AlertCircle, Clock, BookOpen, User, FileText, Check, X, Shield, ArrowRight, Phone, UserCheck } from 'lucide-react';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: ClassRoom | null;
  selectedPeriod: Period | null;
  assignedTeacher: Teacher | null;
  subjectName: string;
  existingRecord?: AttendanceRecord;
  teachers: Teacher[];
  piketOfficers?: string[];
  piketOfficersList?: PiketOfficer[];
  onSaveAttendance: (record: Partial<AttendanceRecord>) => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  selectedClass,
  selectedPeriod,
  assignedTeacher,
  subjectName,
  existingRecord,
  teachers,
  piketOfficers = [],
  piketOfficersList = [],
  onSaveAttendance,
}) => {
  const [status, setStatus] = useState<AttendanceStatus>('HADIR');
  const [reason, setReason] = useState('');
  const [selectedPiketTeacherId, setSelectedPiketTeacherId] = useState('');
  const [customPiketOfficerName, setCustomPiketOfficerName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [isTaskDelivered, setIsTaskDelivered] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingRecord) {
      setStatus(existingRecord.status);
      setReason(existingRecord.reason || '');
      setSelectedPiketTeacherId(existingRecord.invalTeacherId || '');
      setCustomPiketOfficerName(existingRecord.invalTeacherName || '');
      setTaskDescription(existingRecord.taskDescription || '');
      setIsTaskDelivered(!!existingRecord.isTaskDelivered);
      setNotes(existingRecord.notes || '');
    } else {
      setStatus('HADIR');
      setReason('');
      // Default to the first piket officer if available
      const defaultPiketName = piketOfficers.length > 0 ? piketOfficers[0] : '';
      const matchedTeacher = teachers.find(t => t.name.toLowerCase().includes(defaultPiketName.toLowerCase()));
      setSelectedPiketTeacherId(matchedTeacher ? matchedTeacher.id : 'OFFICER_DEFAULT');
      setCustomPiketOfficerName(defaultPiketName || 'Guru Piket Bertugas');
      setTaskDescription('');
      setIsTaskDelivered(false);
      setNotes('');
    }
  }, [existingRecord, isOpen, piketOfficers]);

  if (!isOpen || !selectedClass || !selectedPeriod) return null;

  const handleSave = () => {
    const selectedTeacherObj = teachers.find(t => t.id === selectedPiketTeacherId);
    let resolvedPiketName = '';
    let resolvedPiketCode: string | undefined = undefined;

    if (selectedTeacherObj) {
      resolvedPiketName = selectedTeacherObj.name;
      resolvedPiketCode = selectedTeacherObj.code;
    } else if (customPiketOfficerName.trim()) {
      resolvedPiketName = customPiketOfficerName.trim();
    } else if (piketOfficers.length > 0) {
      resolvedPiketName = piketOfficers[0];
    } else {
      resolvedPiketName = 'Guru Piket';
    }

    onSaveAttendance({
      classId: selectedClass.id,
      periodId: selectedPeriod.id,
      teacherId: assignedTeacher?.id || '',
      teacherCode: assignedTeacher?.code,
      teacherName: assignedTeacher?.name || 'Guru Pengampu',
      subject: subjectName || assignedTeacher?.subject || '',
      status,
      reason: status !== 'HADIR' ? reason : undefined,
      invalTeacherId: status !== 'HADIR' && selectedPiketTeacherId !== 'OTHER' ? selectedPiketTeacherId : undefined,
      invalTeacherCode: status !== 'HADIR' ? resolvedPiketCode : undefined,
      invalTeacherName: status !== 'HADIR' ? resolvedPiketName : undefined,
      taskDescription: status !== 'HADIR' ? taskDescription : undefined,
      isTaskDelivered: status !== 'HADIR' ? isTaskDelivered : false,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const isAbsent = status !== 'HADIR' && status !== 'BELUM_ABSEN';
  const color = getTeacherColor(assignedTeacher?.code);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Presensi KBM & Pengawasan Piket
              </span>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                Kelas {selectedClass.name}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-800 mt-1 flex items-center gap-2">
              <span>{selectedPeriod.label}</span>
              <span className="text-xs font-medium text-slate-500">
                ({selectedPeriod.startTime} - {selectedPeriod.endTime})
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Teacher Identity & Subject Card with Code Badge */}
        <div className="my-4 p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Prominent Code Badge */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-base border shadow-xs ${color.bg} ${color.text} ${color.border}`}>
                {assignedTeacher?.code || '?'}
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <span>Guru Terjadwal (Kode: {assignedTeacher?.code || '-'})</span>
                </div>
                <div className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                  {assignedTeacher?.name || 'Belum Ada Guru'}
                </div>
                <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 mt-0.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{subjectName || assignedTeacher?.subject || 'Mata Pelajaran'}</span>
                </div>
              </div>
            </div>

            {assignedTeacher?.phone && (
              <a
                href={`https://wa.me/${assignedTeacher.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition"
                title="Hubungi via WhatsApp"
              >
                <Phone className="w-3 h-3 text-emerald-600" />
                <span>WA Guru</span>
              </a>
            )}
          </div>

          {assignedTeacher?.nip && (
            <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
              NIP: {assignedTeacher.nip}
            </div>
          )}
        </div>

        {/* Attendance Status Selector */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Status Kehadiran Guru Pengampu:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setStatus('HADIR')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  status === 'HADIR'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/30'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Hadir</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('IZIN')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  status === 'IZIN'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>Izin</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('SAKIT')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  status === 'SAKIT'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md ring-2 ring-rose-500/30'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>Sakit</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('TUGAS')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  status === 'TUGAS'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/30'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Tugas</span>
              </button>
            </div>
          </div>

          {/* Absence Fields: Reason, Guru Piket Pendamping, Task */}
          {isAbsent && (
            <div className="space-y-3.5 p-4 rounded-xl bg-amber-50/70 border border-amber-200 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5 pb-1 border-b border-amber-200/60">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>Penugasan & Tanggung Jawab Guru Piket di Kelas</span>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Keterangan / Alasan Ketidakhadiran Guru *
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Contoh: Rapat Dinas Kemenag, Sakit flu/demam, Izin ada keperluan keluarga"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Guru Piket Responsible Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Guru Piket yang Bertanggung Jawab Mendampingi Kelas: *</span>
                  <span className="text-[10px] text-emerald-700 font-semibold lowercase">
                    (tanggung jawab guru piket)
                  </span>
                </label>

                <select
                  value={selectedPiketTeacherId}
                  onChange={e => {
                    setSelectedPiketTeacherId(e.target.value);
                    const matchedOfficer = piketOfficersList.find(o => o.id === e.target.value);
                    if (matchedOfficer) {
                      setCustomPiketOfficerName(matchedOfficer.name);
                      return;
                    }
                    const t = teachers.find(item => item.id === e.target.value);
                    if (t) setCustomPiketOfficerName(t.name);
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                >
                  {/* Dedicated Piket Officers from Database Guru Piket */}
                  {piketOfficersList.length > 0 && (
                    <optgroup label="🛡️ Dari Database Guru Piket">
                      {piketOfficersList.map(officer => {
                        const matchedT = teachers.find(t => t.name.toLowerCase().includes(officer.name.toLowerCase()) || (officer.code && t.code === officer.code));
                        return (
                          <option key={officer.id} value={matchedT ? matchedT.id : officer.id}>
                            Guru Piket: {officer.name} ({officer.roleTitle || officer.assignedDays.join(', ')}) {officer.code ? `[Kode ${officer.code}]` : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}

                  {/* Active Piket Officers by Name */}
                  {piketOfficers.length > 0 && (
                    <optgroup label="⭐ Petugas Piket Hari Ini">
                      {piketOfficers.map((officerName, idx) => {
                        const matchedT = teachers.find(t => t.name.toLowerCase().includes(officerName.toLowerCase()));
                        return (
                          <option key={`piket-opt-${idx}`} value={matchedT ? matchedT.id : `piket-name-${idx}`}>
                            Petugas Piket: {officerName} {matchedT ? `[Kode ${matchedT.code}]` : ''}
                          </option>
                        );
                      })}
                    </optgroup>
                  )}

                  {/* All Teachers / Piket Group */}
                  <optgroup label="Dewan Guru Lainnya">
                    {teachers
                      .filter(t => t.id !== assignedTeacher?.id)
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          Guru Piket: [{t.code}] {t.name}
                        </option>
                      ))}
                  </optgroup>
                </select>

                <p className="text-[10px] text-slate-600 mt-1 font-medium">
                  * Karena guru berhalangan, Guru Piket bertugas langsung masuk untuk mendampingi, mengisi kelas, dan mengawasi pengerjaan tugas siswa.
                </p>
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tugas / Bahan Ajar yang Dikerjakan Siswa:
                </label>
                <textarea
                  rows={2}
                  value={taskDescription}
                  onChange={e => setTaskDescription(e.target.value)}
                  placeholder="Contoh: Mengerjakan LKS Bab 3 hal 42-45 latihan 1-10 didampingi Guru Piket di kelas."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Delivery confirmation */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isTaskDelivered}
                  onChange={e => setIsTaskDelivered(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Tugas / materi telah disampaikan dan didampingi langsung oleh Guru Piket di kelas</span>
              </label>
            </div>
          )}

          {/* Optional notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan Khusus Piket di Kelas Ini (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Kelas tertib, siswa antusias mengerjakan tugas dengan pendampingan piket"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Presensi Piket</span>
          </button>
        </div>
      </div>
    </div>
  );
};
