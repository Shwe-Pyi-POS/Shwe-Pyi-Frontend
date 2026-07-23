import React from "react";
import { Printer } from "lucide-react";
import {
  PRINT_PAPER_OPTIONS,
  PrintPaperSize,
} from "../../utils/printPaperSize";

interface PrintPaperSizeSelectorProps {
  value: PrintPaperSize;
  onChange: (size: PrintPaperSize) => void;
  disabled?: boolean;
}

export const PrintPaperSizeSelector: React.FC<PrintPaperSizeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
    <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 whitespace-nowrap">
      <Printer className="w-4 h-4" />
      Paper size
    </span>
    <div className="flex flex-wrap gap-2">
      {PRINT_PAPER_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.id)}
          title={option.description}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            value === option.id
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50"
          } disabled:opacity-50`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);
