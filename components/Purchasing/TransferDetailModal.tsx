import React, { useEffect, useState } from "react";
import { Modal } from "../Modal";
import { fetchTransferById } from "../../services/Purchase/fetchTransferById";
import { TransferData } from "../../services/Purchase/fetchTransfers";
import {
  fetchProductById,
  ProductDetail,
} from "../../services/Inventory/fetchProductById";
import {
  Package,
  Calendar,
  FileText,
  Hash,
  Truck,
  Warehouse,
  CheckCircle,
} from "lucide-react";

interface TransferDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferId: string | null;
}

export const TransferDetailModal: React.FC<TransferDetailModalProps> = ({
  isOpen,
  onClose,
  transferId,
}) => {
  const [transfer, setTransfer] = useState<TransferData | null>(null);
  const [loading, setLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<
    Record<string, ProductDetail>
  >({});

  useEffect(() => {
    if (isOpen && transferId) {
      loadTransferDetails();
    }
  }, [isOpen, transferId]);

  const loadTransferDetails = async () => {
    if (!transferId) return;
    setLoading(true);
    try {
      const res = await fetchTransferById(transferId);
      if (res.success && res.data) {
        setTransfer(res.data);

        // Fetch product details for each line item
        const productPromises = res.data.lineItems.map(async (item) => {
          console.log("item", item);
          if (item.inventoryId) {
            const productRes = await fetchProductById(item.inventoryId._id);
            if (productRes.success && productRes.data) {
              return { [item.inventoryId._id]: productRes.data };
            }
          }
          return null;
        });

        const productResults = await Promise.all(productPromises);
        const products = productResults.reduce((acc, result) => {
          if (result) {
            return { ...acc, ...result };
          }
          return acc;
        }, {});

        setProductDetails(products);
      }
    } catch (error) {
      console.error("Failed to load transfer details", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "completed":
        return "bg-green-100 text-green-700 border-green-300";
      case "received":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const handleClose = () => {
    setTransfer(null);
    onClose();
  };

  const totalQuantity =
    transfer?.lineItems.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Helper function to extract ID from string or object
  const getDisplayId = (
    value:
      | string
      | {
          _id?: string;
          locationCode?: string;
          locationName?: string;
          storefrontCode?: string;
          storefrontName?: string;
        }
      | null
      | undefined,
  ): string => {
    if (!value) return "-";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      return value._id || value.locationCode || value.storefrontCode || "-";
    }
    return "-";
  };

  // Helper function to get display name from object
  const getDisplayName = (
    value:
      | string
      | {
          _id?: string;
          locationCode?: string;
          locationName?: string;
          storefrontCode?: string;
          storefrontName?: string;
        }
      | null
      | undefined,
  ): string => {
    if (!value) return "-";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      return (
        value.locationName ||
        value.storefrontName ||
        value.locationCode ||
        value.storefrontCode ||
        value._id ||
        "-"
      );
    }
    return "-";
  };

  // Helper function to get inventory ID from string or object
  const getInventoryId = (item: any): string => {
    if (!item?.inventoryId) return "-";
    if (typeof item.inventoryId === "string") {
      return item.inventoryId.substring(0, 12);
    }
    if (typeof item.inventoryId === "object") {
      return item.inventoryId._id?.substring(0, 12) || "-";
    }
    return "-";
  };

  // console.log(transfer);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Transfer Details">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-slate-500">
            Loading transfer details...
          </span>
        </div>
      ) : transfer ? (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Hash className="w-4 h-4" />
                Transfer Number
              </div>
              <div className="font-bold text-lg text-blue-600">
                {transfer.transferNumber}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                Transfer Date
              </div>
              <div className="font-bold text-lg">
                {new Date(transfer.transferDate).toDateString()}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Truck className="w-4 h-4" />
                Source Type
              </div>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-700 border border-purple-300">
                {transfer.sourceType}
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <CheckCircle className="w-4 h-4" />
                Status
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(
                  transfer.status,
                )}`}
              >
                {transfer.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Source & Destination Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 text-purple-700 text-sm font-semibold mb-2">
                <FileText className="w-4 h-4" />
                Source ID
              </div>
              <div
                className="text-purple-800 font-mono text-sm truncate"
                title={getDisplayId(transfer.sourceId as any)}
              >
                {getDisplayName(transfer.sourceId as any)}
              </div>
              {typeof transfer.sourceId === "object" && transfer.sourceId && (
                <div className="text-purple-600 text-xs mt-1">
                  ID: {(transfer.sourceId as any)._id?.substring(0, 12) || "-"}
                </div>
              )}
            </div>

            {transfer.destinationWarehouseId === null ? (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold mb-2">
                  <Warehouse className="w-4 h-4" />
                  Destination Storefront
                </div>
                <div
                  className="text-green-800 font-mono text-sm truncate"
                  title={getDisplayId(transfer.destinationStorefrontId as any)}
                >
                  {getDisplayName(transfer.destinationStorefrontId as any)}
                </div>
                {typeof transfer.destinationStorefrontId === "object" &&
                  transfer.destinationStorefrontId && (
                    <div className="text-green-600 text-xs mt-1">
                      ID:{" "}
                      {(transfer.destinationStorefrontId as any)._id?.substring(
                        0,
                        12,
                      ) || "-"}
                    </div>
                  )}
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 text-sm font-semibold mb-2">
                  <Warehouse className="w-4 h-4" />
                  Destination Warehouse
                </div>
                <div
                  className="text-green-800 font-mono text-sm truncate"
                  title={getDisplayId(transfer.destinationWarehouseId as any)}
                >
                  {getDisplayName(transfer.destinationWarehouseId as any)}
                </div>
                {typeof transfer.destinationWarehouseId === "object" &&
                  transfer.destinationWarehouseId && (
                    <div className="text-green-600 text-xs mt-1">
                      ID:{" "}
                      {(transfer.destinationWarehouseId as any)._id?.substring(
                        0,
                        12,
                      ) || "-"}
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {transfer.lineItems.length}
              </div>
              <div className="text-sm text-blue-600">Total Items</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {totalQuantity}
              </div>
              <div className="text-sm text-indigo-600">Total Quantity</div>
            </div>
          </div>

          {/* Received Date */}
          {/* {transfer.receivedDate && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 text-sm font-semibold mb-2">
                <Calendar className="w-4 h-4" />
                Received Date
              </div>
              <div className="text-green-800 font-medium">
                {new Date(transfer.receivedDate).toLocaleString()}
              </div>
            </div>
          )} */}

          {/* Notes */}
          {transfer.notes && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold mb-2">
                <FileText className="w-4 h-4" />
                Notes
              </div>
              <p className="text-amber-800">{transfer.notes}</p>
            </div>
          )}

          {/* Line Items */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Line Items ({transfer.lineItems.length})
            </h3>
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 text-left">#</th>
                    <th className="p-3 text-left">Product Name</th>
                    <th className="p-3 text-center">Quantity</th>
                    {/* <th className="p-3 text-left">GRN Line Item ID</th> */}
                    <th className="p-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transfer.lineItems.map((item, index) => (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500">{index + 1}</td>
                      <td className="p-3 font-mono text-xs truncate max-w-xs">
                        {item.inventoryId?.productName || "-"}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                          {item.quantity}
                        </span>
                      </td>
                      {/* <td
                        className="p-3 font-mono text-xs truncate max-w-xs"
                        title={
                          item.grnLineItemId
                            ? typeof item.grnLineItemId === "string"
                              ? item.grnLineItemId
                              : (item.grnLineItemId as any)?._id || "-"
                            : "-"
                        }
                      >
                        {item.grnLineItemId
                          ? typeof item.grnLineItemId === "string"
                            ? item.grnLineItemId.substring(0, 12).concat("...")
                            : (item.grnLineItemId as any)?._id
                                ?.substring(0, 12)
                                ?.concat("...") || "-"
                          : "-"}
                      </td> */}
                      <td className="p-3 text-slate-500">
                        {item.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex justify-between text-xs text-slate-500 pt-4 border-t">
            <div>Created: {new Date(transfer.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(transfer.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          No transfer data available
        </div>
      )}
    </Modal>
  );
};
