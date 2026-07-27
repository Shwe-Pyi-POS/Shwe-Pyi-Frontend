import React, { useState, useMemo } from "react";
import { X, Printer, Truck, Package } from "lucide-react";
import { Order } from "../../services/Order/fetchOrders";
import { getPaymentMethodLabel } from "./orderUtils";
import { getSavedPrintPaperSize, PrintPaperSize } from "../../utils/printPaperSize";
import { PrintPaperSizeSelector } from "../Print/PrintPaperSizeSelector";
import { useNavigate } from "react-router-dom";

interface CustomPrintModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
}

interface ItemFee {
  enabled: boolean;
  fee: number;
}

export const CustomPrintModal: React.FC<CustomPrintModalProps> = ({
  isOpen,
  order,
  onClose,
}) => {
  const navigate = useNavigate();

  const [itemFees, setItemFees] = useState<Record<string, ItemFee>>({});
  const [paperSize, setPaperSize] = useState<PrintPaperSize>(
    getSavedPrintPaperSize()
  );

  const orderItems = order?.ordersProducts || [];

  const getItemKey = (index: number, item: any) => {
    return item.inventoryId?._id || item._id || `item-${index}`;
  };

  const getItemCode = (item: any): string => {
    return item.inventoryId?.productCode || "";
  };

  const getItemName = (item: any): string => {
    return item.inventoryId?.productName || "Unknown Product";
  };

  const getItemQty = (item: any): number => {
    return item.quantity || 0;
  };

  const getItemUnitPrice = (item: any): number => {
    return item.unitPrice || 0;
  };

  const getItemLineTotal = (item: any): number => {
    return getItemQty(item) * getItemUnitPrice(item);
  };

  const getFeeForItem = (key: string): ItemFee => {
    return itemFees[key] || { enabled: true, fee: 0 };
  };

  const updateFee = (key: string, updates: Partial<ItemFee>) => {
    setItemFees((prev) => ({
      ...prev,
      [key]: { ...getFeeForItem(key), ...updates },
    }));
  };

  const totalTransportFee = useMemo(() => {
    return orderItems.reduce((sum, item, index) => {
      const key = getItemKey(index, item);
      const feeData = getFeeForItem(key);
      if (feeData.enabled && feeData.fee > 0) {
        return sum + feeData.fee;
      }
      return sum;
    }, 0);
  }, [itemFees, orderItems]);

  const originalSubtotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + getItemLineTotal(item), 0);
  }, [orderItems]);

  const adjustedTotal = originalSubtotal + totalTransportFee;

  const handlePrint = () => {
    if (!order) return;

    const perItemTransportFees: Record<string, number> = {};
    orderItems.forEach((item, index) => {
      const key = getItemKey(index, item);
      const code = getItemCode(item);
      const feeData = getFeeForItem(key);
      if (feeData.enabled && feeData.fee > 0 && code) {
        perItemTransportFees[code] = feeData.fee;
      }
    });

    const receiptData = {
      invoiceNumber: order.orderNumber,
      storefrontName: "HONGCHI Myanmar",
      date: order.createdAt,
      items: orderItems.map((item) => ({
        name: getItemName(item),
        code: getItemCode(item),
        qty: getItemQty(item),
        unit: item.unit?.trim() || undefined,
        price: getItemUnitPrice(item),
      })),
      subtotal: order.subTotal || 0,
      discountPercent: order.discount
        ? (order.discount / (order.subTotal || 1)) * 100
        : 0,
      total: order.finalAmount || 0,
      paymentMethod: getPaymentMethodLabel(order.paymentMethod),
      paymentType: order.paymentType,
      paidAmount: order.paidAmount,
      change: order.extraChange,
      note: order.note || undefined,
      customerName: order.customerName?.trim() || undefined,
      customerAddress: order.customerAddress?.trim() || undefined,
      perItemTransportFees,
    };

    const receiptId = `receipt_${receiptData.invoiceNumber}`;
    localStorage.setItem(receiptId, JSON.stringify(receiptData));

    navigate(
      `/print-receipt/${receiptData.invoiceNumber}?size=${paperSize}&autoprint=1`
    );

    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-purple-50">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-lg text-slate-800">
              Custom Voucher Print
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Order info */}
        <div className="px-4 py-2 bg-slate-50 border-b text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Order: <span className="font-bold text-slate-800">#{order.orderNumber}</span>
          </span>
          <span>
            {orderItems.length} item(s)
          </span>
          <span>
            Original Total: {(order.subTotal || 0).toLocaleString()} MMK
          </span>
          {(order.transportFee ?? 0) > 0 && (
            <span className="text-purple-600 font-medium">
              Transport Fee: {order.transportFee.toLocaleString()} MMK
            </span>
          )}
        </div>

        {/* Items table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-left font-medium text-slate-600 w-8">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="p-3 text-left font-medium text-slate-600">
                    Product
                  </th>
                  <th className="p-3 text-center font-medium text-slate-600">
                    Qty
                  </th>
                  <th className="p-3 text-right font-medium text-slate-600">
                    Unit Price
                  </th>
                  <th className="p-3 text-right font-medium text-slate-600">
                    Subtotal
                  </th>
                  <th className="p-3 text-right font-medium text-slate-600">
                    Transport Fee
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orderItems.map((item, index) => {
                  const key = getItemKey(index, item);
                  const feeData = getFeeForItem(key);
                  return (
                    <tr
                      key={key}
                      className={feeData.enabled ? "" : "bg-slate-50 opacity-60"}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={feeData.enabled}
                          onChange={(e) =>
                            updateFee(key, { enabled: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-slate-800">
                          {getItemName(item)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {getItemCode(item)}
                        </p>
                      </td>
                      <td className="p-3 text-center font-medium">
                        {getItemQty(item)}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        {getItemUnitPrice(item).toLocaleString()} MMK
                      </td>
                      <td className="p-3 text-right font-medium text-slate-800">
                        {getItemLineTotal(item).toLocaleString()} MMK
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          min="0"
                          disabled={!feeData.enabled}
                          className="w-28 text-right border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                          value={feeData.enabled ? feeData.fee || "" : ""}
                          onChange={(e) =>
                            updateFee(key, {
                              fee: Number(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 bg-purple-50 p-4 rounded-lg border border-purple-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Original Subtotal</span>
              <span className="font-medium">
                {originalSubtotal.toLocaleString()} MMK
              </span>
            </div>
            {totalTransportFee > 0 && (
              <div className="flex justify-between text-sm text-purple-600">
                <span className="font-medium">Total Transport Fee</span>
                <span className="font-bold">
                  +{totalTransportFee.toLocaleString()} MMK
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-purple-200">
              <span>New Total</span>
              <span>{adjustedTotal.toLocaleString()} MMK</span>
            </div>
          </div>

          {/* Paper size */}
          <div className="mt-4">
            <PrintPaperSizeSelector
              value={paperSize}
              onChange={setPaperSize}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-bold shadow-lg"
          >
            <Printer className="w-4 h-4" />
            Print Custom
          </button>
        </div>
      </div>
    </div>
  );
};
