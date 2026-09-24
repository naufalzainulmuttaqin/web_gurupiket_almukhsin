import React, { useState, useRef } from 'react';
import { SchoolSettings } from '../types/piket';
import { 
  Building2, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  X, 
  Sparkles, 
  RotateCcw,
  School,
  FileText
} from 'lucide-react';

interface SchoolSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  onSave: (settings: SchoolSettings) => void;
}

export const SchoolSettingsModal: React.FC<SchoolSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [subTitle, setSubTitle] = useState(settings.subTitle);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(settings.semester);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [headmasterName, setHeadmasterName] = useState(settings.headmasterName);
  const [headmasterNip, setHeadmasterNip] = useState(settings.headmasterNip || '');
  const [tuHeadName, setTuHeadName] = useState(settings.tuHeadName || '');
  const [address, setAddress] = useState(settings.address || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file logo maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      schoolName: schoolName.trim() || 'MTs Al-Mukhsin',
      subTitle: subTitle.trim() || 'Madrasah Tsanawiyah Al-Mukhsin',
      logoUrl: logoUrl.trim(),
      semester,
      academicYear: academicYear.trim() || '2025/2026',
      headmasterName: headmasterName.trim() || 'Drs. H. Ahmad Fauzi, M.Pd.I',
      headmasterNip: headmasterNip.trim(),
      tuHeadName: tuHeadName.trim(),
      address: address.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs border border-white/20">
              <School className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight flex items-center gap-2">
                Pengaturan Identitas Madrasah
              </h2>
              <p className="text-xs text-emerald-100">
                Kelola nama, logo, semester aktif, & pejabat resmi MTs Al-Mukhsin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Logo Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Logo Resmi MTs Al-Mukhsin
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl bg-white border-2 border-emerald-300 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Logo Madrasah" 
                    className="w-full h-full object-contain p-1"
                    onError={() => setLogoUrl('')}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-emerald-700">
                    <School className="w-9 h-9" />
                    <span className="text-[9px] font-black tracking-tighter">AL-MUKHSIN</span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Foto / File Logo
                  </button>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Gunakan Logo Default
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 font-medium">
                    Atau tempel Link / URL Gambar Logo:
                  </label>
                  <input
                    type="url"
                    value={logoUrl.startsWith('data:') ? '' : logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://contoh.com/logo-madrasah.png"
                    className="w-full text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* School Name & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Madrasah (Singkat) *
              </label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="MTs Al-Mukhsin"
                className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap / Sub Judul *
              </label>
              <input
                type="text"
                required
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
                placeholder="Madrasah Tsanawiyah Al-Mukhsin Cibinong"
                className="w-full text-sm px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium focus:outline-hidden"
              />
            </div>
          </div>

          {/* Semester & Academic Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">
                Semester Aktif *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as 'Ganjil' | 'Genap')}
                className="w-full text-sm px-3.5 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Ganjil">Semester Ganjil (1)</option>
                <option value="Genap">Semester Genap (2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">
                Tahun Ajaran / Pelajaran *
              </label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025/2026"
                className="w-full text-sm px-3.5 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Pejabat Resmi & Alamat */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Pejabat Penandatangan Resmi (Kop Surat & Rekap)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Kepala Madrasah
                </label>
                <input
                  type="text"
                  value={headmasterName}
                  onChange={(e) => setHeadmasterName(e.target.value)}
                  placeholder="Drs. H. Ahmad Fauzi, M.Pd.I"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  NIP Kepala Madrasah
                </label>
                <input
                  type="text"
                  value={headmasterNip}
                  onChange={(e) => setHeadmasterNip(e.target.value)}
                  placeholder="197104121998031002"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Kepala Tata Usaha (TU)
                </label>
                <input
                  type="text"
                  value={tuHeadName}
                  onChange={(e) => setTuHeadName(e.target.value)}
                  placeholder="Syaipul Yusuf, S.Kom"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                  Alamat Madrasah
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Kauman No. 12, Cibinong"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Simpan Identitas Madrasah
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
