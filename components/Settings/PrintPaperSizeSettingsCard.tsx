import React, { useState, useEffect } from "react";
import { Printer, Check } from "lucide-react";
import { toast } from "sonner";
import { PrintPaperSizeSelector } from "../Print/PrintPaperSizeSelector";
import {
  getSavedPrintPaperSize,
  savePrintPaperSize,
  PrintPaperSize,
  PRINT_PAPER_OPTIONS,
} from "../../utils/printPaperSize";

export const PrintPaperSizeSettingsCard: React.FC = () => {
  const [paperSize, setPaperSize] = useState<PrintPaperSize>(() =>
    getSavedPrintPaperSize(),
  );

  useEffect(() => {
    setPaperSize(getSavedPrintPaperSize());
  }, []);

  const handleChange = (size: PrintPaperSize) => {
    setPaperSize(size);
    savePrintPaperSize(size);
    const label =
      PRINT_PAPER_OPTIONS.find((o) => o.id === size)?.label ?? size;
    toast.success(`Default print size set to ${label}`);
  };

  const selectedOption = PRINT_PAPER_OPTIONS.find((o) => o.id === paperSize);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-1 flex items-center gap-2">
        <Printer className="w-5 h-5 text-blue-600" />
        Voucher Print Size
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Choose the default paper size for sales vouchers. Saved on this device
        and used when printing from POS.
      </p>

      <PrintPaperSizeSelector value={paperSize} onChange={handleChange} />

      {selectedOption && (
        <p className="mt-3 text-xs text-slate-500 flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-green-600" />
          {selectedOption.description}
        </p>
      )}
    </div>
  );
};
