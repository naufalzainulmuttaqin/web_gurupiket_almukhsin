import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization with required User-Agent
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!apiKey,
    school: 'MTs Al Mukhsin',
    timestamp: new Date().toISOString(),
  });
});

// API endpoint for RAG-assisted Piket Report Generation
app.post('/api/generate-piket-report', async (req: Request, res: Response) => {
  try {
    const { ragContext, style = 'whatsapp', customNotes = '' } = req.body;

    if (!ragContext) {
      return res.status(400).json({
        success: false,
        error: 'Data konteks RAG tidak ditemukan dalam permintaan.',
      });
    }

    const {
      schoolName = 'MTs Al Mukhsin',
      dayName,
      dateFormatted,
      piketOfficers = [],
      stats = {},
      absences = [],
      generalNotes = '',
      invalCoverage = '',
    } = ragContext;

    // RAG System Prompt
    const systemInstruction = `Anda adalah asisten AI resmi Guru Piket Madrasah Tsanawiyah (MTs) Al Mukhsin.
Tugas Anda adalah membaca data RAG (Retrieval-Augmented Generation) terkait jadwal KBM, absensi guru, dan pendampingan kelas oleh GURU PIKET (di MTs Al Mukhsin, jika guru berhalangan hadir, yang bertanggung jawab langsung mengisi dan mendampingi kelas adalah GURU PIKET yang bertugas hari itu), serta kondisi umum madrasah.
Kembangkan dan susun teks laporan piket harian yang sangat rapi, profesional, dan siap dikirim via WhatsApp kepada Kepala Madrasah, Waka Kurikulum, serta grup dewan guru.

Format penulisan harus ramah WhatsApp:
- Gunakan cetak tebal (*teks*) untuk judul dan poin penting.
- Gunakan emoji yang pantas (📋, 🏫, 📅, 👥, 📊, ⚠️, 🔄, 📝, ✅, dsb).
- Berikan salam pembuka dan penutup khas madrasah yang santun (Assalamu'alaikum Wr. Wb. & Wassalamu'alaikum Wr. Wb.).
- Jika ada guru tidak hadir, jelaskan guru piket yang mendampingi kelas tersebut serta tugas yang dikerjakan siswa.
- Berikan apresiasi atas ketertiban KBM dan pendampingan oleh guru piket.`;

    const userPrompt = `Berikut adalah data hasil penelusuran fakta RAG Guru Piket ${schoolName}:
--------------------------------------------------
DATA HARI & PETUGAS:
- Hari / Tanggal: ${dayName}, ${dateFormatted}
- Petugas Piket Hari Ini: ${piketOfficers.length > 0 ? piketOfficers.join(', ') : 'Guru Piket Bertugas'}

REKAPITULASI STATISTIK KBM:
- Total Slot KBM Aktif: ${stats.totalActiveSlots || 0} JP
- Jam Hadir Terpenuhi: ${stats.presentSlots || 0} JP (${stats.percentage || 0}%)
- Guru/Jam Tidak Hadir: ${stats.absentSlots || 0} JP
  * Izin: ${stats.permitSlots || 0} JP
  * Sakit: ${stats.sickSlots || 0} JP
  * Tugas Dinas Luar: ${stats.dutySlots || 0} JP
  * Tanpa Keterangan: ${stats.unexcusedSlots || 0} JP
- Tanggung Jawab Guru Piket: ${invalCoverage || 'Semua kelas kosong telah didampingi oleh Guru Piket'}

DAFTAR KELAS & GURU TIDAK HADIR BESERTA GURU PIKET PENDAMPING:
${
  absences.length > 0
    ? absences
        .map(
          (a: any, i: number) =>
            `${i + 1}. Kelas ${a.className} (${a.periodLabel}): ` +
            `Guru Terjadwal: [Kode ${a.teacherCode || '-'}] ${a.teacherName} (${a.subject}) | Status: ${a.status} (${a.reason || '-'}) | ` +
            `Guru Piket Pendamping: ${a.invalTeacher || 'Petugas Guru Piket'} | ` +
            `Tugas Siswa: ${a.task || 'Didampingi belajar mandiri oleh Guru Piket'}`
        )
        .join('\n')
    : 'Alhamdulillah seluruh guru hadir tepat waktu sesuai jadwal KBM.'
}

CATATAN KEJADIAN / SITUASI MADRASAH:
${generalNotes ? generalNotes : 'Kegiatan KBM, sholat dhuha dan sholat berjamaah berjalan tertib, aman, dan kondusif.'}

CATATAN TAMBAHAN DARI GURU PIKET:
${customNotes ? customNotes : 'Tidak ada catatan tambahan.'}

GAYA LAPORAN YANG DIMINTA: ${style === 'formal' ? 'Format Formal Berita Acara Madrasah' : style === 'ringkas' ? 'Format Ringkas & Poin Kunci WhatsApp' : 'Format Lengkap Resmi WhatsApp'}
--------------------------------------------------

Instruksi: Susun teks laporan siap kirim sekarang dengan gaya bahasa Indonesia yang rapi, runtut, dan komunikatif.`;

    // If Gemini client is available, call gemini-3.8-flash
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.4,
        },
      });

      const reportText = response.text || '';
      return res.json({
        success: true,
        report: reportText,
        source: 'gemini-3.8-flash',
        timestamp: new Date().toISOString(),
      });
    } else {
      // Deterministic high-quality algorithmic template fallback if API key is not yet set
      const formattedReport = generateFallbackReport(ragContext, customNotes);
      return res.json({
        success: true,
        report: formattedReport,
        source: 'rag-engine-fallback',
        note: 'Laporan disusun melalui AI RAG Engine lokal (GEMINI_API_KEY dapat dikonfigurasi di secrets).',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error('Error generating report with Gemini:', error);
    // Even if Gemini throws an error, return the algorithmic report so user is never blocked
    try {
      const fallback = generateFallbackReport(req.body?.ragContext || {}, req.body?.customNotes || '');
      return res.json({
        success: true,
        report: fallback,
        source: 'rag-engine-fallback',
        warning: 'Gemini API mengalami kendala, laporan dialihkan ke Generator RAG Otomatis.',
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      return res.status(500).json({
        success: false,
        error: error?.message || 'Gagal menyusun laporan piket.',
      });
    }
  }
});

// Deterministic rule-based RAG template
function generateFallbackReport(rag: any, customNotes: string): string {
  const school = rag.schoolName || 'MTs Al Mukhsin';
  const day = rag.dayName || 'Hari Ini';
  const date = rag.dateFormatted || new Date().toLocaleDateString('id-ID');
  const officers = rag.piketOfficers?.length > 0 ? rag.piketOfficers.join(', ') : 'Guru Piket Bertugas';
  const stats = rag.stats || {};
  const absences = rag.absences || [];
  const notes = rag.generalNotes || 'KBM berjalan tertib, kegiatan ibadah dan pembiasaan pagi terlaksana baik.';

  let out = `*LAPORAN HARIAN GURU PIKET*\n`;
  out += `*${school.toUpperCase()}*\n`;
  out += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  out += `*Assalamu'alaikum Warahmatullahi Wabarakatuh*\n\n`;
  out += `Kepada Yth.\n`;
  out += `1. Kepala Madrasah ${school}\n`;
  out += `2. Waka Kurikulum & Kesiswaan\n`;
  out += `3. Bapak/Ibu Dewan Guru\n\n`;
  out += `Berikut kami sampaikan rekapan pelaksanaan KBM dan piket harian:\n\n`;
  out += `📅 *Hari, Tanggal:* ${day}, ${date}\n`;
  out += `👥 *Petugas Piket:* ${officers}\n\n`;
  out += `📊 *RINGKASAN KEHADIRAN KBM:*\n`;
  out += `• Total Slot KBM Terjadwal: *${stats.totalActiveSlots || 0} JP*\n`;
  out += `• KBM Terlaksana (Hadir): *${stats.presentSlots || 0} JP* (${stats.percentage || 100}%)\n`;
  out += `• Guru Berhalangan/Absen: *${stats.absentSlots || 0} JP*\n`;
  if ((stats.absentSlots || 0) > 0) {
    out += `   - Izin: ${stats.permitSlots || 0} JP\n`;
    out += `   - Sakit: ${stats.sickSlots || 0} JP\n`;
    out += `   - Tugas Luar: ${stats.dutySlots || 0} JP\n`;
    out += `   - Tanpa Keterangan: ${stats.unexcusedSlots || 0} JP\n`;
  }
  out += `\n`;

  out += `🔄 *RINCIAN KELAS DIDAMPINGI GURU PIKET:*\n`;
  if (absences.length === 0) {
    out += `✅ *Alhamdulillah NIHIL.* Seluruh dewan guru hadir sesuai jadwal KBM di kelas masing-masing.\n\n`;
  } else {
    absences.forEach((a: any, idx: number) => {
      const codeTag = a.teacherCode ? `[Kode ${a.teacherCode}] ` : '';
      const invalCodeTag = a.invalTeacherCode ? `[Kode ${a.invalTeacherCode}] ` : '';
      out += `*${idx + 1}. Kelas ${a.className} (${a.periodLabel})*\n`;
      out += `   • Guru Terjadwal: ${codeTag}${a.teacherName} (${a.subject})\n`;
      out += `   • Status: ${a.status} ${a.reason ? `(${a.reason})` : ''}\n`;
      out += `   • Guru Piket Pendamping: *${a.invalTeacher ? `${invalCodeTag}${a.invalTeacher}` : 'Petugas Guru Piket'}*\n`;
      out += `   • Tugas Siswa: ${a.task || 'Didampingi belajar mandiri oleh Guru Piket di kelas'}\n\n`;
    });
  }

  out += `📝 *CATATAN LAPORAN KONDISI MADRASAH:*\n`;
  out += `• ${notes}\n`;
  if (customNotes) {
    out += `• ${customNotes}\n`;
  }
  out += `\n`;

  out += `Demikian laporan piket harian ini kami sampaikan sebagai bahan evaluasi dan tindak lanjut. Terima kasih atas kerja sama Bapak/Ibu sekalian.\n\n`;
  out += `*Wassalamu'alaikum Warahmatullahi Wabarakatuh*\n\n`;
  out += `_Petugas Piket ${school}_\n`;
  out += `_${officers}_`;

  return out;
}

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server Piket MTs Al Mukhsin running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
