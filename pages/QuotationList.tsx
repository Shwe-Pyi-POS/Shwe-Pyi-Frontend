import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  ArrowRightLeft,
  Trash2,
  Pencil,
  Eye,
  AlertTriangle,
  X,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { DateRangePicker } from "../components/Reports/DateRangePicker";
import {
  fetchQuotations,
  deleteQuotation,
} from "../services/Quotation/quotationApi";
import {
  Quotation,
  QuotationPagination,
  QuotationSummary,
} from "../services/Quotation/quotationTypes";
import { QuotationStatusBadge } from "../components/Quotation/QuotationStatusBadge";
import {
  formatMMK,
  formatQuotationDate,
  formatDateForAPI,
  getStorefrontLabel,
} from "../components/Quotation/quotationUtils";
import { getQuotationProducts } from "../services/Quotation/quotationTypes";
import { ReportPagination } from "../components/PurchaseReport/ReportPagination";

export const QuotationList: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [status, setStatus] = useState("");
  const [saleType, setSaleType] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [debouncedCustomerName, setDebouncedCustomerName] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [summary, setSummary] = useState<QuotationSummary>({
    totalQuotations: 0,
    totalAmount: 0,
    totalProducts: 0,
  });
  const [pagination, setPagination] = useState<QuotationPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [userRole, setUserRole] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(
    null,
  );

  useEffect(() => {
    const stored = localStorage.getItem("adminData");
    if (stored) {
      try {
        setUserRole(JSON.parse(stored).role || "");
      } catch {
        setUserRole("");
      }
    }
  }, []);

  const canDelete = userRole === "owner" || userRole === "admin";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedCustomerName(customerName);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [customerName]);

  useEffect(() => {
    setPage(1);
  }, [status, saleType, debouncedCustomerName, startDate, endDate]);

  const loadQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchQuotations({
        status: status || undefined,
        saleType: saleType || undefined,
        customerName: debouncedCustomerName.trim() || undefined,
        page,
        limit,
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (res.success) {
        setQuotations(res.data.quotations);
        setSummary(res.data.summary);
        setPagination(res.data.pagination);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(t("quotation.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [
    status,
    saleType,
    debouncedCustomerName,
    startDate,
    endDate,
    page,
    limit,
    t,
  ]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const resetFilters = () => {
    setStatus("");
    setSaleType("");
    setCustomerName("");
    setDebouncedCustomerName("");
    setStartDate(null);
    setEndDate(null);
    setPage(1);
  };

  const openDeleteModal = (e: React.MouseEvent, quotation: Quotation) => {
    e.stopPropagation();
    setQuotationToDelete(quotation);
  };

  const closeDeleteModal = () => {
    if (deletingId) return;
    setQuotationToDelete(null);
  };

  const confirmDelete = async () => {
    if (!quotationToDelete) return;
    setDeletingId(quotationToDelete._id);
    const res = await deleteQuotation(quotationToDelete._id);
    setDeletingId(null);
    if (res.success) {
      toast.success(t("quotation.deleted"));
      setQuotationToDelete(null);
      loadQuotations();
    } else {
      toast.error(res.message);
    }
  };

  const stopNav = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-7 text-primary" />
            {t("quotation.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {t("quotation.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/quotations/create")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          {t("quotation.newQuotation")}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t("quotation.searchCustomer")}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t("quotation.searchCustomerPlaceholder")}
                className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t("common.status")}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{t("common.all")}</option>
              <option value="draft">{t("quotation.status.draft")}</option>
              <option value="converted">
                {t("quotation.status.converted")}
              </option>
              <option value="cancelled">
                {t("quotation.status.cancelled")}
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t("quotation.saleType")}
            </label>
            <select
              value={saleType}
              onChange={(e) => setSaleType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{t("common.all")}</option>
              <option value="storefront">
                {t("quotation.saleTypeStorefront")}
              </option>
              <option value="direct-sale">
                {t("quotation.saleTypeDirectSale")}
              </option>
            </select>
          </div>
          <div className="sm:col-span-1 lg:col-span-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              {t("quotation.dateRange")}
            </label>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(newStart, newEnd) => {
                setStartDate(newStart);
                setEndDate(newEnd);
              }}
            />
          </div>
          {/* <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1">
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50"
            >
              {t("common.reset")}
            </button>
            <button
              type="button"
              onClick={loadQuotations}
              className="px-4 py-2 border rounded-lg text-sm inline-flex items-center gap-1.5 hover:bg-slate-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t("common.refresh")}
            </button>
          </div> */}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: t("quotation.summary.totalQuotations"),
            value: summary.totalQuotations.toLocaleString(),
            color: "text-blue-600",
          },
          {
            label: t("quotation.summary.totalAmount"),
            value: formatMMK(summary.totalAmount),
            color: "text-emerald-600",
          },
          {
            label: t("quotation.summary.totalProducts"),
            value: summary.totalProducts.toLocaleString(),
            color: "text-violet-600",
          },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">
              {card.label}
            </p>
            <p className={`text-xl font-bold mt-1 ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            {t("common.loading")}
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">{t("quotation.empty")}</p>
            <p className="text-sm text-slate-400 mt-1">
              {t("quotation.emptyHint")}
            </p>
            <button
              type="button"
              onClick={() => navigate("/quotations/create")}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm"
            >
              {t("quotation.newQuotation")}
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                      {t("quotation.quotationNumber")}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                      {t("quotation.customer")}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">
                      {t("quotation.saleType")}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">
                      {t("quotation.products")}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">
                      {t("common.amount")}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">
                      {t("common.status")}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 hidden xl:table-cell">
                      {t("quotation.createdBy")}
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">
                      {t("common.date")}
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">
                      {t("common.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quotations.map((q) => {
                    const productCount = getQuotationProducts(q).length;
                    return (
                      <tr
                        key={q._id}
                        onClick={() => navigate(`/quotations/${q._id}`)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-primary">
                          {q.quotationNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div>{q.customerName || "—"}</div>
                          {q.customerPhone && (
                            <div className="text-xs text-slate-400">
                              {q.customerPhone}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {q.saleType === "direct-sale"
                            ? t("quotation.saleTypeDirectSale")
                            : getStorefrontLabel(q.storefrontId)}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-slate-600">
                          {productCount} {t("quotation.items")}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatMMK(q.finalAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <QuotationStatusBadge status={q.status} />
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell text-slate-600">
                          {q.createdBy?.name || "—"}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-slate-600">
                          {formatQuotationDate(q.createdAt)}
                        </td>
                        <td className="px-4 py-3" onClick={stopNav}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              title={t("common.view")}
                              onClick={() => navigate(`/quotations/${q._id}`)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {q.status === "draft" && (
                              <>
                                <button
                                  type="button"
                                  title={t("common.edit")}
                                  onClick={() =>
                                    navigate(`/quotations/${q._id}/edit`)
                                  }
                                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  title={t("quotation.convert.title")}
                                  onClick={() =>
                                    navigate(`/quotations/${q._id}`, {
                                      state: { openConvert: true },
                                    })
                                  }
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                                >
                                  <ArrowRightLeft className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {canDelete && q.status === "draft" && (
                              <button
                                type="button"
                                title={t("common.delete")}
                                disabled={deletingId === q._id}
                                onClick={(e) => openDeleteModal(e, q)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                              >
                                {deletingId === q._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ReportPagination
              pagination={pagination}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      {quotationToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-quotation-title"
          onClick={closeDeleteModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b flex justify-between items-center">
              <h2
                id="delete-quotation-title"
                className="text-lg font-bold text-slate-800 flex items-center gap-2"
              >
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                {t("common.delete")} {t("quotation.title")}
              </h2>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={Boolean(deletingId)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg disabled:opacity-50"
                aria-label={t("common.close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  {t("quotation.deleteConfirm")}
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">
                    {t("quotation.quotationNumber")}
                  </span>
                  <span className="font-medium text-slate-800 text-right">
                    {quotationToDelete.quotationNumber}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">
                    {t("quotation.customer")}
                  </span>
                  <span className="font-medium text-slate-800 text-right">
                    {quotationToDelete.customerName || "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500 shrink-0">
                    {t("common.amount")}
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatMMK(quotationToDelete.finalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={Boolean(deletingId)}
                  className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deletingId === quotationToDelete._id}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deletingId === quotationToDelete._id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("common.processing")}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      {t("common.delete")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
