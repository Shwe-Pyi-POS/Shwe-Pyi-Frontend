import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OrderPagination } from "../../services/Order/fetchOrders";
import { useLanguage } from "../../context/LanguageContext";

interface OrdersPaginationProps {
  pagination: OrderPagination;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export const OrdersPagination: React.FC<OrdersPaginationProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
}) => {
  const { t } = useLanguage();
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-slate-50">
      <p className="text-sm text-slate-600">
        {t("orders.paginationSummary")
          .replace("{page}", String(currentPage))
          .replace("{totalPages}", String(totalPages))
          .replace("{totalItems}", String(totalItems))}
      </p>
      <div className="flex items-center gap-2">
        {onLimitChange && (
          <select
            value={itemsPerPage}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-primary outline-none"
          >
            <option value={20}>20 / {t("orders.page")}</option>
            <option value={50}>50 / {t("orders.page")}</option>
            <option value={100}>100 / {t("orders.page")}</option>
          </select>
        )}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t("common.previous")}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-slate-700 min-w-[4rem] text-center">
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t("common.next")}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
