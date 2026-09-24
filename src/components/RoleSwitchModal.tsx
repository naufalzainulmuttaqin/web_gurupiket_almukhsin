import React, { useState } from 'react';
import { DayOfWeek, PiketOfficer, Teacher, UserRole } from '../types/piket';
import { ShieldCheck, UserCheck, Lock, Check, X, ArrowRight, User, KeyRound, Sparkles } from 'lucide-react';
import { loadCredentials } from '../utils/storage';

interface RoleSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  activeOfficerId?: string;
  activeTeacherId?: string;
  currentOfficerId?: string;
  currentTeacherId?: string;
  piketOfficers: PiketOfficer[];
  teachers: Teacher[];
  activeDay?: DayOfWeek;
  onSelectRole: (role: UserRole, officerId?: string, teacherId?: string) => void;
}

export const RoleSwitchModal: React.FC<RoleSwitchModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  activeOfficerId,
  activeTeacherId,
  currentOfficerId,
  currentTeacherId,
  piketOfficers,
  teachers,
  activeDay = 'Senin',
  onSelectRole,
}) => {
  const effectiveOfficerId = activeOfficerId || currentOfficerId;
  const effectiveTeacherId = activeTeacherId || currentTeacherId;

  const [targetRole, setTargetRole] = useState<UserRole>(currentRole);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(
    effectiveOfficerId || (piketOfficers.find(o => o.assignedDays.includes(activeDay))?.id || piketOfficers[0]?.id || '')
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(effectiveTeacherId || teachers[0]?.id || '');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    if (targetRole === 'GURU_PIKET') {
      const creds = loadCredentials();
      if (pinInput !== creds.piketPw && pinInput !== creds.adminPw) {
        setPinError(true);
        return;
      }
      onSelectRole('GURU_PIKET', selectedOfficerId, undefined);
    } else {
      onSelectRole('GURU_BIASA', undefined, selectedTeacherId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-black text-base text-slate-800 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Pilih Peran & Mode Akses</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan hak akses Anda dalam aplikasi Sistem Guru Piket MTs Al Mukhsin.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleApply} className="space-y-4 mt-4">
          
          {/* Role Choice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Guru Piket */}
            <div
              onClick={() => {
                setTargetRole('GURU_PIKET');
                setPinError(false);
              }}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                targetRole === 'GURU_PIKET'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    targetRole === 'GURU_PIKET' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  {targetRole === 'GURU_PIKET' && (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="font-extrabold text-sm text-slate-800">Guru Piket</div>
                <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">Akses Penuh / Petugas</div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Bisa mencatat presensi, mendampingi jam kosong, dan membuat laporan AI RAG ke WhatsApp.
                </p>
              </div>
            </div>

            {/* Guru Biasa / Mapel */}
            <div
              onClick={() => {
                setTargetRole('GURU_BIASA');
                setPinError(false);
              }}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                targetRole === 'GURU_BIASA'
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    targetRole === 'GURU_BIASA' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  {targetRole === 'GURU_BIASA' && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="font-extrabold text-sm text-slate-800">Guru Biasa</div>
                <div className="text-[11px] text-blue-700 font-semibold mt-0.5">Mode Hanya Lihat Jadwal</div>
                <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                  Hanya bisa melihat jadwal mengajar sendiri dan madrasah (tidak bisa ubah presensi / laporan).
                </p>
              </div>
            </div>
          </div>

          {/* Conditional Options for GURU PIKET */}
          {targetRole === 'GURU_PIKET' && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-bold text-emerald-950 uppercase tracking-wider mb-1">
                  Pilih Identitas Petugas Piket Anda:
                </label>
                <select
                  value={selectedOfficerId}
                  onChange={e => setSelectedOfficerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                >
                  <optgroup label={`⭐ Petugas Jadwal Hari ${activeDay}`}>
                    {piketOfficers
                      .filter(o => o.assignedDays.includes(activeDay))
                      .map(o => (
                        <option key={o.id} value={o.id}>
                          {o.name} {o.code ? `[Kode ${o.code}]` : ''} - {o.roleTitle || 'Piket'}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Dewan Guru Piket Lainnya">
                    {piketOfficers
                      .filter(o => !o.assignedDays.includes(activeDay))
                      .map(o => (
                        <option key={o.id} value={o.id}>
                          {o.name} {o.code ? `[Kode ${o.code}]` : ''} - ({o.assignedDays.join(', ')})
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-950 uppercase tracking-wider mb-1">
                  Password Guru Piket:
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="Masukkan Password Guru Piket"
                  className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {pinError && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1">
                    Password salah! Masukkan password guru piket yang valid.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Conditional Options for GURU BIASA */}
          {targetRole === 'GURU_BIASA' && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 animate-in fade-in">
              <label className="block text-[11px] font-bold text-blue-950 uppercase tracking-wider mb-1">
                Pilih Nama / Kode Anda (Untuk Menyorot Jadwal Mengajar):
              </label>
              <select
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              >
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    [Kode {t.code}] {t.name} - {t.subject}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-blue-800 mt-1">
                * Sebagai Guru Biasa, Anda dapat melihat jadwal lengkap madrasah dan menyorot jam mengajar Anda sendiri tanpa khawatir mengubah data presensi.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition flex items-center gap-1.5 ${
                targetRole === 'GURU_PIKET'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Peran Ini</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
