import React, { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DateRangePicker } from "../Reports/DateRangePicker";
import {
  fetchPurchaseSupplierReport,
  PurchaseSupplierReportItem,
  PurchaseSupplierReportTotals,
  ReportPagination,
} from "../../services/Reports/fetchPurchaseReport";
import { formatMMK, formatDate } from "./purchaseReportUtils";
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

interface SupplierTabProps {
  onSupplierClick?: (supplierId: string) => void;
}

export const SupplierTab: React.FC<SupplierTabProps> = ({ onSupplierClick }) => {
  const [startDate, setStartDate] = useState<Date | null>(getToday());
  const [endDate, setEndDate] = useState<Date | null>(getToday());
  const [sortBy, setSortBy] = useState("totalAmount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<PurchaseSupplierReportTotals | null>(null);
  const [suppliers, setSuppliers] = useState<PurchaseSupplierReportItem[]>([]);
  const [pagination, setPagination] = useState<ReportPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPurchaseSupplierReport({
        page,
        limit,
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        sortBy,
        sortOrder,
      });
      if (res.success) {
        setTotals(res.data.totals);
        setSuppliers(res.data.suppliers);
        setPagination(res.data.pagination);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to load supplier report");
    } finally {
      setLoading(false);
    }
  }, [page, limit, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

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
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="totalAmount">Sort: Total Amount</option>
          <option value="totalPOs">Sort: Total POs</option>
          <option value="totalOrdered">Sort: Total Ordered</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => {
            setSortOrder(e.target.value as "asc" | "desc");
            setPage(1);
          }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        <button
          type="button"
          onClick={loadReport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && !totals ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : totals ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Suppliers</p>
              <p className="text-2xl font-bold">{totals.totalSuppliers}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Total POs</p>
              <p className="text-2xl font-bold">{totals.totalPOs}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-green-100">
              <p className="text-xs text-slate-500 uppercase font-bold">Amount</p>
              <p className="text-lg font-bold text-green-700">
                {formatMMK(totals.totalAmount)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Ordered</p>
              <p className="text-2xl font-bold text-blue-600">
                {totals.totalOrdered.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Received</p>
              <p className="text-2xl font-bold text-primary">
                {totals.totalReceived.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Remaining</p>
              <p className="text-2xl font-bold text-amber-600">
                {totals.totalRemaining.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[1000px]">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-600">Supplier</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Code</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Contact</th>
                    <th className="px-4 py-3 font-medium text-slate-600 text-right">
                      POs
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-600 text-right">
                      Amount
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-600 text-right">
                      Ordered
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-600 text-right">
                      Received
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-600 text-right">
                      Remaining
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-600">Last PO</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                        No suppliers found
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((s) => (
                      <tr key={s.supplierId} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => onSupplierClick?.(s.supplierId)}
                            className="font-medium text-primary hover:underline text-left"
                          >
                            {s.supplierName}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{s.supplierCode}</td>
                        <td className="px-4 py-3 text-slate-600">{s.contactNumber}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {s.totalPOs}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">
                          {formatMMK(s.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {s.totalOrdered.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-primary">
                          {s.totalReceived.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-amber-600">
                          {s.totalRemaining.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(s.lastPODate)}
                        </td>
                      </tr>
                    ))
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
