/**
 * Utility for exporting HTML content to Microsoft Word (.doc) format
 */
export function downloadHtmlAsWord(filename: string, title: string, bodyHtml: string): void {
  const header = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      font-family: Calibri, 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.3;
      color: #1a1a1a;
      padding: 20px;
    }
    h1, h2, h3 {
      font-family: Arial, sans-serif;
      color: #0f3e28;
      margin-bottom: 4px;
    }
    .header-kop {
      text-align: center;
      border-bottom: 3px double #1a1a1a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .kop-title {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kop-sub {
      font-size: 12pt;
      font-weight: bold;
    }
    .kop-address {
      font-size: 9pt;
      color: #555;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 9.5pt;
    }
    th, td {
      border: 1px solid #777;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background-color: #e6f3eb;
      color: #0f3e28;
      font-weight: bold;
      text-align: center;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bg-dark {
      background-color: #334155;
      color: #94a3b8;
    }
    .status-hadir { color: #047857; font-weight: bold; }
    .status-sakit { color: #be123c; font-weight: bold; }
    .status-izin { color: #b45309; font-weight: bold; }
    .status-alpa { color: #b91c1c; font-weight: bold; }
    .footer-signatures {
      margin-top: 30px;
      width: 100%;
    }
    .sig-table {
      border: none;
      width: 100%;
    }
    .sig-table td {
      border: none;
      padding: 10px;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

  const blob = new Blob(['\ufeff', header], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}
