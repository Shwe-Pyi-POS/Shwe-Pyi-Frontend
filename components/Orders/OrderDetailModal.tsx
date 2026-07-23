import React, { useState } from "react";
import {
  X,
  RefreshCw,
  Receipt,
  Store,
  Calendar,
  CreditCard,
  Package,
  UserCircle,
  User,
  Plus,
  Minus,
  Printer,
  Truck,
  Pencil,
} from "lucide-react";
import { Order } from "../../services/Order/fetchOrders";
import {
  getStatusColor,
  getPaymentTypeLabel,
  getPaymentMethodLabel,
  getPaymentTypeColor,
  formatDate,
  formatDueDate,
  isDueDateExpired,
  getDueDateUrgency,
} from "./orderUtils";
import { useLanguage } from "../../context/LanguageContext";
import { getSavedPrintPaperSize } from "../../utils/printPaperSize";
import { detectDevice } from "../../utils/deviceDetect";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AddItemsToOrderModal } from "./AddItemsToOrderModal";
import { RemoveItemsFromOrderModal } from "./RemoveItemsFromOrderModal";
import { CustomPrintModal } from "./CustomPrintModal";
import { TransportFeeEditModal } from "./TransportFeeEditModal";
import { updateTransportFee } from "../../services/Order/updateTransportFee";

interface OrderDetailModalProps {
  isOpen: boolean;
  loading: boolean;
  order: Order | null;
  onClose: () => void;
  onOrderUpdate?: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  loading,
  order,
  onClose,
  onOrderUpdate,
}) => {
  // console.log("orderdetail", order);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [showRemoveItemsModal, setShowRemoveItemsModal] = useState(false);
  const [showCustomPrintModal, setShowCustomPrintModal] = useState(false);
  const [showTransportFeeModal, setShowTransportFeeModal] = useState(false);

  const handlePrintOrder = () => {
    if (!order) return;

    // Transform order data to receipt format
    const creditPersonName =
      typeof order.creditPersonId === "object"
        ? order.creditPersonId?.name
        : undefined;

    const receiptData = {
      invoiceNumber: order.orderNumber,
      storefrontName: "HONGCHI Myanmar",
      date: order.createdAt,
      items:
        order.ordersProducts?.map((item) => ({
          name: item.inventoryId?.productName || "Unknown Product",
          code: item.inventoryId?.productCode,
          qty: item.quantity,
          unit: item.unit?.trim() || undefined,
          price: item.unitPrice || 0,
        })) || [],
      subtotal: order.subTotal || 0,
      discountPercent: order.discount
        ? (order.discount / (order.subTotal || 1)) * 100
        : 0,
      total: order.finalAmount || 0,
      paymentMethod: getPaymentMethodLabel(order.paymentMethod),
      paidAmount: order.paidAmount,
      change: order.extraChange,
      note: order.note || undefined,
      customerName: order.customerName?.trim() || creditPersonName,
      customerAddress: order.customerAddress?.trim() || undefined,
      transportFee: order.transportFee || 0,
    };

    // Save receipt data to localStorage for A4 printing
    const receiptId = `receipt_${receiptData.invoiceNumber}`;
    localStorage.setItem(receiptId, JSON.stringify(receiptData));

    // Navigate to A4 print page for all devices
    navigate(
      `/print-receipt/${receiptData.invoiceNumber}?size=${getSavedPrintPaperSize()}&autoprint=1`,
    );
  };

  const handleSaveTransportFee = async (
    transportFee: number,
    finalAmount: number,
    paidAmount: number,
  ) => {
    if (!order) return;
    try {
      const result = await updateTransportFee(
        order._id,
        transportFee,
        finalAmount,
        paidAmount,
      );
      if (result.success) {
        toast.success("Transport fee updated");
        setShowTransportFeeModal(false);
        if (onOrderUpdate) onOrderUpdate();
      } else {
        toast.error(result.message || "Failed to update transport fee");
      }
    } catch {
      toast.error("Failed to update transport fee");
    }
  };

  if (!isOpen) return null;

  const isDirectSale =
    order?.saleType === "direct-sale" || order?.storefrontId == null;
  const customerName = order?.customerName?.trim();
  const customerPhone = order?.customerPhone?.trim();
  const hasCustomer = !!(customerName || customerPhone);
  const storefrontLabel =
    order?.storefrontId?.locationName ||
    order?.storefrontId?.storefrontName ||
    (isDirectSale ? t("quotation.saleTypeDirectSale") : "-");
  const storefrontCode =
    order?.storefrontId?.locationCode ||
    order?.storefrontId?.storefrontCode ||
    null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-row justify-between items-start gap-4 p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Order Details
          </h3>
          <div className="flex flex-row items-center gap-2">
            {order && (
              <>
                <button
                  onClick={handlePrintOrder}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  title="Print Order"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>
                <button
                  onClick={() => setShowCustomPrintModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  title="Custom Print with Transport Fee"
                >
                  <Truck className="w-4 h-4" />
                  <span className="hidden sm:inline">Custom Print</span>
                </button>
              </>
            )}
            {order && userRole === "owner" && (
              <>
                <button
                  onClick={() => setShowRemoveItemsModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <Minus className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t("orders.removeItems") || "Remove Items"}
                  </span>
                </button>
                <button
                  onClick={() => setShowAddItemsModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t("orders.addItems") || "Add Items"}
                  </span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-slate-500">Loading order details...</p>
            </div>
          ) : order ? (
            <>
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    Order Number
                  </p>
                  <p className="font-bold text-blue-800">{order.orderNumber}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">
                    Status
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(
                      order.orderStatus,
                    )}`}
                  >
                    {order.orderStatus?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Store & Date Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Store className="w-4 h-4 shrink-0" />
                  <span>{storefrontLabel}</span>
                  {storefrontCode && (
                    <span className="text-xs text-slate-400">
                      ({storefrontCode})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              </div>

              {order.paymentType === "credit" && order.dueDate && (
                <div
                  className={`mb-6 p-4 rounded-lg border text-sm ${
                    getDueDateUrgency(order.dueDate.split("T")[0]) === "expired"
                      ? "bg-red-50 border-red-200"
                      : getDueDateUrgency(order.dueDate.split("T")[0]) === "near"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 shrink-0 text-slate-600" />
                    <p className="text-xs font-medium text-slate-600">
                      {t("creditOrders.dueDate")}
                    </p>
                  </div>
                  <p className="font-bold text-slate-800">
                    {formatDueDate(order.dueDate.split("T")[0])}
                  </p>
                  {isDueDateExpired(order.dueDate.split("T")[0]) && (
                    <span className="inline-block mt-2 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                      {t("creditOrders.dueDateExpired")}
                    </span>
                  )}
                  {getDueDateUrgency(order.dueDate.split("T")[0]) === "near" && (
                    <span className="inline-block mt-2 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {t("creditOrders.dueDateDueSoon")}
                    </span>
                  )}
                </div>
              )}

              {/* Customer (direct sale) */}
              {hasCustomer && (
                <div className="mb-6 bg-teal-50 p-4 rounded-lg border border-teal-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-teal-600" />
                    <p className="text-xs text-teal-600 font-medium">
                      {t("orders.customer") || "Customer"}
                    </p>
                  </div>
                  {customerName && (
                    <p className="font-bold text-teal-800">{customerName}</p>
                  )}
                  {customerPhone && (
                    <p className="text-sm text-teal-700 mt-1">{customerPhone}</p>
                  )}
                </div>
              )}

              {order.note?.trim() && (
                <div className="mb-6 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <span className="font-medium text-slate-700">
                    {t("pos.note")}:{" "}
                  </span>
                  <span>{order.note}</span>
                </div>
              )}

              {/* Sold By & Credit Person Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {order.soldBy && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCircle className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-purple-600 font-medium">
                        Sold By
                      </p>
                    </div>
                    <p className="font-bold text-purple-800">
                      {order.soldBy.name}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      {order.soldBy.role}
                    </p>
                  </div>
                )}
                {order.creditPersonId &&
                  typeof order.creditPersonId === "object" && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-orange-600" />
                        <p className="text-xs text-orange-600 font-medium">
                          Credit Person
                        </p>
                      </div>
                      <p className="font-bold text-orange-800">
                        {order.creditPersonId.name}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {order.creditPersonId.phone}
                      </p>
                    </div>
                  )}
              </div>

              {/* Products */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Order Items
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 text-left font-medium text-slate-600">
                          Product
                        </th>
                        <th className="p-3 text-center font-medium text-slate-600">
                          Qty
                        </th>
                        <th className="p-3 text-center font-medium text-slate-600">
                          Unit
                        </th>
                        <th className="p-3 text-right font-medium text-slate-600">
                          Unit Price
                        </th>
                        <th className="p-3 text-right font-medium text-slate-600">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {order.ordersProducts?.map((item, index) => (
                        <tr key={item._id || index}>
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-slate-800">
                                {item.inventoryId?.productName || "Unknown"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {item.inventoryId?.productCode}
                              </p>
                            </div>
                          </td>
                          <td className="p-3 text-center font-medium">
                            {item.quantity}
                          </td>
                          <td className="p-3 text-center text-slate-600 text-sm">
                            {item.unit || "—"}
                          </td>
                          <td className="p-3 text-right text-slate-600">
                            {item.unitPrice?.toLocaleString()} MMK
                          </td>
                          <td className="p-3 text-right font-medium text-slate-800">
                            {(
                              item.quantity * (item.unitPrice || 0)
                            ).toLocaleString()}{" "}
                            MMK
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-slate-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Summary
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal</span>
                    <span>{order.subTotal?.toLocaleString()} MMK</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax</span>
                      <span>{order.tax?.toLocaleString()} MMK</span>
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{order.discount?.toLocaleString()} MMK</span>
                    </div>
                  )}
                  {(order.transportFee ?? 0) > 0 ? (
                    <div className="flex justify-between items-center text-purple-600">
                      <span>Transport Fee</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          +{order.transportFee?.toLocaleString()} MMK
                        </span>
                        {userRole === "owner" && (
                          <button
                            onClick={() => setShowTransportFeeModal(true)}
                            className="p-1 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Edit transport fee"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    userRole === "owner" && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Transport Fee</span>
                        <button
                          onClick={() => setShowTransportFeeModal(true)}
                          className="text-xs text-slate-400 hover:text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>
                    )
                  )}
                  {order.discount === 0 &&
                    (order.transportFee ?? 0) === 0 &&
                    order.finalAmount > order.subTotal && (
                      <div className="flex justify-between text-green-600">
                        <span>Markup</span>
                        <span>
                          {(
                            order.finalAmount - order.subTotal
                          ).toLocaleString()}{" "}
                          MMK
                        </span>
                      </div>
                    )}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Final Amount</span>
                    <span>{order.finalAmount?.toLocaleString()} MMK</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Paid Amount</span>
                    <span>{order.paidAmount?.toLocaleString()} MMK</span>
                  </div>
                  {order.extraChange > 0 && (
                    <div className="flex justify-between text-blue-600 font-medium">
                      <span>Change</span>
                      <span>{order.extraChange?.toLocaleString()} MMK</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-slate-500">Payment Type</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${getPaymentTypeColor(
                        order.paymentType,
                      )}`}
                    >
                      {getPaymentTypeLabel(order.paymentType)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Method</span>
                    <span className="font-medium">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </span>
                  </div>
                  {order.remainingBalance !== undefined &&
                    order.remainingBalance > 0 && (
                      <div className="flex justify-between text-orange-600 font-medium">
                        <span>Remaining Balance</span>
                        <span>
                          {order.remainingBalance?.toLocaleString()} MMK
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Add Items Modal */}
      <AddItemsToOrderModal
        isOpen={showAddItemsModal}
        order={order}
        onClose={() => setShowAddItemsModal(false)}
        onSuccess={() => {
          setShowAddItemsModal(false);
          if (onOrderUpdate) {
            onOrderUpdate();
          }
        }}
      />

      {/* Remove Items Modal */}
      <RemoveItemsFromOrderModal
        isOpen={showRemoveItemsModal}
        order={order}
        onClose={() => setShowRemoveItemsModal(false)}
        onSuccess={() => {
          setShowRemoveItemsModal(false);
          if (onOrderUpdate) {
            onOrderUpdate();
          }
        }}
      />

      {/* Custom Print Modal */}
      <CustomPrintModal
        isOpen={showCustomPrintModal}
        order={order}
        onClose={() => setShowCustomPrintModal(false)}
      />

      {/* Transport Fee Edit Modal */}
      {showTransportFeeModal && order && (
        <TransportFeeEditModal
          order={order}
          onSave={handleSaveTransportFee}
          onClose={() => setShowTransportFeeModal(false)}
        />
      )}
    </div>
  );
};
