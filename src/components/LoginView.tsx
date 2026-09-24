import React, { useState } from 'react';
import { Teacher, PiketOfficer, UserRole, AppCredentials } from '../types/piket';
import { 
  School, 
  ShieldCheck, 
  User, 
  KeyRound, 
  Lock, 
  ArrowRight, 
  Search, 
  Sparkles, 
  ShieldAlert, 
  Eye, 
  EyeOff,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

interface LoginViewProps {
  teachers: Teacher[];
  piketOfficers: PiketOfficer[];
  credentials: AppCredentials;
  onLogin: (role: UserRole, teacherId?: string, officerId?: string, displayName?: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  teachers,
  piketOfficers,
  credentials,
  onLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'GURU_BIASA' | 'GURU_PIKET' | 'ADMIN'>('GURU_BIASA');
  
  // Guru Mapel state
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [teacherSearch, setTeacherSearch] = useState<string>('');

  // Guru Piket state
  const [piketIdInput, setPiketIdInput] = useState<string>('');
  const [piketPwInput, setPiketPwInput] = useState<string>('');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(piketOfficers[0]?.id || '');
  const [showPiketPw, setShowPiketPw] = useState(false);
  const [piketError, setPiketError] = useState<string | null>(null);

  // Sync initial selection when lists load
  React.useEffect(() => {
    if (!selectedTeacherId && teachers.length > 0) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, selectedTeacherId]);

  React.useEffect(() => {
    if (!selectedOfficerId && piketOfficers.length > 0) {
      setSelectedOfficerId(piketOfficers[0].id);
    }
  }, [piketOfficers, selectedOfficerId]);

  // Admin state
  const [adminIdInput, setAdminIdInput] = useState<string>('');
  const [adminPwInput, setAdminPwInput] = useState<string>('');
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Filtered teachers for Guru Mapel
  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.code.toLowerCase().includes(teacherSearch.toLowerCase()) ||
    t.subject.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const handleGuruMapelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tch = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
    if (!tch) return;
    onLogin('GURU_BIASA', tch.id, undefined, `[${tch.code}] ${tch.name}`);
  };

  const handleGuruPiketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPiketError(null);

    const cleanId = piketIdInput.trim();
    const cleanPw = piketPwInput.trim();

    if (cleanId !== credentials.piketId || cleanPw !== credentials.piketPw) {
      setPiketError('ID atau Password Guru Piket salah! Silakan periksa kembali.');
      return;
    }

    const off = piketOfficers.find(o => o.id === selectedOfficerId);
    onLogin('GURU_PIKET', undefined, off?.id, off?.name || 'Petugas Guru Piket');
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    const cleanId = adminIdInput.trim();
    const cleanPw = adminPwInput.trim();

    if (cleanId !== credentials.adminId || cleanPw !== credentials.adminPw) {
      setAdminError('ID atau Password Admin salah! Silakan periksa kembali.');
      return;
    }

    onLogin('ADMIN', undefined, undefined, 'Administrator Madrasah');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center items-center p-4 sm:p-6 text-white font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Subtle Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-500 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Madrasah Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/30 mb-3 border border-emerald-400/30">
            <School className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            MTs Al Mukhsin
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Sistem Informasi KBM, Presensi & Piket Madrasah
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md text-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border border-white/20">
          
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('GURU_BIASA');
                setPiketError(null);
                setAdminError(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'GURU_BIASA'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Guru Mapel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('GURU_PIKET');
                setPiketError(null);
                setAdminError(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'GURU_PIKET'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Guru Piket</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('ADMIN');
                setPiketError(null);
                setAdminError(null);
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'ADMIN'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          {/* TAB 1: GURU MAPEL (Langsung Pilih Nama, Tanpa Password) */}
          {activeTab === 'GURU_BIASA' && (
            <form onSubmit={handleGuruMapelSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl text-xs text-blue-900">
                <div className="font-bold flex items-center gap-1.5 text-blue-950 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Akses Langsung Tanpa Password</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Silakan pilih nama Anda dari daftar untuk langsung melihat jadwal mengajar pribadi dan mengecek kelas KBM Anda hari ini.
                </p>
              </div>

              {/* Teacher Search / Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Cari atau Pilih Nama Guru Mapel:
                </label>
                
                {/* Search Filter */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ketik kode, nama guru, atau mapel..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>

                {/* Dropdown Select */}
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800 cursor-pointer shadow-xs"
                  size={5}
                >
                  {filteredTeachers.map(t => (
                    <option key={t.id} value={t.id} className="py-1 px-1.5 rounded hover:bg-blue-50">
                      [{t.code}] {t.name} — {t.subject}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 italic">
                  *Guru mapel memiliki akses lihat jadwal (tidak dapat mengubah atau menghapus data).
                </p>
              </div>

              <button
                type="submit"
                disabled={!selectedTeacherId}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Masuk sebagai Guru Mapel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: GURU PIKET (Wajib ID & Password) */}
          {activeTab === 'GURU_PIKET' && (
            <form onSubmit={handleGuruPiketSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs text-emerald-900">
                <div className="font-bold flex items-center gap-1.5 text-emerald-950 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Akses Petugas Guru Piket</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Akses khusus untuk mencatat presensi KBM kelas, inval guru, dan laporan AI harian.
                </p>
              </div>

              {piketError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{piketError}</span>
                </div>
              )}

              {/* ID Guru Piket */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  ID Guru Piket:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Masukkan ID Petugas..."
                    value={piketIdInput}
                    onChange={(e) => setPiketIdInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Password Guru Piket */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password Guru Piket:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPiketPw ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password..."
                    value={piketPwInput}
                    onChange={(e) => setPiketPwInput(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPiketPw(!showPiketPw)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPiketPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Pilih Identitas Petugas Piket (Opsional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Petugas yang Bertugas Hari Ini:
                </label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800 cursor-pointer"
                >
                  {piketOfficers.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.name} {o.roleTitle ? `(${o.roleTitle})` : ''} - Tugas: {o.assignedDays.join(', ')}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Masuk sebagai Guru Piket</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: ADMIN (Wajib ID & Password) */}
          {activeTab === 'ADMIN' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl text-xs text-purple-900">
                <div className="font-bold flex items-center gap-1.5 text-purple-950 mb-1">
                  <KeyRound className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Portal Administrator Madrasah</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Admin memiliki wewenang penuh untuk mengubah ID dan Password Guru Piket serta mengelola seluruh sistem.
                </p>
              </div>

              {adminError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              {/* ID Admin */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  ID Admin:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Masukkan ID Administrator..."
                    value={adminIdInput}
                    onChange={(e) => setAdminIdInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-mono"
                  />
                </div>
              </div>

              {/* Password Admin */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password Admin:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showAdminPw ? 'text' : 'password'}
                    required
                    placeholder="Masukkan password admin..."
                    value={adminPwInput}
                    onChange={(e) => setAdminPwInput(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPw(!showAdminPw)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showAdminPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Masuk sebagai Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <span>MTs Al Mukhsin • Keamanan Multi-Peran Terpadu</span>
        </div>
      </div>
    </div>
  );
};
