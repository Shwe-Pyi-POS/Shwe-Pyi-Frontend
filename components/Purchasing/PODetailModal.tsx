import React, { useEffect, useState } from "react";
import { Modal } from "../Modal";
import {
  fetchPurchaseById,
  PurchaseDetail,
} from "../../services/Purchase/fetchPurchaseById";
import { Supplier } from "../../types";
import {
  Package,
  Calendar,
  FileText,
  Hash,
  DollarSign,
  User,
  CheckCircle,
  Clock,
} from "lucide-react";

interface PODetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: string | null;
  suppliers: Supplier[];
}

export const PODetailModal: React.FC<PODetailModalProps> = ({
  isOpen,
  onClose,
  purchaseId,
  suppliers,
}) => {
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && purchaseId) {
      loadPurchaseDetails();
    }
  }, [isOpen, purchaseId]);

  const loadPurchaseDetails = async () => {
    if (!purchaseId) return;
    setLoading(true);
    try {
      const res = await fetchPurchaseById(purchaseId);
      if (res.success && res.data) {
        setPurchase(res.data);
      }
    } catch (error) {
      console.error("Failed to load purchase details", error);
    } finally {
      setLoading(false);
    }
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(
      (s) => s.id === supplierId || s._id === supplierId
    );
    return supplier ? supplier.supplierName : "Unknown Supplier";
  };

  const getProductStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "received":
        return "bg-green-100 text-green-700 border-green-300";
      case "partial":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "arrived":
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
    setPurchase(null);
    onClose();
  };

  const totalQuantity =
    purchase?.products.reduce((sum, p) => sum + p.purchaseQuantity, 0) || 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Purchase Order Details">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-slate-500">Loading PO details...</span>
        </div>
      ) : purchase ? (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Hash className="w-4 h-4" />
                PO ID
              </div>
              <div
                className="font-bold text-lg text-blue-600 truncate"
                title={purchase._id}
              >
                {purchase._id.substring(0, 12)}...
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                Created Date
              </div>
              <div className="font-bold text-lg">
                {new Date(purchase.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                Total Amount
              </div>
              <div className="font-bold text-lg text-green-600">
                {purchase.totalAmount.toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <FileText className="w-4 h-4" />
                Status
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(
                  purchase.status
                )}`}
              >
                {purchase.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Purchased By Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 text-sm font-semibold mb-2">
                <User className="w-4 h-4" />
                Purchased By
              </div>
              <div className="text-green-800">
                <div className="font-medium text-lg">
                  {purchase.purchasedBy.name}
                </div>
                <div className="text-sm text-green-600 capitalize">
                  {purchase.purchasedBy.role}
                </div>
              </div>
            </div>

            {/* Supplier Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 text-sm font-semibold mb-2">
                <User className="w-4 h-4" />
                Supplier Information
              </div>
              <div className="text-blue-800 font-medium text-lg">
                {getSupplierName(purchase.supplierId)}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {purchase.products.length}
              </div>
              <div className="text-sm text-purple-600">Total Products</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {totalQuantity}
              </div>
              <div className="text-sm text-indigo-600">Total Quantity</div>
            </div>
          </div>

          {/* Notes */}
          {purchase.note && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold mb-2">
                <FileText className="w-4 h-4" />
                Notes
              </div>
              <p className="text-amber-800">{purchase.note}</p>
            </div>
          )}

          {/* Products List */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Products ({purchase.products.length})
            </h3>
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3 text-left">Product Name</th>
                    <th className="p-3 text-left">Product Code</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3 text-center">Received</th>
                    <th className="p-3 text-right">Buying Price</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {purchase.products.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium">{product.productName}</td>
                      <td className="p-3 text-slate-600">
                        {product.productCode}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getProductStatusColor(
                            product.productStatus
                          )}`}
                        >
                          {product.productStatus === "received" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {product.productStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                          {product.purchaseQuantity}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                          {product.receivedQuantity}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        {product.buyingPrice.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {(
                          product.buyingPrice * product.purchaseQuantity
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t">
                  <tr>
                    <td colSpan={6} className="p-3 text-right font-semibold">
                      Total Amount:
                    </td>
                    <td className="p-3 text-right font-bold text-green-600">
                      {purchase.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex justify-between text-xs text-slate-500 pt-4 border-t">
            <div>Created: {new Date(purchase.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(purchase.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          No purchase order data available
        </div>
      )}
    </Modal>
  );
};
