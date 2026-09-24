import React, { useState } from 'react';
import { DayOfWeek, PiketOfficer, Teacher, UserRole } from '../types/piket';
import { DAYS_LIST, getTeacherColor } from '../utils/defaultData';
import { 
  ShieldCheck, 
  UserPlus, 
  CalendarDays, 
  Phone, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Users, 
  Clock, 
  Award,
  Sparkles,
  Info,
  Lock
} from 'lucide-react';

interface PiketOfficerDatabaseProps {
  piketOfficers: PiketOfficer[];
  teachers: Teacher[];
  activeDay?: DayOfWeek;
  userRole?: UserRole;
  onRequestRoleSwitch?: () => void;
  onSaveOfficer: (officer: PiketOfficer) => void;
  onDeleteOfficer: (id: string) => void;
  onApplyTodayOfficers?: (officerNames: string[]) => void;
}

export const PiketOfficerDatabase: React.FC<PiketOfficerDatabaseProps> = ({
  piketOfficers,
  teachers,
  activeDay = 'Senin',
  userRole = 'GURU_PIKET',
  onRequestRoleSwitch,
  onSaveOfficer,
  onDeleteOfficer,
  onApplyTodayOfficers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<PiketOfficer | null>(null);
  const [deletingOfficerId, setDeletingOfficerId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formRoleTitle, setFormRoleTitle] = useState('Anggota Piket');
  const [formPhone, setFormPhone] = useState('');
  const [formDays, setFormDays] = useState<DayOfWeek[]>(['Senin']);
  const [formIsActive, setFormIsActive] = useState(true);

  const openAddModal = () => {
    setEditingOfficer(null);
    setFormName('');
    setFormCode('');
    setFormRoleTitle('Anggota Piket');
    setFormPhone('');
    setFormDays([activeDay]);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (officer: PiketOfficer) => {
    setEditingOfficer(officer);
    setFormName(officer.name);
    setFormCode(officer.code || '');
    setFormRoleTitle(officer.roleTitle || 'Anggota Piket');
    setFormPhone(officer.phone || '');
    setFormDays(officer.assignedDays);
    setFormIsActive(officer.isActive);
    setIsModalOpen(true);
  };

  const handleSelectFromTeacherList = (teacherId: string) => {
    const t = teachers.find(item => item.id === teacherId);
    if (t) {
      setFormName(t.name);
      setFormCode(t.code);
      if (t.phone) setFormPhone(t.phone);
    }
  };

  const toggleDaySelection = (day: DayOfWeek) => {
    if (formDays.includes(day)) {
      if (formDays.length > 1) {
        setFormDays(formDays.filter(d => d !== day));
      }
    } else {
      setFormDays([...formDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newOfficer: PiketOfficer = {
      id: editingOfficer ? editingOfficer.id : `pkt-${Date.now()}`,
      name: formName.trim(),
      code: formCode.trim() || undefined,
      roleTitle: formRoleTitle.trim() || 'Anggota Piket',
      phone: formPhone.trim() || undefined,
      assignedDays: formDays,
      isActive: formIsActive,
    };

    onSaveOfficer(newOfficer);
    setIsModalOpen(false);
  };

  // Filter officers
  const filteredOfficers = piketOfficers.filter(officer => {
    const matchesSearch = 
      officer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (officer.roleTitle && officer.roleTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (officer.code && officer.code.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDay = selectedDayFilter === 'ALL' || officer.assignedDays.includes(selectedDayFilter as DayOfWeek);
    return matchesSearch && matchesDay;
  });

  // Today's scheduled piket officers
  const todayOfficers = piketOfficers.filter(o => o.isActive && o.assignedDays.includes(activeDay));

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-bold border border-teal-400/30 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Database Khusus Guru Piket (Terpisah dari Database Guru Mapel)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Master Data & Jadwal Piket Madrasah
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-2xl">
              Daftar dewan guru yang bertugas mengawasi ketertiban, mendampingi jam kosong kelas, dan menyusun laporan harian madrasah per hari tugas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {todayOfficers.length > 0 && onApplyTodayOfficers && userRole === 'GURU_PIKET' && (
              <button
                type="button"
                onClick={() => onApplyTodayOfficers(todayOfficers.map(o => o.name))}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
                title="Terapkan petugas hari ini ke meta presensi & RAG"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Set Petugas Hari {activeDay} ({todayOfficers.length})</span>
              </button>
            )}

            {userRole !== 'GURU_BIASA' ? (
              <button
                type="button"
                onClick={openAddModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-md transition flex items-center gap-2 cursor-pointer font-black"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Guru Piket</span>
              </button>
            ) : (
              <div className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 text-white/80 border border-white/20 flex items-center gap-1.5" title="Penambahan petugas hanya untuk Guru Piket & Admin">
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Mode Hanya Lihat</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Roster per Hari Tugas (Weekly Schedule Card) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span>Jadwal Petugas Piket Mingguan MTs Al Mukhsin</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik nama hari untuk memfilter daftar atau gunakan tombol tambah untuk memperbarui jadwal.
            </p>
          </div>

          {/* Quick Day Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedDayFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedDayFilter === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Hari ({piketOfficers.length})
            </button>
            {DAYS_LIST.map(day => {
              const count = piketOfficers.filter(o => o.assignedDays.includes(day)).length;
              const isToday = day === activeDay;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDayFilter(day)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    selectedDayFilter === day
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isToday
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{day}</span>
                  <span className={`text-[10px] px-1 py-0.2 rounded-full ${selectedDayFilter === day ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama guru piket, peran/jabatan, atau kode guru..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 rounded-xl"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Officers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {filteredOfficers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <div className="text-xs font-bold text-slate-600">Tidak ada data guru piket ditemukan</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Silakan tambah data petugas baru atau ganti filter hari tugas.
              </div>
            </div>
          ) : (
            filteredOfficers.map(officer => {
              const teacherColor = getTeacherColor(officer.code);
              const isAssignedToday = officer.assignedDays.includes(activeDay);

              return (
                <div
                  key={officer.id}
                  className={`p-4 rounded-xl border transition-all duration-150 relative flex flex-col justify-between ${
                    isAssignedToday
                      ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header: Code & Role */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {officer.code ? (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${teacherColor.bg} ${teacherColor.text} ${teacherColor.border}`}>
                            Kode {officer.code}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Piket
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                          {officer.roleTitle || 'Petugas Piket'}
                        </span>
                      </div>

                      {isAssignedToday && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white uppercase tracking-wider shrink-0">
                          Piket Hari Ini
                        </span>
                      )}
                    </div>

                    {/* Officer Name */}
                    <h4 className="font-black text-sm text-slate-900 mt-2 leading-snug">
                      {officer.name}
                    </h4>

                    {/* Assigned Days Pills */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {officer.assignedDays.map(day => (
                        <span
                          key={day}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            day === activeDay
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                    {officer.phone ? (
                      <a
                        href={`https://wa.me/${officer.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                        title="Chat WhatsApp"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{officer.phone}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">Tidak ada kontak</span>
                    )}

                    {userRole !== 'GURU_BIASA' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(officer)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit Guru Piket"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingOfficerId(officer.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Petugas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Form Tambah / Edit Guru Piket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-slate-800">
                  {editingOfficer ? 'Edit Data Guru Piket' : 'Tambah Guru Piket Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              {/* Quick Select from Teacher List */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Cepat dari Guru Mapel (Opsional)
                </label>
                <select
                  onChange={e => handleSelectFromTeacherList(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  defaultValue=""
                >
                  <option value="" disabled>-- Pilih nama guru untuk mengisi otomatis --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.name} ({t.subject})
                    </option>
                  ))}
                </select>
              </div>

              {/* Name & Code */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Contoh: Naswir, S.Pd.I"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Guru
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={e => setFormCode(e.target.value)}
                    placeholder="Contoh: 16"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-center font-black"
                  />
                </div>
              </div>

              {/* Role Title */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Peran / Tugas Piket
                </label>
                <input
                  type="text"
                  value={formRoleTitle}
                  onChange={e => setFormRoleTitle(e.target.value)}
                  placeholder="Contoh: Koordinator Piket, Petugas Piket & Dhuha Pagi"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Days Checkbox Selection */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hari Tugas Piket Mingguan: *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {DAYS_LIST.map(day => {
                    const isChecked = formDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDaySelection(day)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                        <span>{day}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Guru Piket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingOfficerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 animate-in fade-in">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-800 text-center mb-1">
              Hapus Petugas Guru Piket?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-4 leading-relaxed">
              Petugas <strong>{piketOfficers.find(o => o.id === deletingOfficerId)?.name}</strong> akan dihapus dari Database Guru Piket madrasah.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingOfficerId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deletingOfficerId) {
                    onDeleteOfficer(deletingOfficerId);
                    setDeletingOfficerId(null);
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
