import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Role } from "../types";
import {
  Shield,
  AlertTriangle,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Truck,
  FileText,
  ChevronLeft,
  ChevronRight,
  Store,
  History,
} from "lucide-react";
import {
  fetchStockAuditLogs,
  StockAuditLog,
} from "../services/StockAudit/fetchStockAuditLogs";
import {
  fetchTransfers,
  TransferData,
} from "../services/Purchase/fetchTransfers";
import { toast } from "sonner";
import { TransferList } from "../components/Purchasing/TransferList";
import { TransferDetailModal } from "../components/Purchasing/TransferDetailModal";
import { ShopSettingsTab } from "../components/Settings/ShopSettingsTab";
import { ActivityLogTab } from "../components/Settings/ActivityLogTab";

export const Settings: React.FC = () => {
  const { currentUser, setUserRole, logs } = useApp();
  const [stockAuditLogs, setStockAuditLogs] = useState<StockAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [transferList, setTransferList] = useState<TransferData[]>([]);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(
    null,
  );
  const [isTransferDetailModalOpen, setIsTransferDetailModalOpen] =
    useState(false);
  const [activeTab, setActiveTab] = useState<
    "audit" | "transfer" | "shop" | "activity"
  >("shop");

  const loadStockAuditLogs = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetchStockAuditLogs(page, limit);
      if (response.success && response.data) {
        setStockAuditLogs(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setCurrentPage(Number(response.pagination.currentPage));
          setTotalItems(response.pagination.totalItems);
        }
      } else {
        toast.error(response.message || "Failed to load stock audit logs");
      }
    } catch (error) {
      console.error("Error loading stock audit logs:", error);
      toast.error("Failed to load stock audit logs");
    } finally {
      setLoading(false);
    }
  };

  const loadTransfers = async () => {
    try {
      const res = await fetchTransfers();
      if (res.success) {
        setTransferList(res.data.reverse());
      }
    } catch (error) {
      console.error("Failed to load transfers", error);
      toast.error("Failed to load transfers");
    }
  };

  const handleViewTransfer = (transfer: TransferData) => {
    setSelectedTransferId(transfer._id);
    setIsTransferDetailModalOpen(true);
  };

  useEffect(() => {
    loadStockAuditLogs(1);
  }, [limit]);

  useEffect(() => {
    loadTransfers();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-4 sm:p-6 max-w-full">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-slate-800">
        System Settings
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab("shop")}
          className={`px-3 sm:px-4 py-2 sm:py-2 font-semibold flex items-center gap-1 sm:gap-2 transition-colors whitespace-nowrap ${
            activeTab === "shop"
              ? "border-b-2 border-blue-800 text-blue-800"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Store className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Shop Settings</span>
          <span className="sm:hidden">Shop</span>
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-3 sm:px-4 py-2 sm:py-2 font-semibold flex items-center gap-1 sm:gap-2 transition-colors whitespace-nowrap ${
            activeTab === "audit"
              ? "border-b-2 border-blue-800 text-blue-800"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
          <span className="hidden sm:inline">Stock Audit Logs</span>
          <span className="sm:hidden">Audit</span>
        </button>
        <button
          onClick={() => setActiveTab("transfer")}
          className={`px-3 sm:px-4 py-2 sm:py-2 font-semibold flex items-center gap-1 sm:gap-2 transition-colors whitespace-nowrap ${
            activeTab === "transfer"
              ? "border-b-2 border-blue-800 text-blue-800"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Truck className="w-3 h-3 sm:w-4 sm:h-4" />{" "}
          <span className="hidden sm:inline">Transfer Management</span>
          <span className="sm:hidden">Transfers</span>
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`px-3 sm:px-4 py-2 sm:py-2 font-semibold flex items-center gap-1 sm:gap-2 transition-colors whitespace-nowrap ${
            activeTab === "activity"
              ? "border-b-2 border-blue-800 text-blue-800"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <History className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Activity Log</span>
          <span className="sm:hidden">Activity</span>
        </button>
      </div>

      {/* Shop Settings Tab */}
      {activeTab === "shop" && <ShopSettingsTab />}

      {/* Audit Logs Tab */}
      {activeTab === "audit" && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" />{" "}
              Stock Audit Logs
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border">
                <span className="text-xs font-medium text-slate-600">
                  Show:
                </span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <button
                onClick={() => loadStockAuditLogs(currentPage)}
                disabled={loading}
                className="flex items-center gap-2 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 sm:p-8 text-center text-slate-500">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm sm:text-base">
                Loading stock audit logs...
              </p>
            </div>
          ) : stockAuditLogs.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-slate-500">
              <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm sm:text-base">No stock audit logs found</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="">
                <div className="overflow-x-auto h-[calc(100vh-350px)] sm:h-[calc(100vh-400px)] overflow-y-auto">
                  <table className="w-full text-sm text-left min-w-[1000px]">
                    <thead className="bg-slate-50 border-b sticky top-0 z-10">
                      <tr>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Date</span>
                          <span className="sm:hidden">Date</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Product</span>
                          <span className="sm:hidden">Product</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Location</span>
                          <span className="sm:hidden">Location</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Action</span>
                          <span className="sm:hidden">Action</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600 text-right">
                          <span className="hidden sm:inline">Before</span>
                          <span className="sm:hidden">Before</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600 text-right">
                          <span className="hidden sm:inline">After</span>
                          <span className="sm:hidden">After</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600 text-right">
                          <span className="hidden sm:inline">Change</span>
                          <span className="sm:hidden">Change</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Admin</span>
                          <span className="sm:hidden">Admin</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Reason</span>
                          <span className="sm:hidden">Reason</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {stockAuditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-50">
                          <td className="px-2 sm:px-4 py-3 text-slate-500 text-xs">
                            <span className="truncate">
                              {formatDate(log.createdAt)}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <div className="font-medium text-slate-800 text-xs sm:text-sm">
                              <span
                                className="truncate"
                                title={log.inventoryId?.productName}
                              >
                                {log.inventoryId?.productName}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              <span
                                className="truncate"
                                title={`${log.inventoryId?.productCode} | ${log.inventoryId?.SKU}`}
                              >
                                {log.inventoryId?.productCode} |{" "}
                                {log.inventoryId?.SKU}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <div className="font-medium text-slate-800 text-xs sm:text-sm">
                              <span
                                className="truncate"
                                title={log.locationId?.locationName}
                              >
                                {log.locationId?.locationName}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              <span
                                className="truncate"
                                title={`${log.locationId?.locationCode} (${log.locationType})`}
                              >
                                {log.locationId?.locationCode} (
                                {log.locationType})
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                log.action === "add"
                                  ? "bg-green-100 text-green-700"
                                  : log.action === "remove"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right font-medium text-slate-700 text-xs sm:text-sm">
                            {log.beforeQuantity.toLocaleString()}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right font-medium text-slate-700 text-xs sm:text-sm">
                            {log.afterQuantity.toLocaleString()}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {log.isIncrease ? (
                                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                              ) : log.isDecrease ? (
                                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                              ) : null}
                              <span
                                className={`font-bold text-xs sm:text-sm ${
                                  log.isIncrease
                                    ? "text-green-600"
                                    : log.isDecrease
                                      ? "text-red-600"
                                      : "text-slate-600"
                                }`}
                              >
                                {log.isIncrease
                                  ? "+"
                                  : log.isDecrease
                                    ? "-"
                                    : ""}
                                {Math.abs(log.quantityChange).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-slate-600 text-xs sm:text-sm">
                            <div className="font-medium text-slate-800 text-xs sm:text-sm">
                              {log?.adminId?.name || "-"}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                              {log?.adminId?.role}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-slate-500 text-xs w-[600px]">
                            <span className="" title={log?.reason || "-"}>
                              {log?.reason || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-4 py-3 border-t flex items-center justify-between bg-slate-50">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => loadStockAuditLogs(currentPage - 1)}
                      disabled={currentPage <= 1 || loading}
                      className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => loadStockAuditLogs(currentPage + 1)}
                      disabled={currentPage >= totalPages || loading}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-700">
                        Showing{" "}
                        <span className="font-medium">
                          {(currentPage - 1) * limit + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(currentPage * limit, totalItems)}
                        </span>{" "}
                        of <span className="font-medium">{totalItems}</span>{" "}
                        results
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() => loadStockAuditLogs(currentPage - 1)}
                          disabled={currentPage <= 1 || loading}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Page Numbers */}
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => loadStockAuditLogs(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNum
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}

                        <button
                          onClick={() => loadStockAuditLogs(currentPage + 1)}
                          disabled={currentPage >= totalPages || loading}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === "activity" && <ActivityLogTab />}

      {/* Transfer Management Tab */}
      {activeTab === "transfer" && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />{" "}
              Transfer Management
            </h2>
            <button
              onClick={loadTransfers}
              className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
          <TransferList
            transferList={transferList}
            onViewTransfer={handleViewTransfer}
            onStatusChange={loadTransfers}
          />
        </div>
      )}

      {/* Transfer Detail Modal */}
      <TransferDetailModal
        isOpen={isTransferDetailModalOpen}
        onClose={() => setIsTransferDetailModalOpen(false)}
        transferId={selectedTransferId}
      />
    </div>
  );
};
