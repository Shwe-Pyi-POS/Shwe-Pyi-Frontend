import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  FileText,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { DateRangePicker } from "../Reports/DateRangePicker";
import { fetchSuppliers } from "../../services/Supplier/fetchSuppliers";
import {
  fetchPurchaseReport,
  PurchaseReportPurchase,
  PurchaseReportSummary,
  ReportPagination,
} from "../../services/Reports/fetchPurchaseReport";
import { Supplier } from "../../types";
import {
  formatMMK,
  formatDate,
  getSupplierFromPurchase,
  POStatusBadge,
} from "./purchaseReportUtils";
import { ReportPagination as PaginationBar } from "./ReportPagination";

const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateForAPI = (date: Date | null): string | null => {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

interface OverviewTabProps {
  initialSupplierId?: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  initialSupplierId = "",
}) => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date | null>(getToday());
  const [endDate, setEndDate] = useState<Date | null>(getToday());
  const [status, setStatus] = useState("");
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PurchaseReportSummary | null>(null);
  const [purchases, setPurchases] = useState<PurchaseReportPurchase[]>([]);
  const [pagination, setPagination] = useState<ReportPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setSupplierId(initialSupplierId);
    setPage(1);
  }, [initialSupplierId]);

  useEffect(() => {
    fetchSuppliers().then((res) => {
      if (res.success) setSuppliers(res.data);
    });
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPurchaseReport({
        page,
        limit,
        status: status || undefined,
        supplierId: supplierId || undefined,
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
      });
      if (res.success) {
        setSummary(res.data.summary);
        setPurchases(res.data.purchases);
        setPagination(res.data.pagination);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to load purchase report");
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, supplierId, startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const totalReceivedOnPO = (po: PurchaseReportPurchase) =>
    po.products.reduce((s, p) => s + (p.receivedQuantity || 0), 0);
  const totalOrderedOnPO = (po: PurchaseReportPurchase) =>
    po.products.reduce((s, p) => s + (p.purchaseQuantity || 0), 0);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4 flex flex-col lg:flex-row lg:items-end gap-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
            setPage(1);
          }}
        />
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2 text-sm flex-1"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="arrived">Arrived</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2 text-sm flex-1"
          >
            <option value="">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s._id || s.id} value={s._id || s.id}>
                {s.supplierName}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={loadReport}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && !summary ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Total POs</p>
              <p className="text-2xl font-bold text-slate-800">{summary.totalPOs}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-green-100">
              <p className="text-xs text-slate-500 uppercase font-bold">Total Amount</p>
              <p className="text-lg font-bold text-green-700">
                {formatMMK(summary.totalAmount)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Ordered</p>
              <p className="text-2xl font-bold text-blue-600">
                {summary.totalProductsOrdered.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Received</p>
              <p className="text-2xl font-bold text-primary">
                {summary.totalReceived.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Remaining</p>
              <p className="text-2xl font-bold text-amber-600">
                {summary.totalRemaining.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(summary.statusBreakdown).map(([key, count]) => (
              <span key={key} className="inline-flex items-center gap-1">
                <POStatusBadge status={key} />
                <span className="text-sm font-medium text-slate-600">{count}</span>
              </span>
            ))}
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[900px]">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-3 py-3 w-8" />
                    <th className="px-3 py-3 font-medium text-slate-600">PO Number</th>
                    <th className="px-3 py-3 font-medium text-slate-600">Supplier</th>
                    <th className="px-3 py-3 font-medium text-slate-600">Status</th>
                    <th className="px-3 py-3 font-medium text-slate-600 text-right">
                      Amount
                    </th>
                    <th className="px-3 py-3 font-medium text-slate-600 text-right">
                      Products
                    </th>
                    <th className="px-3 py-3 font-medium text-slate-600 text-right">
                      Received
                    </th>
                    <th className="px-3 py-3 font-medium text-slate-600 text-right">
                      Remaining
                    </th>
                    <th className="px-3 py-3 font-medium text-slate-600">Created By</th>
                    <th className="px-3 py-3 font-medium text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                        No purchase orders found
                      </td>
                    </tr>
                  ) : (
                    purchases.map((po) => {
                      const supplier = getSupplierFromPurchase(po.supplierId);
                      const isExpanded = expandedId === po._id;
                      const received = totalReceivedOnPO(po);
                      const ordered = totalOrderedOnPO(po);
                      const remaining =
                        po.totalRemainingQuantity ??
                        Math.max(0, ordered - received);

                      return (
                        <React.Fragment key={po._id}>
                          <tr className="hover:bg-slate-50">
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedId(isExpanded ? null : po._id)
                                }
                                className="p-1 hover:bg-slate-100 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate("/purchasing", {
                                    state: { viewPoId: po._id },
                                  })
                                }
                                className="font-medium text-primary hover:underline flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {po.poNumber}
                              </button>
                            </td>
                            <td className="px-3 py-3">
                              <p className="font-medium">{supplier.name}</p>
                              {supplier.code && (
                                <p className="text-xs text-slate-500">{supplier.code}</p>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <POStatusBadge status={po.status} />
                            </td>
                            <td className="px-3 py-3 text-right font-semibold">
                              {formatMMK(po.totalAmount)}
                            </td>
                            <td className="px-3 py-3 text-right">{po.products.length}</td>
                            <td className="px-3 py-3 text-right text-green-600">
                              {received}/{ordered}
                            </td>
                            <td className="px-3 py-3 text-right text-amber-600">
                              {remaining}
                            </td>
                            <td className="px-3 py-3 text-slate-600">
                              {po.purchasedBy?.name || "—"}
                            </td>
                            <td className="px-3 py-3 text-slate-500">
                              {formatDate(po.createdAt)}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/80">
                              <td colSpan={10} className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase">
                                  <Package className="w-4 h-4" />
                                  Products
                                </div>
                                <table className="w-full text-xs bg-white rounded-lg border">
                                  <thead className="bg-slate-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left">Product</th>
                                      <th className="px-3 py-2 text-left">Code</th>
                                      <th className="px-3 py-2 text-right">Ordered</th>
                                      <th className="px-3 py-2 text-right">Received</th>
                                      <th className="px-3 py-2 text-right">Remaining</th>
                                      <th className="px-3 py-2 text-right">Price</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y">
                                    {po.products.map((p, idx) => (
                                      <tr key={`${p.inventoryId}-${idx}`}>
                                        <td className="px-3 py-2">{p.productName}</td>
                                        <td className="px-3 py-2">{p.productCode}</td>
                                        <td className="px-3 py-2 text-right">
                                          {p.purchaseQuantity}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          {p.receivedQuantity}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          {p.remainingQuantity}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          {formatMMK(p.buyingPrice)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <PaginationBar
              pagination={pagination}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};
