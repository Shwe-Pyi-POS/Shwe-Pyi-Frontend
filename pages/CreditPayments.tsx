import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Receipt,
  Calendar,
  User,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  Wallet,
  Coins,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  CreditCard,
  Building2,
  Clock,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import {
  fetchAllCreditRecords,
  CreditPaymentRecord,
  CreditRecordsPagination,
} from "../services/Credit/fetchAllCreditRecords";
import { deleteCreditRecord } from "../services/Credit/deleteCreditRecord";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import { Order } from "../services/Order/fetchOrders";
import { OrderDetailModal } from "../components/Orders/OrderDetailModal";
import { ConfirmModal } from "../components/Common/ConfirmModal";

export const CreditPayments: React.FC = () => {
  const { t } = useLanguage();

  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData?.role;
  const isOwner = userRole === "owner";

  // State
  const [records, setRecords] = useState<CreditPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<CreditRecordsPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 15,
  });

  // Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<{
    id: string;
    amount: number;
    orderNumber: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Data
  const loadRecords = useCallback(async (targetPage = page) => {
    setLoading(true);
    try {
      const params: {
        page: number;
        limit: number;
        paymentMethod?: string;
        startDate?: string;
        endDate?: string;
      } = {
        page: targetPage,
        limit,
      };

      if (paymentMethodFilter !== "all") {
        params.paymentMethod = paymentMethodFilter;
      }

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await fetchAllCreditRecords(params);
      if (response.success && response.data) {
        setRecords(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        toast.error(response.message || t("creditPayments.loadingError"));
      }
    } catch (error) {
      console.error("Failed to load credit payments:", error);
      toast.error(t("creditPayments.loadingError") || "Failed to load payment records");
    } finally {
      setLoading(false);
    }
  }, [page, limit, paymentMethodFilter, startDate, endDate, t]);

  useEffect(() => {
    loadRecords(page);
  }, [loadRecords, page]);

  // Handle Date Presets
  const handleDatePresetChange = (preset: "all" | "today" | "week" | "month" | "custom") => {
    setDatePreset(preset);
    setPage(1);

    const now = new Date();
    const formatYMD = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = formatYMD(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "week") {
      const pastWeek = new Date();
      pastWeek.setDate(pastWeek.getDate() - 7);
      setStartDate(formatYMD(pastWeek));
      setEndDate(formatYMD(now));
    } else if (preset === "month") {
      const pastMonth = new Date();
      pastMonth.setDate(pastMonth.getDate() - 30);
      setStartDate(formatYMD(pastMonth));
      setEndDate(formatYMD(now));
    }
  };

  // Delete payment handler
  const handleDeletePayment = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    try {
      const response = await deleteCreditRecord(deletingRecord.id);
      if (response.success) {
        toast.success(t("creditPayments.deleteSuccess"));
        setDeletingRecord(null);
        await loadRecords(page);
      } else {
        toast.error(response.message || t("creditPayments.failedToDelete"));
      }
    } catch (error) {
      console.error("Delete payment error:", error);
      toast.error(t("creditPayments.failedToDelete"));
    } finally {
      setIsDeleting(false);
    }
  };

  // View Order Detail
  const handleViewOrder = async (orderId?: string) => {
    if (!orderId) {
      toast.error("Order ID not found");
      return;
    }
    setLoadingOrder(true);
    setLoadingOrderId(orderId);
    setSelectedOrder(null);
    try {
      const response = await fetchOrderById(orderId);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
      } else {
        toast.error(response.message || "Failed to load order");
      }
    } catch (error) {
      console.error("Error viewing order:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoadingOrder(false);
      setLoadingOrderId(null);
    }
  };

  // Client-side search filtering (across order number, customer, addedBy username, notes)
  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const query = search.toLowerCase().trim();
    return records.filter((r) => {
      const orderNum = r.orderId?.orderNumber?.toLowerCase() || "";
      const customerName = r.creditPersonId?.name?.toLowerCase() || "";
      const customerPhone = r.creditPersonId?.phone || "";
      const addedByName = r.addedBy?.name?.toLowerCase() || "";
      const addedByRole = r.addedBy?.role?.toLowerCase() || "";
      const notes = r.notes?.toLowerCase() || "";
      const method = r.paymentMethod?.toLowerCase() || "";

      return (
        orderNum.includes(query) ||
        customerName.includes(query) ||
        customerPhone.includes(query) ||
        addedByName.includes(query) ||
        addedByRole.includes(query) ||
        notes.includes(query) ||
        method.includes(query)
      );
    });
  }, [records, search]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = pagination.totalItems || records.length;
    const currentTotal = records.reduce((sum, r) => sum + (r.paidAmount || 0), 0);

    const todayStr = new Date().toISOString().split("T")[0];
    const todayTotal = records
      .filter((r) => r.paymentDate && r.paymentDate.startsWith(todayStr))
      .reduce((sum, r) => sum + (r.paidAmount || 0), 0);

    return {
      totalCount,
      currentTotal,
      todayTotal,
    };
  }, [records, pagination]);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const getMethodBadgeClass = (method: string) => {
    const m = method?.toLowerCase();
    switch (m) {
      case "cash":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "kbz_pay":
      case "kbz pay":
      case "kpay":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "wave_pay":
      case "wave pay":
      case "wave":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "bank_transfer":
      case "bank transfer":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "aya_pay":
      case "uab_pay":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getRoleBadgeClass = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "admin":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "cashier":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                {t("creditPayments.title")}
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                {t("creditPayments.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadRecords(page)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{t("common.refresh")}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {t("creditPayments.totalRecords")}
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">
              {stats.totalCount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {t("creditPayments.totalCollected")}
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">
              {stats.currentTotal.toLocaleString()}{" "}
              <span className="text-xs font-normal text-slate-500">MMK</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {t("creditPayments.todayCollection")}
            </p>
            <p className="text-2xl font-bold text-purple-600 mt-0.5">
              {stats.todayTotal.toLocaleString()}{" "}
              <span className="text-xs font-normal text-slate-500">MMK</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("creditPayments.searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Payment Method Filter */}
          <div className="md:col-span-3">
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
            >
              <option value="all">{t("creditPayments.allMethods")}</option>
              <option value="cash">Cash (ငွေသား)</option>
              <option value="kbz_pay">KBZ Pay</option>
              <option value="wave_pay">Wave Pay</option>
              <option value="aya_pay">AYA Pay</option>
              <option value="uab_pay">UAB Pay</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          {/* Date Presets */}
          <div className="md:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(["all", "today", "week", "month", "custom"] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleDatePresetChange(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  datePreset === preset
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {preset === "all"
                  ? "All Time"
                  : preset === "today"
                  ? "Today"
                  : preset === "week"
                  ? "7 Days"
                  : preset === "month"
                  ? "30 Days"
                  : "Custom"}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {datePreset === "custom" && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:border-primary"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
                className="text-xs text-rose-600 hover:underline font-medium"
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium">{t("creditPayments.loading")}</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Receipt className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-base font-semibold text-slate-600">
              {t("creditPayments.noRecords")}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              No matching credit payments found for current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5">{t("creditPayments.date")}</th>
                  <th className="px-4 py-3.5">{t("creditPayments.orderNumber")}</th>
                  <th className="px-4 py-3.5">{t("creditPayments.customer")}</th>
                  <th className="px-4 py-3.5 text-right">{t("creditPayments.amount")}</th>
                  <th className="px-4 py-3.5">{t("creditPayments.method")}</th>
                  <th className="px-4 py-3.5">{t("creditPayments.receivedBy")}</th>
                  <th className="px-4 py-3.5">{t("creditPayments.notes")}</th>
                  <th className="px-4 py-3.5 text-center">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredRecords.map((record) => {
                  const customerName = record.creditPersonId?.name || "—";
                  const customerPhone = record.creditPersonId?.phone;
                  const orderId =
                    typeof record.orderId === "object"
                      ? record.orderId?._id
                      : (record.orderId as string);
                  const orderNumber =
                    typeof record.orderId === "object"
                      ? record.orderId?.orderNumber
                      : (record.orderId || "—");
                  const addedByName = record.addedBy?.name || "System";
                  const addedByRole = record.addedBy?.role;

                  return (
                    <tr
                      key={record._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Date & Time */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTime(record.paymentDate)}</span>
                        </div>
                      </td>

                      {/* Order Number */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleViewOrder(orderId)}
                          className="font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-xs"
                          title="View Order details"
                        >
                          {orderNumber}
                        </button>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-xs">
                            {customerName}
                          </span>
                          {customerPhone && (
                            <span className="text-[11px] text-slate-400">
                              {customerPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Paid Amount */}
                      <td className="px-4 py-3 whitespace-nowrap text-right font-bold text-emerald-600">
                        +{record.paidAmount.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-slate-400">MMK</span>
                      </td>

                      {/* Payment Method */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getMethodBadgeClass(
                            record.paymentMethod
                          )}`}
                        >
                          {record.paymentMethod?.toUpperCase()}
                        </span>
                      </td>

                      {/* Received By (User & Role) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase border border-slate-200">
                            {addedByName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-tight">
                              {addedByName}
                            </p>
                            {addedByRole && (
                              <span
                                className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-medium uppercase ${getRoleBadgeClass(
                                  addedByRole
                                )}`}
                              >
                                {addedByRole}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                        {record.notes ? (
                          <span title={record.notes}>{record.notes}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewOrder(orderId)}
                            disabled={loadingOrderId === orderId}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors disabled:opacity-50"
                            title="View Order"
                          >
                            {loadingOrderId === orderId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>

                          {isOwner && (
                            <button
                              type="button"
                              onClick={() =>
                                setDeletingRecord({
                                  id: record._id,
                                  amount: record.paidAmount,
                                  orderNumber,
                                })
                              }
                              className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
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
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Showing page <span className="font-bold">{pagination.currentPage}</span> of{" "}
              <span className="font-bold">{pagination.totalPages}</span> (
              {pagination.totalItems} total records)
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pNum: number;
                if (pagination.totalPages <= 5) {
                  pNum = i + 1;
                } else if (page <= 3) {
                  pNum = i + 1;
                } else if (page >= pagination.totalPages - 2) {
                  pNum = pagination.totalPages - 4 + i;
                } else {
                  pNum = page - 2 + i;
                }

                return (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setPage(pNum)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      page === pNum
                        ? "bg-primary text-white shadow-sm"
                        : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                disabled={page >= pagination.totalPages || loading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={Boolean(selectedOrder || loadingOrder)}
        loading={loadingOrder}
        order={selectedOrder}
        onClose={() => {
          setSelectedOrder(null);
          setLoadingOrder(false);
        }}
        onOrderUpdate={() => loadRecords(page)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingRecord)}
        title="Delete Payment Record"
        message={`Are you sure you want to delete this payment record of ${deletingRecord?.amount?.toLocaleString()} MMK for Order ${deletingRecord?.orderNumber}? This will deduct the paid amount from the order balance.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        onConfirm={handleDeletePayment}
        onCancel={() => setDeletingRecord(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};
export default CreditPayments;
