import React, { useState } from 'react';
import { AppCredentials } from '../types/piket';
import { 
  KeyRound, 
  ShieldCheck, 
  Lock, 
  User, 
  Save, 
  X, 
  Check, 
  Eye, 
  EyeOff, 
  ShieldAlert 
} from 'lucide-react';

interface AdminCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: AppCredentials;
  onSaveCredentials: (newCreds: AppCredentials) => void;
}

export const AdminCredentialsModal: React.FC<AdminCredentialsModalProps> = ({
  isOpen,
  onClose,
  credentials,
  onSaveCredentials,
}) => {
  const [piketId, setPiketId] = useState(credentials.piketId);
  const [piketPw, setPiketPw] = useState(credentials.piketPw);
  const [adminId, setAdminId] = useState(credentials.adminId);
  const [adminPw, setAdminPw] = useState(credentials.adminPw);

  const [showPiketPw, setShowPiketPw] = useState(false);
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!piketId.trim() || !piketPw.trim() || !adminId.trim() || !adminPw.trim()) {
      setErrorMsg('Semua field ID dan Password harus diisi!');
      return;
    }
    setErrorMsg('');

    onSaveCredentials({
      piketId: piketId.trim(),
      piketPw: piketPw.trim(),
      adminId: adminId.trim(),
      adminPw: adminPw.trim(),
    });

    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                Pengaturan Kredensial Login
              </h2>
              <p className="text-xs text-slate-500">
                Khusus Hak Akses Administrator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-sm">
              Kredensial Berhasil Diperbarui!
            </p>
            <p className="text-xs text-slate-500">
              ID dan Password baru telah disimpan ke sistem.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {/* Bagian Guru Piket */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Kredensial Login Guru Piket</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ID / Username Guru Piket:
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={piketId}
                    onChange={(e) => setPiketId(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Password Guru Piket:
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPiketPw ? 'text' : 'password'}
                    required
                    value={piketPw}
                    onChange={(e) => setPiketPw(e.target.value)}
                    className="w-full pl-8 pr-9 py-1.5 text-xs rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPiketPw(!showPiketPw)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPiketPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bagian Admin */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-purple-900">
                <KeyRound className="w-4 h-4 text-purple-600" />
                <span>Kredensial Login Administrator</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ID / Username Admin:
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Password Admin:
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showAdminPw ? 'text' : 'password'}
                    required
                    value={adminPw}
                    onChange={(e) => setAdminPw(e.target.value)}
                    className="w-full pl-8 pr-9 py-1.5 text-xs rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPw(!showAdminPw)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showAdminPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
