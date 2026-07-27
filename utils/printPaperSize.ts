export type PrintPaperSize = "A4" | "A5" | "thermal-80mm";

export const PRINT_PAPER_SIZE_KEY = "voucherPrintPaperSize";

export interface PrintPaperOption {
  id: PrintPaperSize;
  label: string;
  description: string;
}

export const PRINT_PAPER_OPTIONS: PrintPaperOption[] = [
  { id: "A4", label: "A4", description: "Standard invoice (210 × 297 mm)" },
  { id: "A5", label: "A5", description: "Compact invoice (148 × 210 mm)" },
  {
    id: "thermal-80mm",
    label: "Thermal 80mm",
    description: "Receipt printer roll (80 mm wide)",
  },
];

export const getSavedPrintPaperSize = (): PrintPaperSize => {
  const saved = localStorage.getItem(PRINT_PAPER_SIZE_KEY);
  if (saved === "thermal-88mm") {
    localStorage.setItem(PRINT_PAPER_SIZE_KEY, "thermal-80mm");
    return "thermal-80mm";
  }
  if (saved === "A4" || saved === "A5" || saved === "thermal-80mm") {
    return saved;
  }
  return "A4";
};

export const savePrintPaperSize = (size: PrintPaperSize) => {
  localStorage.setItem(PRINT_PAPER_SIZE_KEY, size);
};

export const parsePrintPaperSize = (
  value: string | null,
): PrintPaperSize | null => {
  if (value === "thermal-88mm") return "thermal-80mm";
  if (value === "A4" || value === "A5" || value === "thermal-80mm") {
    return value;
  }
  return null;
};

export const getPrintPaperStyles = (paperSize: PrintPaperSize): string => {
  const base = `
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: white !important;
      margin: 0;
      padding: 0;
    }
    .no-print {
      display: none !important;
    }
    .voucher-container {
      margin: 0 auto !important;
      background: white !important;
      box-sizing: border-box;
    }
  `;

  switch (paperSize) {
    case "A5":
      return `
        ${base}
        @media print {
          @page { size: A5; margin: 4mm; }
          .voucher-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 4mm !important;
          }
        }
        @media screen {
          .voucher-container {
            max-width: 148mm;
            min-height: 210mm;
            padding: 6mm;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
        }
        .voucher-container { font-size: 10px; }
        .voucher-logo { width: 50px !important; height: 50px !important; }
        .voucher-shop-name { font-size: 14px !important; margin-top: 4px !important; }
        .text-center.mb-4.sm\\:mb-8 { margin-bottom: 8px !important; }
        .voucher-invoice-row { margin-bottom: 8px !important; font-size: 9px !important; }
        .voucher-table { margin: 8px 0 !important; }
        .voucher-table th { padding: 4px 6px !important; font-size: 9px; }
        .voucher-table td { padding: 4px 6px !important; font-size: 9px; }
        .voucher-total-bar { font-size: 11px !important; padding: 4px 8px !important; }
        .voucher-footer-title { font-size: 10px !important; margin-top: 8px !important; }
        .voucher-sign { margin-top: 12px !important; }
        .voucher-summary-grid { display: flex !important; flex-direction: column !important; gap: 0.5rem !important; }
        .voucher-summary-grid > div:first-child { order: 2; }
        .voucher-summary-grid > div:last-child { order: 1; }
      `;
    case "thermal-80mm":
      return `
        ${base}
        @media print {
          @page { size: 80mm auto; margin: 2mm; }
          .voucher-container {
            width: 80mm !important;
            max-width: 80mm !important;
            padding: 2mm !important;
          }
        }
        @media screen {
          .voucher-container {
            width: 80mm !important;
            min-width: 80mm !important;
            max-width: 80mm !important;
            padding: 3mm !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          }
        }
        .voucher-container {
          font-family: Arial, sans-serif;
          font-size: 10px;
          line-height: 1.35;
          overflow-x: hidden;
        }
        .voucher-logo { width: 48px !important; height: 48px !important; }
        .voucher-shop-name { font-size: 14px !important; font-weight: 800 !important; }
        .voucher-address { font-size: 9px !important; }
        .voucher-invoice-row { font-size: 9px !important; margin-bottom: 2mm; }
        .voucher-thermal-table {
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }
        .voucher-thermal-item,
        .voucher-thermal-header {
          display: grid;
          width: 100%;
          box-sizing: border-box;
          column-gap: 0.4mm;
          grid-template-columns: 5mm 17mm 14mm 7mm 11mm 14mm;
        }
        .voucher-thermal-item {
          padding: 1.2mm 0;
          border-bottom: 1px dashed #ccc;
          font-size: 8px;
          align-items: start;
        }
        .voucher-thermal-header {
          align-items: center;
          background: #1E90FF !important;
          color: white !important;
          padding: 1.2mm 0.4mm;
          font-weight: bold;
          font-size: 7px;
        }
        .voucher-thermal-header > div,
        .voucher-thermal-item > div {
          min-width: 0;
        }
        .voucher-thermal-col-item {
          white-space: normal;
          word-break: break-word;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.25;
          max-height: 2.6em;
        }
        .voucher-thermal-col-item.is-long {
          text-decoration: underline;
          text-underline-offset: 1px;
        }
        .voucher-thermal-item > div:not(.voucher-thermal-col-item) {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .voucher-thermal-col-price,
        .voucher-thermal-col-total,
        .voucher-thermal-col-qty,
        .voucher-thermal-item > div:first-child,
        .voucher-thermal-item > div:nth-child(5) {
          align-self: center;
        }
        .voucher-thermal-col-price,
        .voucher-thermal-col-total,
        .voucher-thermal-col-qty {
          text-align: right;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .voucher-thermal-col-total {
          font-weight: 700;
        }
        .voucher-summary-grid { display: block !important; width: 100%; }
        .voucher-summary-grid > div {
          width: 100%;
          max-width: 100%;
        }
        .voucher-summary-grid > div:last-child { margin-top: 3mm; }
        .voucher-summary-grid .flex.justify-between {
          width: 100%;
          gap: 1mm;
          font-size: 9px;
        }
        .voucher-summary-grid .flex.justify-between > span:last-child {
          white-space: nowrap;
          flex-shrink: 0;
        }
        .voucher-total-bar { font-size: 11px !important; padding: 2mm !important; }
        .voucher-footer-title { font-size: 10px !important; margin-top: 4mm !important; }
        .voucher-sign { display: none; }
        .voucher-contact-bar {
          flex-direction: column !important;
          gap: 1mm;
          font-size: 8px !important;
          text-align: center;
        }
      `;
    case "A4":
    default:
      return `
        ${base}
        @media print {
          @page { size: A4; margin: 10mm; }
          .voucher-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 15mm !important;
          }
        }
        @media screen {
          .voucher-container {
            max-width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
        }
        .voucher-container { font-size: 13px; }
        .voucher-logo { width: 120px !important; height: 120px !important; }
        .voucher-shop-name { font-size: 1.25rem !important; }
        .voucher-table th { padding: 12px; font-size: 12px; }
        .voucher-table td { padding: 12px; font-size: 13px; }
        .voucher-total-bar { font-size: 1rem !important; }
        .voucher-footer-title { font-size: 1.125rem !important; }
      `;
  }
};

export const getSharedTableStyles = (): string => `
  .voucher-table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
  }
  .voucher-table th {
    background-color: #1E90FF;
    color: white;
    text-align: center;
    font-weight: 700;
    text-transform: uppercase;
  }
  .voucher-table th:first-child { text-align: left; }
  .voucher-table th:last-child { text-align: right; }
  .voucher-table td {
    background-color: #E8E8E8;
    color: #000;
    border-bottom: 3px solid white;
  }
  .voucher-table td:first-child { text-align: left; }
  .voucher-table td:nth-child(2) { text-align: left; }
  .voucher-table td:nth-child(3),
  .voucher-table td:nth-child(4),
  .voucher-table td:nth-child(5) { text-align: center; }
  .voucher-table td:last-child { text-align: right; font-weight: 600; }
`;
