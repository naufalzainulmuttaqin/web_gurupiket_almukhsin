import React, { useState } from 'react';
import { DailyPiketMeta, PiketReportRecord, UserRole, SchoolSettings } from '../types/piket';
import { RAGPiketPayload } from '../utils/ragBuilder';
import { downloadHtmlAsWord } from '../utils/wordExport';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  Smartphone, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Share2, 
  MessageSquare,
  Printer,
  ChevronDown,
  Info,
  Lock,
  ShieldCheck,
  KeyRound,
  FileDown
} from 'lucide-react';

interface AIReportGeneratorProps {
  ragContext: RAGPiketPayload;
  dailyMeta: DailyPiketMeta;
  userRole?: UserRole;
  schoolSettings?: SchoolSettings;
  onRequestRoleSwitch?: () => void;
  onUpdateDailyMeta: (meta: DailyPiketMeta) => void;
  onSaveReportRecord: (report: PiketReportRecord) => void;
}

export const AIReportGenerator: React.FC<AIReportGeneratorProps> = ({
  ragContext,
  dailyMeta,
  userRole = 'GURU_PIKET',
  schoolSettings,
  onRequestRoleSwitch,
  onUpdateDailyMeta,
  onSaveReportRecord,
}) => {
  const [reportStyle, setReportStyle] = useState<'whatsapp' | 'formal' | 'ringkas'>('whatsapp');
  const [customPiketNotes, setCustomPiketNotes] = useState('');
  const [generatedReport, setGeneratedReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRAGInspector, setShowRAGInspector] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');
  const [modelBadge, setModelBadge] = useState<string>('');

  // Officers editing state
  const [officersInput, setOfficersInput] = useState(dailyMeta.piketOfficers.join(', '));
  const [generalConditionInput, setGeneralConditionInput] = useState(dailyMeta.generalNotes || '');

  const handleSavePiketMeta = () => {
    const officersArray = officersInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    onUpdateDailyMeta({
      ...dailyMeta,
      piketOfficers: officersArray,
      generalNotes: generalConditionInput,
    });
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setCopied(false);

    // Save updated meta first so RAG captures current officer names
    handleSavePiketMeta();

    try {
      const response = await fetch('/api/generate-piket-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ragContext: {
            ...ragContext,
            piketOfficers: officersInput.split(',').map(s => s.trim()).filter(Boolean),
            generalNotes: generalConditionInput,
          },
          style: reportStyle,
          customNotes: customPiketNotes,
        }),
      });

      const data = await response.json();

      if (data.success && data.report) {
        setGeneratedReport(data.report);
        setModelBadge(data.source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash (AI RAG)' : 'AI RAG Engine');
        
        // Save to report history
        onSaveReportRecord({
          id: `rep-${Date.now()}`,
          date: ragContext.dateStr,
          day: ragContext.dayName as any,
          reportText: data.report,
          generatedByAI: true,
          modelUsed: data.source,
          createdAt: new Date().toISOString(),
          officers: ragContext.piketOfficers,
        });
      } else {
        throw new Error(data.error || 'Gagal menyusun laporan');
      }
    } catch (err: any) {
      console.error('Error generating report:', err);
      setErrorMsg('Gagal menyusun laporan otomatis. Silakan coba lagi atau periksa koneksi internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!generatedReport) return;
    try {
      await navigator.clipboard.writeText(generatedReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSendToWhatsApp = () => {
    if (!generatedReport) return;
    const encodedText = encodeURIComponent(generatedReport);
    let waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    
    // If user provided a specific phone number
    if (targetPhone.trim()) {
      let cleanPhone = targetPhone.replace(/\D/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
      }
      waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    }

    // Open WhatsApp
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    if (!generatedReport) return;
    const schoolName = (schoolSettings?.subTitle || 'MADRASAH TSANAWIYAH AL-MUKHSIN').toUpperCase();
    const headmaster = schoolSettings?.headmasterName || 'Drs. H. Ahmad Fauzi, M.Pd.I';
    const headmasterNip = schoolSettings?.headmasterNip ? `NIP. ${schoolSettings.headmasterNip}` : '';
    const semesterInfo = `Semester ${schoolSettings?.semester || 'Ganjil'} TP ${schoolSettings?.academicYear || '2025/2026'}`;

    const formattedHtml = `
      <div class="header-kop">
        <div class="kop-title">${schoolName}</div>
        <div class="kop-sub">LAPORAN RESMI HARIAN GURU PIKET & KBM (${semesterInfo})</div>
        <div class="kop-address">Hari, Tanggal: ${dailyMeta.date} (${dailyMeta.day}) • Petugas Piket: ${dailyMeta.piketOfficers.join(', ') || 'Guru Piket'}</div>
      </div>
      <div style="white-space: pre-wrap; font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.6; margin-top: 15px;">
        ${generatedReport.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')}
      </div>
      <div class="footer-signatures" style="margin-top: 35px;">
        <table class="sig-table">
          <tr>
            <td style="width: 50%; text-align: center;">
              Mengetahui,<br>
              <b>Kepala Madrasah</b><br><br><br><br>
              <u><b>${headmaster}</b></u><br>
              ${headmasterNip}
            </td>
            <td style="width: 50%; text-align: center;">
              Cibinong, ${dailyMeta.date}<br>
              <b>Guru Piket Pelapor</b><br><br><br><br>
              <u><b>${dailyMeta.piketOfficers[0] || 'Guru Piket'}</b></u>
            </td>
          </tr>
        </table>
      </div>
    `;
    downloadHtmlAsWord(
      `Laporan_Piket_AlMukhsin_${dailyMeta.date}`,
      `Laporan Piket ${dailyMeta.date}`,
      formattedHtml
    );
  };

  if (userRole === 'GURU_BIASA') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm my-6 space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            Akses Khusus Guru Piket
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 mt-3">
            Pembuatan Laporan AI (RAG) & WA Terkunci
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Anda saat ini berada dalam <strong>Mode Guru Biasa (Hanya Lihat Jadwal)</strong>. Sesuai kebijakan operasional MTs Al Mukhsin, pencatatan hasil piket, generate laporan AI berbasis RAG, dan pengiriman laporan resmi ke WhatsApp Kepala Madrasah hanya berhak dilakukan oleh <strong>Guru Piket</strong>.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2 text-slate-700">
          <div className="font-bold flex items-center gap-1.5 text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Hak Akses Guru Biasa:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
            <li>Melihat jadwal KBM harian seluruh kelas</li>
            <li>Menyorot jam mengajar pribadi di tabel matriks</li>
            <li>Melihat informasi guru piket yang mendampingi kelas jika berhalangan hadir</li>
          </ul>
        </div>

        {onRequestRoleSwitch && (
          <button
            type="button"
            onClick={onRequestRoleSwitch}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Beralih ke Akun Guru Piket</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-5 sm:p-6 rounded-2xl border border-slate-700 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              </span>
              <h2 className="text-xl font-extrabold tracking-tight">
                Generator Laporan AI Berbasis RAG
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              AI membaca seluruh data jadwal KBM, absensi guru, penugasan inval, dan catatan piket madrasah untuk menyusun laporan siap kirim ke WhatsApp Kepala Madrasah & grup guru.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRAGInspector(!showRAGInspector)}
              className="text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Info className="w-4 h-4 text-emerald-400" />
              <span>{showRAGInspector ? 'Tutup Data RAG' : 'Lihat Data RAG'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRAGInspector ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Collapsible RAG Inspector */}
        {showRAGInspector && (
          <div className="mt-4 pt-4 border-t border-slate-700 text-xs space-y-3 animate-in fade-in duration-150">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <span>Data Pengetahuan Terambil (RAG Retrieved Context)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-[11px] font-semibold">Statistik Hari Ini</div>
                <div className="text-slate-200 font-bold mt-1">
                  {ragContext.stats.totalActiveSlots} Total JP • {ragContext.stats.presentSlots} Hadir ({ragContext.stats.percentage}%)
                </div>
                <div className="text-amber-400 text-[11px] mt-0.5">
                  {ragContext.stats.absentSlots} Guru Berhalangan
                </div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-[11px] font-semibold">Tanggung Jawab Pendampingan Guru Piket</div>
                <div className="text-slate-200 font-semibold mt-1">
                  {ragContext.invalCoverage}
                </div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-[11px] font-semibold">Guru Berhalangan Terdata</div>
                <div className="text-slate-200 font-semibold mt-1">
                  {ragContext.absences.length > 0 ? (
                    <span className="text-amber-300">{ragContext.absences.length} kelas memerlukan perhatian</span>
                  ) : (
                    <span className="text-emerald-400">Nihil (Semua Guru Hadir)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Form & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Settings (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Officers & Condition Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Petugas Piket & Situasi Hari Ini</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Petugas Guru Piket (Pisahkan Koma)
              </label>
              <input
                type="text"
                value={officersInput}
                onChange={e => setOfficersInput(e.target.value)}
                onBlur={handleSavePiketMeta}
                placeholder="Contoh: Ust. Abdul Malik, Rina Kartika, S.Kom"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Situasi Umum & Pembiasaan Madrasah
              </label>
              <textarea
                rows={2}
                value={generalConditionInput}
                onChange={e => setGeneralConditionInput(e.target.value)}
                onBlur={handleSavePiketMeta}
                placeholder="Contoh: Sholat Dhuha terlaksana tertib di masjid, pembiasaan tadarus pagi berjalan lancar, cuaca cerah."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Generator Controls Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Parameter Laporan AI</span>
            </h3>

            {/* Style Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Format / Gaya Penulisan:
              </label>
              <div className="space-y-2">
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${reportStyle === 'whatsapp' ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="reportStyle"
                    value="whatsapp"
                    checked={reportStyle === 'whatsapp'}
                    onChange={() => setReportStyle('whatsapp')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Format Resmi WhatsApp (Rekomendasi)</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">Populer</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Rapi dengan cetak tebal, emoji islami, salam santun, dan siap kirim ke Kepala Madrasah & grup guru.
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${reportStyle === 'formal' ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="reportStyle"
                    value="formal"
                    checked={reportStyle === 'formal'}
                    onChange={() => setReportStyle('formal')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Format Berita Acara Formal Madrasah
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Gaya bahasa formal kedinasan Kemenag, cocok untuk arsip cetak dan dokumen resmi.
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${reportStyle === 'ringkas' ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input
                    type="radio"
                    name="reportStyle"
                    value="ringkas"
                    checked={reportStyle === 'ringkas'}
                    onChange={() => setReportStyle('ringkas')}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Format Ringkas (Flash Summary)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Poin-poin esensial ringkas tanpa teks panjang, fokus pada guru absen dan guru inval.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Catatan Tambahan untuk AI (Opsional)
              </label>
              <textarea
                rows={2}
                value={customPiketNotes}
                onChange={e => setCustomPiketNotes(e.target.value)}
                placeholder="Contoh: Tolong beri penekanan pada kelas VIII-B yang gurunya sakit agar tugas dikumpulkan tepat waktu."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Sedang Membaca Fakta & Menyusun Laporan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Buat Laporan Piket Sekarang</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Generated Report Preview & WhatsApp Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
            
            {/* Report Header Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm">Pratinjau Teks Laporan Piket</span>
                {modelBadge && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {modelBadge}
                  </span>
                )}
              </div>

              {generatedReport && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDownloadWord}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
                    title="Download Format Word (.doc)"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Word (.doc)</span>
                  </button>

                  <button
                    onClick={handleCopyToClipboard}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                    title="Salin Teks"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handlePrint}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Cetak Laporan"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Report Body / Editor */}
            <div className="p-4 flex-1 flex flex-col bg-slate-50/50">
              {generatedReport ? (
                <div className="flex-1 flex flex-col space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="italic">*Anda dapat menyunting teks di bawah secara manual bila diperlukan:</span>
                    <span>{generatedReport.length} Karakter</span>
                  </div>

                  <textarea
                    value={generatedReport}
                    onChange={e => setGeneratedReport(e.target.value)}
                    rows={16}
                    className="w-full flex-1 p-4 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-inner resize-y"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-base">Laporan Belum Dibuat</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Klik tombol <strong>"Buat Laporan Piket Sekarang"</strong> di sebelah kiri untuk menghasilkan draf laporan otomatis berbasis fakta KBM hari ini.
                  </p>
                </div>
              )}
            </div>

            {/* WhatsApp Direct Action Footer */}
            {generatedReport && (
              <div className="p-4 bg-emerald-50/70 border-t border-emerald-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Optional Phone Target */}
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={e => setTargetPhone(e.target.value)}
                    placeholder="Nomor WA Tujuan (Opsional)"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadWord}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-300 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs cursor-pointer active:scale-95"
                    title="Download Format Word (.doc)"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Download Word (.doc)</span>
                  </button>

                  <button
                    onClick={handleCopyToClipboard}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition shadow-xs cursor-pointer active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Tersalin ke Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-emerald-700" />
                        <span>Salin ke WhatsApp</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSendToWhatsApp}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20 transition cursor-pointer active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Kirim Hasil ke WhatsApp</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
