import React, { useState, useEffect } from "react";
import { X, Truck } from "lucide-react";
import { Order } from "../../services/Order/fetchOrders";

interface TransportFeeEditModalProps {
  order: Order;
  onSave: (transportFee: number, finalAmount: number, paidAmount: number) => void;
  onClose: () => void;
}

export const TransportFeeEditModal: React.FC<TransportFeeEditModalProps> = ({
  order,
  onSave,
  onClose,
}) => {
  const originalSubtotal = order.subTotal || 0;
  const originalTransportFee = order.transportFee ?? 0;
  const originalFinalAmount = order.finalAmount || 0;
  const originalPaidAmount = order.paidAmount || 0;

  const [transportFee, setTransportFee] = useState(originalTransportFee);
  const [finalAmount, setFinalAmount] = useState(originalFinalAmount);
  const [paidAmount, setPaidAmount] = useState(originalPaidAmount);

  useEffect(() => {
    const delta = transportFee - originalTransportFee;
    setFinalAmount(originalSubtotal + transportFee);
    setPaidAmount(originalPaidAmount + delta);
  }, [transportFee]);

  const handleSubmit = () => {
    onSave(transportFee, finalAmount, paidAmount);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-purple-50">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-lg text-slate-800">
              Edit Transport Fee
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Transport Fee */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Transport Fee (MMK)
            </label>
            <input
              type="number"
              min="0"
              autoFocus
              className="w-full border border-purple-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              value={transportFee || ""}
              onChange={(e) => setTransportFee(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          {/* Final Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Final Amount (MMK){" "}
              <span className="text-xs text-slate-400 font-normal">(auto-updated)</span>
            </label>
            <input
              type="number"
              min="0"
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2.5 text-sm outline-none text-slate-700"
              value={finalAmount}
              readOnly
            />
          </div>

          {/* Paid Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Paid Amount (MMK)
            </label>
            <input
              type="number"
              min="0"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              value={paidAmount || ""}
              onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          {/* Comparison */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Original:</span>
              <span>
                Subtotal {originalSubtotal.toLocaleString()} + Transport{" "}
                {originalTransportFee.toLocaleString()} ={" "}
                <span className="font-bold">{originalFinalAmount.toLocaleString()}</span>
              </span>
            </div>
            <div className="flex justify-between text-purple-600 font-medium">
              <span>Updated:</span>
              <span>
                Subtotal {originalSubtotal.toLocaleString()} + Transport{" "}
                {transportFee.toLocaleString()} ={" "}
                <span className="font-bold">{finalAmount.toLocaleString()}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-bold shadow-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
