import React from "react";
import { QuotationStatus } from "../../services/Quotation/quotationTypes";
import { useLanguage } from "../../context/LanguageContext";

const STYLES: Record<
  QuotationStatus,
  { dot: string; badge: string }
> = {
  draft: {
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  converted: {
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  cancelled: {
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-800 border-red-200",
  },
};

interface QuotationStatusBadgeProps {
  status: QuotationStatus;
  className?: string;
}

export const QuotationStatusBadge: React.FC<QuotationStatusBadgeProps> = ({
  status,
  className = "",
}) => {
  const { t } = useLanguage();
  const style = STYLES[status] || STYLES.draft;
  const labelKey = `quotation.status.${status}` as const;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.badge} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {t(labelKey)}
    </span>
  );
};
