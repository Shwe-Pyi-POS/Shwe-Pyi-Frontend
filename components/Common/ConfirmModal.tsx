import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: "red" | "blue" | "green" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  confirmButtonColor = "red",
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const getButtonColorClasses = () => {
    switch (confirmButtonColor) {
      case "red":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "blue":
        return "bg-blue-600 hover:bg-blue-700 text-white";
      case "green":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "primary":
        return "bg-primary hover:bg-primary/90 text-white";
      default:
        return "bg-red-600 hover:bg-red-700 text-white";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
              <p className="text-sm text-slate-600">{message}</p>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {cancelText || t("common.cancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${getButtonColorClasses()}`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {t("common.processing")}
                </>
              ) : (
                confirmText || t("common.confirm")
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
