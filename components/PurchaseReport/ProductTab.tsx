import React, { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DateRangePicker } from "../Reports/DateRangePicker";
import { fetchSuppliers } from "../../services/Supplier/fetchSuppliers";
import { fetchCategories } from "../../services/Inventory/fetchCategories";
import {
  fetchPurchaseProductReport,
  PurchaseProductReportItem,
  PurchaseProductReportTotals,
  ReportPagination,
} from "../../services/Reports/fetchPurchaseReport";
import { Supplier } from "../../types";
import { formatMMK, ReceivedProgressBar } from "./purchaseReportUtils";
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

export const ProductTab: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | null>(getToday());
  const [endDate, setEndDate] = useState<Date | null>(getToday());
  const [supplierId, setSupplierId] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("totalOrdered");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<PurchaseProductReportTotals | null>(null);
  const [products, setProducts] = useState<PurchaseProductReportItem[]>([]);
  const [pagination, setPagination] = useState<ReportPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchSuppliers().then((res) => {
      if (res.success) setSuppliers(res.data);
    });
    fetchCategories().then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPurchaseProductReport({
        page,
        limit,
        supplierId: supplierId || undefined,
        category: category || undefined,
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        sortBy,
        sortOrder,
      });
      if (res.success) {
        setTotals(res.data.totals);
        setProducts(res.data.products);
        setPagination(res.data.pagination);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to load product report");
    } finally {
      setLoading(false);
    }
  }, [page, limit, supplierId, category, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-4 flex flex-col gap-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
            setPage(1);
          }}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s._id || s.id} value={s._id || s.id}>
                {s.supplierName}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="totalOrdered">Sort: Total Ordered</option>
            <option value="totalReceived">Sort: Total Received</option>
            <option value="totalAmount">Sort: Total Amount</option>
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
        </div>
        <button
          type="button"
          onClick={loadReport}
          disabled={loading}
          className="self-start flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Products</p>
              <p className="text-2xl font-bold">{totals.uniqueProducts}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Total Ordered</p>
              <p className="text-2xl font-bold text-blue-600">
                {totals.totalOrdered.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Received</p>
              <p className="text-2xl font-bold text-green-600">
                {totals.totalReceived.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Remaining</p>
              <p className="text-2xl font-bold text-amber-600">
                {totals.totalRemaining.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border">
              <p className="text-xs text-slate-500 uppercase font-bold">Total Amount</p>
              <p className="text-lg font-bold text-primary">
                {formatMMK(totals.totalAmount)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[960px]">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-600">Product</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Code</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Category</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Unit</th>
                    <th className="px-4 py-3 font-medium text-slate-600 text-right">
                      Ordered
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-600">Progress</th>
                    <th className="px-4 py-3 font-medium text-slate-600 text-right">
                      Remaining
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-600 text-right">
                      Amount
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-600 text-right">
                      POs
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.inventoryId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">{p.productName}</td>
                        <td className="px-4 py-3 text-slate-500">{p.productCode}</td>
                        <td className="px-4 py-3">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-xs">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">{p.unitOfMeasure}</td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {p.totalOrdered.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 min-w-[140px]">
                          <ReceivedProgressBar
                            received={p.totalReceived}
                            ordered={p.totalOrdered}
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-amber-600">
                          {p.totalRemaining.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">
                          {formatMMK(p.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right">{p.poCount}</td>
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
