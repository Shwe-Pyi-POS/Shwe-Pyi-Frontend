import React, { useState } from "react";
import {
  Plus,
  Eye,
  CheckCircle,
  Warehouse,
  Store,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { GRNData } from "../../services/Purchase/fetchGRNs";
import { updateGRNStatus } from "../../services/Purchase/updateGRNStatus";
import { toast } from "sonner";

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface GRNListProps {
  grnList: GRNData[];
  setIsCreateModalOpen: (isOpen: boolean) => void;
  onViewGRN?: (grn: GRNData) => void;
  onStatusChange?: (page?: number, limit?: number) => void;
  onTransferGRN?: (grn: GRNData) => void;
  onTransferGRNToStorefront?: (grn: GRNData) => void;
  pagination: PaginationData;
}

export const GRNList: React.FC<GRNListProps> = ({
  grnList,
  setIsCreateModalOpen,
  onViewGRN,
  onStatusChange,
  onTransferGRN,
  onTransferGRNToStorefront,
  pagination,
}) => {
  const [grnFilter, setGrnFilter] = useState<"pending" | "completed">(
    "pending"
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (grnId: string, newStatus: string) => {
    setUpdatingId(grnId);
    try {
      const res = await updateGRNStatus(grnId, newStatus);
      if (res.success) {
        toast.success("GRN status updated successfully");
        onStatusChange?.(pagination.currentPage, pagination.itemsPerPage);
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Failed to update GRN status", error);
      toast.error(error.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredGRNs = grnList.filter((grn) => {
    const status = grn.status?.toLowerCase() || "";
    if (grnFilter === "pending") {
      return status === "pending";
    } else {
      return (
        status === "verified" ||
        status === "completed" ||
        status === "transferred"
      );
    }
  });

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      onStatusChange?.(page, pagination.itemsPerPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    onStatusChange?.(1, newLimit);
  };

  const renderPagination = () => {
    const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;

    if (totalPages <= 1 && totalItems <= 10) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            Showing {startItem} to {endItem} of {totalItems} results
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-slate-600">entries</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  page === currentPage
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:bg-slate-50 border"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "verified":
        return "bg-purple-100 text-purple-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "transferred":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
        <h2 className="font-bold text-lg text-slate-800">
          Goods Received Notes List
        </h2>
        {/* <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Create New GRN
        </button> */}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setGrnFilter("pending")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            grnFilter === "pending"
              ? "bg-slate-800 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setGrnFilter("completed")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            grnFilter === "completed"
              ? "bg-primary text-white"
              : "bg-white text-slate-600 hover:bg-slate-50 border"
          }`}
        >
          Completed
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="h-[calc(100vh-450px)] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b sticky top-0 z-10">
              <tr>
                <th className="p-4">GRN Number</th>
                <th className="p-4">Date</th>
                <th className="p-4">Items</th>
                <th className="p-4">Received Qty</th>
                <th className="p-4">Good / Bad</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Notes</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredGRNs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No {grnFilter} GRNs found
                  </td>
                </tr>
              ) : (
                filteredGRNs.map((grn) => (
                  <tr key={grn._id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-blue-600">
                      {grn.grnNumber}
                    </td>
                    <td className="p-4">
                      {new Date(grn.grnDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                        {grn.lineItems.length} item(s)
                      </span>
                    </td>
                    <td className="p-4 font-medium">
                      {grn.totalReceivedQuantity}
                    </td>
                    <td className="p-4">
                      <span className="text-green-600 font-medium">
                        {grn.totalGoodQuantity}
                      </span>
                      {" / "}
                      <span className="text-red-600 font-medium">
                        {grn.totalBadQuantity}
                      </span>
                    </td>
                    <td className="p-4 font-medium">
                      {grn.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(
                          grn.status
                        )}`}
                      >
                        {grn.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 truncate max-w-xs">
                      {grn.notes || "-"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewGRN?.(grn)}
                          className="text-xs bg-primary/50 text-yellow-800 px-3 py-1.5 rounded hover:bg-yellow-100 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        {grn.status?.toLowerCase() === "pending" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(grn._id, "verified")
                            }
                            disabled={updatingId === grn._id}
                            className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded hover:bg-purple-100 border border-purple-200 font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <CheckCircle className="w-3 h-3" />
                            {updatingId === grn._id ? "..." : "Verify"}
                          </button>
                        )}
                        {grn.status?.toLowerCase() === "verified" &&
                          grn.lineItems.some(
                            (item) => item.availableQuantity > 0
                          ) && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTransferGRN?.(grn);
                                }}
                                className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100 border border-green-200 font-medium transition-colors flex items-center gap-1"
                              >
                                <Warehouse className="w-3 h-3" /> To Warehouse
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onTransferGRNToStorefront) {
                                    onTransferGRNToStorefront(grn);
                                  } else {
                                    toast.error(
                                      "Transfer to storefront is not available"
                                    );
                                  }
                                }}
                                className="text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded hover:bg-orange-100 border border-orange-200 font-medium transition-colors flex items-center gap-1"
                              >
                                <Store className="w-3 h-3" /> To Storefront
                              </button>
                            </>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {renderPagination()}
      </div>
    </div>
  );
};
