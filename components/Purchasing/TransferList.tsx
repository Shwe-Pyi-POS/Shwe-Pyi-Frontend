import React, { useState } from "react";
import { Eye, Truck, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TransferData } from "../../services/Purchase/fetchTransfers";
import { updateTransferStatus } from "../../services/Purchase/updateTransferStatus";

interface TransferListProps {
  transferList: TransferData[];
  onViewTransfer?: (transfer: TransferData) => void;
  onStatusChange?: () => void;
}

export const TransferList: React.FC<TransferListProps> = ({
  transferList,
  onViewTransfer,
  onStatusChange,
}) => {
  const [transferFilter, setTransferFilter] = useState<"pending" | "completed">(
    "completed",
  );
  const [sourceTypeFilter, setSourceTypeFilter] = useState<"all" | "WAREHOUSE">(
    "all",
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleMarkCompleted = async (transfer: TransferData) => {
    setUpdatingId(transfer._id);
    try {
      const result = await updateTransferStatus(transfer._id, "completed");
      if (result.success) {
        toast.success(
          `Transfer ${transfer.transferNumber} marked as completed`,
        );
        onStatusChange?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to update transfer status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTransfers = transferList.filter((transfer) => {
    const status = transfer.status?.toLowerCase() || "";
    const sourceType = transfer.sourceType?.toLowerCase() || "";

    // Filter by status
    const statusMatch =
      transferFilter === "pending"
        ? status === "pending"
        : status === "completed" || status === "received";

    // Filter by source type
    const sourceTypeMatch =
      sourceTypeFilter === "all"
        ? true
        : sourceType === sourceTypeFilter.toLowerCase();

    return statusMatch && sourceTypeMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "received":
        return "bg-primary/20 text-primary-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-4 rounded-xl shadow-sm border gap-4 sm:gap-0">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          <Truck className="w-5 h-5 text-status-success" />
          Transfer List
        </h2>

        {/* Filter Tabs */}
        {/* <div className="flex gap-2 mb-4">
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setSourceTypeFilter("all")}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  sourceTypeFilter === "all"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                All Sources
              </button>

              <button
                onClick={() => setSourceTypeFilter("WAREHOUSE")}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  sourceTypeFilter === "WAREHOUSE"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                Warehouse
              </button>
            </div>
          </div> */}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="h-[calc(100vh-430px)] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b sticky top-0 z-10">
              <tr>
                <th className="p-4">Transfer Number</th>
                <th className="p-4">Source Type</th>
                <th className="p-4">Transfer Date</th>
                <th className="p-4">Items</th>
                <th className="p-4">Status</th>
                {/* <th className="p-4">Notes</th> */}
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No {transferFilter} transfers found
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((transfer) => (
                  <tr key={transfer._id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-primary">
                      {transfer.transferNumber}
                    </td>
                    <td className="p-4">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                        {transfer.sourceType}
                      </span>
                    </td>
                    <td className="p-4">
                      {new Date(transfer.transferDate).toDateString()}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                        {transfer.lineItems.length} item(s)
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(
                          transfer.status,
                        )}`}
                      >
                        {transfer.status.toUpperCase()}
                      </span>
                    </td>
                    {/* <td className="p-4 text-slate-500 truncate max-w-xs">
                      {transfer.notes || "-"}
                    </td> */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewTransfer?.(transfer)}
                          className="text-xs bg-primary/50 text-white px-3 py-1.5 rounded hover:bg-primary/70 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                        {transfer.status?.toLowerCase() === "pending" && (
                          <button
                            onClick={() => handleMarkCompleted(transfer)}
                            disabled={updatingId === transfer._id}
                            className="text-xs bg-green-50 text-status-success px-3 py-1.5 rounded hover:bg-green-100 border border-green-200 font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updatingId === transfer._id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />{" "}
                                Updating...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" /> Complete
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
