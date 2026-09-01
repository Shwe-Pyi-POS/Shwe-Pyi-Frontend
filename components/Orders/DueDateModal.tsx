import React, { useState, useEffect } from "react";
import { Calendar, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Order } from "../../services/Order/fetchOrders";
import { updateOrderDueDate } from "../../services/Order/updateOrderDueDate";
import { parseDueDateString } from "./orderUtils";
import { SingleDateCalendar } from "../Common/SingleDateCalendar";
import { useLanguage } from "../../context/LanguageContext";

interface DueDateModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onDueDateUpdated: () => void;
}

const formatDateForAPI = (date: Date | null): string | null => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const DueDateModal: React.FC<DueDateModalProps> = ({
  isOpen,
  order,
  onClose,
  onDueDateUpdated,
}) => {
  const { t } = useLanguage();
  const [newDueDate, setNewDueDate] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (order) {
      setNewDueDate(order.dueDate ? order.dueDate.split("T")[0] : "");
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleUpdateDueDate = async () => {
    if (!newDueDate) return;

    setUpdating(true);
    try {
      const response = await updateOrderDueDate(order._id, newDueDate);
      if (response.success) {
        toast.success(t("creditOrders.dueDateUpdated"));
        onDueDateUpdated();
        onClose();
      } else {
        toast.error(response.message || t("creditOrders.failedToUpdateDueDate"));
      }
    } catch (error) {
      console.error("Error updating due date:", error);
      toast.error(t("creditOrders.failedToUpdateDueDate"));
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveDueDate = async () => {
    if (!order.dueDate) return;

    setUpdating(true);
    try {
      const response = await updateOrderDueDate(order._id, null);
      if (response.success) {
        toast.success(t("creditOrders.dueDateRemoved"));
        onDueDateUpdated();
        onClose();
      } else {
        toast.error(response.message || t("creditOrders.failedToRemoveDueDate"));
      }
    } catch (error) {
      console.error("Error removing due date:", error);
      toast.error(t("creditOrders.failedToRemoveDueDate"));
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              {t("creditOrders.editDueDateTitle")}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t("creditOrders.orderNumber")}
              </label>
              <div className="p-2 bg-slate-50 rounded-lg text-slate-600 text-sm font-semibold">
                {order.orderNumber}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("creditOrders.selectDueDate")}
              </label>
              <SingleDateCalendar
                value={newDueDate ? parseDueDateString(newDueDate) : null}
                onChange={(date) => {
                  const formatted = formatDateForAPI(date);
                  if (formatted) setNewDueDate(formatted);
                }}
              />
            </div>
          </div>

          {order.dueDate && (
            <button
              type="button"
              onClick={handleRemoveDueDate}
              disabled={updating}
              className="w-full mt-4 py-2.5 px-4 rounded-xl border border-red-200 text-red-700 font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {updating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {t("creditOrders.removeDueDate")}
            </button>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              disabled={updating}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {t("creditOrders.cancel")}
            </button>
            <button
              onClick={handleUpdateDueDate}
              disabled={updating || !newDueDate}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
              {updating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {t("creditOrders.updatingDueDate")}
                </>
              ) : (
                t("creditOrders.confirm")
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
