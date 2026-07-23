import React from "react";
import { toast } from "sonner";
import { X, Calculator } from "lucide-react";

interface MarkupCalculatorProps {
  showMarkupCalculator: boolean;
  setShowMarkupCalculator: (val: boolean) => void;
  markupAmount: number;
  setMarkupAmount: (val: number) => void;
  subtotal: number;
  t: (key: string) => string;
}

export const MarkupCalculator: React.FC<MarkupCalculatorProps> = ({
  showMarkupCalculator,
  setShowMarkupCalculator,
  markupAmount,
  setMarkupAmount,
  subtotal,
  t,
}) => {
  if (!showMarkupCalculator) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Fixed Amount Markup
          </h2>
          <button
            onClick={() => {
              setShowMarkupCalculator(false);
            }}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-500 mb-1">Current Subtotal</p>
            <p className="text-2xl font-bold text-slate-800">
              {subtotal.toLocaleString()} MMK
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Markup Amount (MMK)
            </label>
            <input
              type="number"
              min="0"
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Enter markup amount..."
              value={markupAmount}
              onChange={(e) => setMarkupAmount(Number(e.target.value))}
            />
          </div>

          {markupAmount > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Markup Amount:</span>
                <span className="font-bold text-blue-700">
                  {markupAmount.toLocaleString()} MMK
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Percentage:</span>
                <span className="font-bold text-blue-700">
                  {((markupAmount / subtotal) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Final Total:</span>
                <span className="font-bold text-slate-800">
                  {(subtotal + markupAmount).toLocaleString()} MMK
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setShowMarkupCalculator(false);
              }}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (markupAmount > 0) {
                  setShowMarkupCalculator(false);
                  toast.success(
                    `Markup set to ${markupAmount.toLocaleString()} MMK`,
                  );
                }
              }}
              disabled={!markupAmount || markupAmount <= 0}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Markup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
