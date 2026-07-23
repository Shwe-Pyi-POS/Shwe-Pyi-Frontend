import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReportPagination as PaginationType } from "../../services/Reports/fetchPurchaseReport";

interface ReportPaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export const ReportPagination: React.FC<ReportPaginationProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
}) => {
  const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t bg-slate-50">
      <p className="text-sm text-slate-600">
        Page {currentPage} of {totalPages} ({totalItems} items)
      </p>
      <div className="flex items-center gap-2">
        {onLimitChange && (
          <select
            value={itemsPerPage}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="text-sm border rounded-lg px-2 py-1"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        )}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-2 border rounded-lg hover:bg-white disabled:opacity-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-2 border rounded-lg hover:bg-white disabled:opacity-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
