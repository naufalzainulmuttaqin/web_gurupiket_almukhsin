import React, { useState } from 'react';
import { Teacher, UserRole } from '../types/piket';
import { SUBJECT_OPTIONS, getTeacherColor } from '../utils/defaultData';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserCheck, 
  BookOpen, 
  Phone, 
  Hash, 
  LayoutGrid, 
  Table, 
  X, 
  Check, 
  ExternalLink,
  MessageCircle,
  Eye,
  Sparkles,
  Lock
} from 'lucide-react';

interface TeacherDatabaseProps {
  teachers: Teacher[];
  userRole?: UserRole;
  onRequestRoleSwitch?: () => void;
  onSaveTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
}

export const TeacherDatabase: React.FC<TeacherDatabaseProps> = ({
  teachers,
  userRole = 'GURU_PIKET',
  onRequestRoleSwitch,
  onSaveTeacher,
  onDeleteTeacher,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'CODE_GRID' | 'TABLE'>('CODE_GRID');
  
  // Selected teacher for detail modal (when clicking code badge)
  const [selectedTeacherDetail, setSelectedTeacherDetail] = useState<Teacher | null>(null);

  // Modal states for add/edit & delete
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditingTeacher(null);
    setCode('');
    setName('');
    setNip('');
    setSubject(SUBJECT_OPTIONS[0]);
    setCustomSubject('');
    setPhone('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setCode(teacher.code);
    setName(teacher.name);
    setNip(teacher.nip || '');
    if (SUBJECT_OPTIONS.includes(teacher.subject)) {
      setSubject(teacher.subject);
      setCustomSubject('');
    } else {
      setSubject('OTHER');
      setCustomSubject(teacher.subject);
    }
    setPhone(teacher.phone || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFormError('Kode guru wajib diisi (misal: 14a, 15, 3b).');
      return;
    }
    if (!name.trim()) {
      setFormError('Nama lengkap guru wajib diisi.');
      return;
    }

    const finalSubject = subject === 'OTHER' ? customSubject.trim() : subject;
    if (!finalSubject) {
      setFormError('Mata pelajaran wajib dipilih atau diisi.');
      return;
    }

    const teacherData: Teacher = {
      id: editingTeacher ? editingTeacher.id : `t-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      nip: nip.trim() || undefined,
      subject: finalSubject,
      phone: phone.trim() || undefined,
      isActive: true,
    };

    onSaveTeacher(teacherData);
    setIsModalOpen(false);

    // If detail modal is open for this teacher, update it too
    if (selectedTeacherDetail?.id === teacherData.id) {
      setSelectedTeacherDetail(teacherData);
    }
  };

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch =
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.nip && t.nip.includes(searchQuery));
    const matchesFilter = selectedSubjectFilter === 'ALL' || t.subject === selectedSubjectFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-800">
              DATABASE DEWAN GURU & KODE PENGAJAR
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
              {teachers.length} Guru
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Setiap guru memiliki <strong>Kode Khusus</strong> untuk matriks jadwal. Klik kotak kode untuk melihat detail lengkap guru.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch View Toggle */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setViewMode('CODE_GRID')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'CODE_GRID' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cukup Kode (Matriks)</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'TABLE' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabel Lengkap</span>
            </button>
          </div>

          {userRole !== 'GURU_BIASA' ? (
            <button
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl shadow-xs transition active:scale-95 text-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Guru</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold flex items-center gap-1.5 border border-slate-200" title="Penambahan data master guru hanya untuk Guru Piket & Admin">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Mode Hanya Lihat</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode (misal: 14a, 15, 3b) atau nama guru..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedSubjectFilter}
            onChange={e => setSelectedSubjectFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          >
            <option value="ALL">Semua Mata Pelajaran</option>
            {SUBJECT_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: COMPACT CODE GRID (Cukup Kode Saja, Klik untuk Detail) */}
      {viewMode === 'CODE_GRID' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Menampilkan {filteredTeachers.length} Guru. <strong>Klik kotak kode</strong> untuk melihat biodata & nomor WhatsApp.</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {filteredTeachers.map(teacher => {
              const color = getTeacherColor(teacher.code);
              return (
                <button
                  key={teacher.id}
                  onClick={() => setSelectedTeacherDetail(teacher)}
                  className={`p-2.5 rounded-2xl border text-center transition-all duration-150 shadow-xs hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer flex flex-col items-center justify-center min-h-[86px] ${color.bg} ${color.text} ${color.border}`}
                  title={`[${teacher.code}] ${teacher.name} - ${teacher.subject} (Klik untuk detail)`}
                >
                  {/* Huge bold teacher code as requested */}
                  <div className="font-black text-xl sm:text-2xl tracking-tight leading-none mb-1">
                    {teacher.code}
                  </div>
                  {/* Truncated name */}
                  <div className="text-[10px] font-bold truncate max-w-full leading-tight opacity-90">
                    {teacher.name.split(',')[0]}
                  </div>
                  {/* Mapel short badge */}
                  <div className="text-[9px] font-medium opacity-75 truncate max-w-full">
                    {teacher.subject}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredTeachers.length === 0 && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
              <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-xs">Tidak ada data kode guru yang sesuai pencarian.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: TABLE VIEW */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">Kode</th>
                  <th className="py-3 px-4">Nama Lengkap & NIP</th>
                  <th className="py-3 px-4">Mata Pelajaran Utama</th>
                  <th className="py-3 px-4">No. WhatsApp</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada data guru yang sesuai pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map(teacher => {
                    const color = getTeacherColor(teacher.code);
                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedTeacherDetail(teacher)}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs border shadow-2xs cursor-pointer hover:scale-110 transition ${color.bg} ${color.text} ${color.border}`}
                          >
                            {teacher.code}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedTeacherDetail(teacher)}
                            className="font-bold text-slate-800 hover:text-emerald-700 text-left cursor-pointer"
                          >
                            {teacher.name}
                          </button>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            NIP: {teacher.nip || 'Belum diisi'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            {teacher.subject}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {teacher.phone ? (
                            <a
                              href={`https://wa.me/${teacher.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-medium"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{teacher.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                            Aktif
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedTeacherDetail(teacher)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {userRole !== 'GURU_BIASA' && (
                              <>
                                <button
                                  onClick={() => openEditModal(teacher)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                  title="Edit Guru"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(teacher.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Hapus Guru"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POPUP DETAIL GURU (Triggered when clicking any Code Badge / Tile) */}
      {selectedTeacherDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header with big code */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {(() => {
                  const color = getTeacherColor(selectedTeacherDetail.code);
                  return (
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border shadow-sm ${color.bg} ${color.text} ${color.border}`}>
                      {selectedTeacherDetail.code}
                    </div>
                  );
                })()}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Kode Pengajar
                  </span>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    {selectedTeacherDetail.name}
                  </h3>
                  <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                    {selectedTeacherDetail.subject}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeacherDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Content */}
            <div className="my-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">NIP / NUPTK:</span>
                  <span className="font-bold text-slate-800">
                    {selectedTeacherDetail.nip || 'Belum diisi'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Mata Pelajaran:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedTeacherDetail.subject}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Status Guru:</span>
                  <span className="font-bold text-emerald-700">Aktif Mengajar</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Kontak HP / WA:</span>
                  <span className="font-bold text-slate-800">
                    {selectedTeacherDetail.phone || 'Belum ada'}
                  </span>
                </div>
              </div>

              {/* WhatsApp direct button if phone available */}
              {selectedTeacherDetail.phone && (
                <a
                  href={`https://wa.me/${selectedTeacherDetail.phone.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Assalamu'alaikum Wr. Wb. Ustadz/Ustadzah ${selectedTeacherDetail.name}, salam dari Petugas Piket MTs Al-Mukhsin.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Hubungi via WhatsApp ({selectedTeacherDetail.phone})</span>
                </a>
              )}
            </div>

            {/* Actions: Edit & Delete */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {userRole !== 'GURU_BIASA' ? (
                <>
                  <button
                    onClick={() => {
                      const toDeleteId = selectedTeacherDetail.id;
                      setSelectedTeacherDetail(null);
                      setDeleteConfirmId(toDeleteId);
                    }}
                    className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Guru</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTeacherDetail(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      Tutup
                    </button>
                    <button
                      onClick={() => {
                        const toEdit = selectedTeacherDetail;
                        setSelectedTeacherDetail(null);
                        openEditModal(toEdit);
                      }}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Data</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 italic">
                    Mode Guru Mapel (Hanya Lihat)
                  </span>
                  <button
                    onClick={() => setSelectedTeacherDetail(null)}
                    className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Teacher */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {editingTeacher ? `Edit Data Guru [${editingTeacher.code}]` : 'Tambah Guru Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan kode guru dan informasi mata pelajaran. Kode ini akan langsung muncul pada matriks jadwal.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                {/* Kode Guru */}
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kode Guru *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: 14a"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-black uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">Kode Matriks</span>
                </div>

                {/* Nama Guru */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap & Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dra. Hj. Siti Aminah, M.Pd"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  NIP / NUPTK (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 198509202010011015"
                  value={nip}
                  onChange={e => setNip(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mata Pelajaran Utama *
                </label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 mb-2 font-medium"
                >
                  {SUBJECT_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  <option value="OTHER">-- Lainnya / Tulis Manual --</option>
                </select>

                {subject === 'OTHER' && (
                  <input
                    type="text"
                    required
                    placeholder="Tuliskan nama mata pelajaran..."
                    value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor HP / WhatsApp (Untuk Notifikasi Inval)
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Data Guru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 text-center mb-1">
              Hapus Data Guru?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-5">
              Guru ini akan dihapus dari daftar database guru master. Jadwal yang sudah tersimpan mungkin perlu disesuaikan.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="w-1/2 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteTeacher(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="w-1/2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
