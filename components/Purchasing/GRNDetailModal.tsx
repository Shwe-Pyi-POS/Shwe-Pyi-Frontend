import React, { useEffect, useState } from "react";
import { Modal } from "../Modal";
import { GRNData } from "../../services/Purchase/fetchGRNs";
import { fetchGRNById } from "../../services/Purchase/fetchGRNById";
import { updateGRNLineItems } from "../../services/Purchase/updateGRNLineItems";
import { UpdateLineItemModal } from "./UpdateLineItemModal";
import { toast } from "sonner";
import {
  Package,
  Calendar,
  FileText,
  Hash,
  DollarSign,
  Edit2,
} from "lucide-react";

interface GRNDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  grnId: string | null;
  onGRNUpdate?: () => void; // Callback to refresh GRN list
}

export const GRNDetailModal: React.FC<GRNDetailModalProps> = ({
  isOpen,
  onClose,
  grnId,
  onGRNUpdate,
}) => {
  const [grn, setGrn] = useState<GRNData | null>(null);
  const [loading, setLoading] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedLineItem, setSelectedLineItem] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && grnId) {
      loadGRNDetails();
    }
  }, [isOpen, grnId]);

  const loadGRNDetails = async () => {
    if (!grnId) return;
    setLoading(true);
    try {
      const res = await fetchGRNById(grnId);
      if (res.success && res.data) {
        setGrn(res.data);
      }
    } catch (error) {
      console.error("Failed to load GRN details", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "verified":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "completed":
        return "bg-green-100 text-green-700 border-green-300";
      case "transferred":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const handleClose = () => {
    setGrn(null);
    setUpdateModalOpen(false);
    setSelectedLineItem(null);
    onClose();
  };

  const handleUpdateLineItem = (lineItem: any) => {
    setSelectedLineItem(lineItem);
    setUpdateModalOpen(true);
  };

  const handleSaveLineItem = async (
    lineItemId: string,
    goodQuantity: number,
    badQuantity: number,
    notes: string
  ) => {
    if (!grnId) return;

    setUpdating(true);
    try {
      const result = await updateGRNLineItems(grnId, [
        {
          lineItemId,
          goodQuantity,
          badQuantity,
          notes,
        },
      ]);

      if (result.success) {
        // Refresh GRN data to show updated values
        await loadGRNDetails();
        // Refresh GRN list in parent component
        onGRNUpdate?.();
        setUpdateModalOpen(false);
        setSelectedLineItem(null);
      } else {
        console.error("Failed to update line item:", result.message);
        toast.error("Failed to update line item: " + result.message);
      }
    } catch (error) {
      console.error("Error updating line item:", error);
      toast.error("Error updating line item: " + error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="GRN Details">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-slate-500">Loading GRN details...</span>
        </div>
      ) : grn ? (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Hash className="w-4 h-4" />
                GRN Number
              </div>
              <div className="font-bold text-lg text-blue-600">
                {grn.grnNumber}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                GRN Date
              </div>
              <div className="font-bold text-lg">
                {new Date(grn.grnDate).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                Total Amount
              </div>
              <div className="font-bold text-lg text-green-600">
                {grn.totalAmount.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <FileText className="w-4 h-4" />
                Status
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(
                  grn.status
                )}`}
              >
                {grn.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {grn.totalReceivedQuantity}
              </div>
              <div className="text-sm text-blue-600">Total Received</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
              <div className="text-2xl font-bold text-green-600">
                {grn.totalGoodQuantity}
              </div>
              <div className="text-sm text-green-600">Good Quantity</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
              <div className="text-2xl font-bold text-red-600">
                {grn.totalBadQuantity}
              </div>
              <div className="text-sm text-red-600">Bad Quantity</div>
            </div>
          </div>

          {/* Notes */}
          {grn.notes && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold mb-2">
                <FileText className="w-4 h-4" />
                Notes
              </div>
              <p className="text-amber-800">{grn.notes}</p>
            </div>
          )}

          {/* Line Items */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Line Items ({grn.lineItems.length})
            </h3>
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-left">SKU</th>
                    <th className="p-3 text-center">Received</th>
                    <th className="p-3 text-center">Good</th>
                    <th className="p-3 text-center">Bad</th>
                    <th className="p-3 text-center">Available</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total Price</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {grn.lineItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-medium">
                          {item.inventoryId?.productName || "Unknown Product"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.inventoryId?.productCode || "-"}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">
                        {item.inventoryId?.SKU || "-"}
                      </td>
                      <td className="p-3 text-center font-medium">
                        {item.receivedQuantity}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                          {item.goodQuantity}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                          {item.badQuantity}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                          {item.availableQuantity}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        {item.unitPrice.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {item.totalPrice.toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleUpdateLineItem(item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Update Line Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex justify-between text-xs text-slate-500 pt-4 border-t">
            <div>Created: {new Date(grn.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(grn.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          No GRN data available
        </div>
      )}

      {/* Update Line Item Modal */}
      <UpdateLineItemModal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        lineItem={selectedLineItem}
        onSave={handleSaveLineItem}
        updating={updating}
      />
    </Modal>
  );
};
