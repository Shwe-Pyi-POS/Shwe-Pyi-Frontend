import React from "react";
import { X, UserPlus, User } from "lucide-react";
import { Order } from "../../services/Order/fetchOrders";
import { CreditPersona } from "../../services/Credit/fetchCreditPersonas";

interface CreditPersonModalProps {
  isOpen: boolean;
  order: Order | null;
  creditPersonas: CreditPersona[];
  assigning: boolean;
  onClose: () => void;
  onAssign: (creditPersonId: string) => void;
}

export const CreditPersonModal: React.FC<CreditPersonModalProps> = ({
  isOpen,
  order,
  creditPersonas,
  assigning,
  onClose,
  onAssign,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b bg-orange-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-600" />
            Assign Credit Person
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4">
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              Order:{" "}
              <span className="font-bold text-blue-600">{order.orderNumber}</span>
            </p>
            <p className="text-sm text-slate-600">
              Amount:{" "}
              <span className="font-bold">
                {order.finalAmount?.toLocaleString()} MMK
              </span>
            </p>
          </div>

          <p className="text-sm text-slate-500 mb-3">
            Select a credit person to assign to this order:
          </p>

          {creditPersonas.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>No credit persons available</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {creditPersonas.map((persona) => (
                <button
                  key={persona._id}
                  onClick={() => onAssign(persona._id)}
                  disabled={assigning}
                  className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{persona.name}</p>
                    <p className="text-sm text-slate-500">{persona.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t bg-slate-50">
          <button
            onClick={onClose}
            disabled={assigning}
            className="w-full py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

