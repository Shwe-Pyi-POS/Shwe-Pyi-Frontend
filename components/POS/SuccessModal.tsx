import React from "react";

interface SuccessModalProps {
  showSuccessModal: boolean;
  setShowSuccessModal: (val: boolean) => void;
  setSuccessOrderNumber: (val: string) => void;
  t: (key: string) => string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  showSuccessModal,
  setShowSuccessModal,
  setSuccessOrderNumber,
  t,
}) => {
  if (!showSuccessModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center">
          <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4">
            <svg
              className="w-12 h-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t("pos.saleCompleted")}
          </h2>
          <p className="text-green-50 text-sm">
            Your order has been processed successfully
          </p>
        </div>

        <div className="p-6 pt-6">
          <button
            onClick={() => {
              setShowSuccessModal(false);
              setSuccessOrderNumber("");
            }}
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors shadow-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
