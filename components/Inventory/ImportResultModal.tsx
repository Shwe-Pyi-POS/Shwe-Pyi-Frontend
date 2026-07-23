import React from "react";
import { X, CheckCircle2, AlertCircle, Info, ChevronRight } from "lucide-react";
import { ImportExcelResponse } from "../../services/Inventory/importExcel";
import { useLanguage } from "../../context/LanguageContext";

interface ImportResultModalProps {
  isOpen: boolean;
  result: ImportExcelResponse | null;
  onClose: () => void;
}

export const ImportResultModal: React.FC<ImportResultModalProps> = ({
  isOpen,
  result,
  onClose,
}) => {
  const { t } = useLanguage();

  if (!isOpen || !result) return null;

  const { total, success, failed, errors } = result.data;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${failed > 0 ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {failed > 0 ? <Info className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-800">
                {failed > 0 ? "Import Completed with Issues" : "Import Successful"}
              </h3>
              <p className="text-sm text-slate-500">{result.message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Rows</p>
              <p className="text-2xl font-black text-slate-800">{total}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Success</p>
              <p className="text-2xl font-black text-emerald-700">{success}</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-center">
              <p className="text-xs text-rose-600 font-bold uppercase tracking-wider mb-1">Failed</p>
              <p className="text-2xl font-black text-rose-700">{failed}</p>
            </div>
          </div>

          {/* Errors Section */}
          {errors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <AlertCircle className="w-5 h-5" />
                <h4>Detailed Error Log</h4>
              </div>
              <div className="border border-rose-100 rounded-2xl overflow-hidden bg-rose-50/30">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-rose-50 text-rose-700 text-xs uppercase sticky top-0">
                      <tr>
                        <th className="px-4 py-3 font-black">Row</th>
                        <th className="px-4 py-3 font-black">Error Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                      {errors.map((error, idx) => (
                        <tr key={idx} className="hover:bg-rose-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 text-rose-700 font-bold text-sm">
                              {error.row}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {error.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Success Message if no errors */}
          {errors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">Perfect Import!</h4>
              <p className="text-slate-500 max-w-xs">All records have been successfully added to your inventory without any issues.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
