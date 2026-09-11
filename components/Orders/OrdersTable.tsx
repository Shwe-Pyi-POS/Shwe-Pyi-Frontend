import React, { useState } from "react";
import {
  RefreshCw,
  Eye,
  ShoppingBag,
  Store,
  CreditCard,
  UserPlus,
  User,
  Trash2,
  Loader2,
} from "lucide-react";
import { Order, OrderPagination } from "../../services/Order/fetchOrders";
import { OrdersPagination as OrdersPaginationBar } from "./OrdersPagination";
import { deleteOrder } from "../../services/Order/deleteOrder";
import {
  getPaymentMethodLabel,
  getCreditPaymentStatus,
  getCreditStatusBadge,
} from "./orderUtils";
import { toast } from "sonner";
import { ConfirmModal } from "../Common/ConfirmModal";
import { useLanguage } from "../../context/LanguageContext";

interface OrdersTableProps {
  loading: boolean;
  orders: Order[];
  onViewOrder: (orderId: string) => void;
  onOpenCreditPersonModal: (order: Order) => void;
  onOrderDeleted?: () => void;
  pagination?: OrderPagination | null;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  loading,
  orders,
  onViewOrder,
  onOpenCreditPersonModal,
  onOrderDeleted,
  pagination,
  onPageChange,
  onLimitChange,
}) => {
  const { t } = useLanguage();
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{
    id: string;
    number: string;
  } | null>(null);

  // Check if user can delete orders (owner only)
  const canDeleteOrder = userRole === "owner";

  const handleDeleteOrderClick = (orderId: string, orderNumber: string) => {
    setOrderToDelete({ id: orderId, number: orderNumber });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setDeletingOrderId(orderToDelete.id);
    try {
      const response = await deleteOrder(orderToDelete.id);

      if (response.success) {
        toast.success(`Order ${orderToDelete.number} deleted successfully`);
        if (onOrderDeleted) {
          onOrderDeleted();
        }
      } else {
        let errMsg = response.message;
        if (
          response.message.includes("Cannot hard delete order with order items")
        ) {
          errMsg = t("creditOrders.errorHasItems") || response.message;
        } else if (
          response.message.includes(
            "Cannot hard delete order with credit records",
          )
        ) {
          errMsg = t("creditOrders.errorHasCreditRecords") || response.message;
        }
        toast.error(errMsg);
      }
    } catch (error: any) {
      console.error("Error deleting order:", error);
      let errMsg = error.message || "Failed to delete order";
      if (error.message?.includes("Cannot hard delete order with order items")) {
        errMsg = t("creditOrders.errorHasItems") || error.message;
      } else if (
        error.message?.includes("Cannot hard delete order with credit records")
      ) {
        errMsg = t("creditOrders.errorHasCreditRecords") || error.message;
      }
      toast.error(errMsg);
    } finally {
      setDeletingOrderId(null);
      setDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
        <p className="text-slate-500">{t("orders.loadingOrders") || "Loading orders..."}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t("orders.noOrdersFound") || "No orders found"}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Mobile scroll indicator */}
      <div className="sm:hidden px-4 py-2 bg-slate-50 text-xs text-slate-500 text-center">
        {t("creditOrders.swipeToSeeMore") || "← Swipe to see more →"}
      </div>

      {/* Table container with horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[860px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-3 py-3 font-semibold text-slate-600">
                <span className="hidden sm:inline">{t("orders.orderNumber") || "Order Number"}</span>
                <span className="sm:hidden">Order #</span>
              </th>
              <th className="px-3 py-3 font-semibold text-slate-600">
                {t("creditOrders.customer") || "Customer"}
              </th>
              <th className="px-3 py-3 font-semibold text-slate-600">
                {t("orders.type") || "Type"}
              </th>
              <th className="px-3 py-3 font-semibold text-slate-600">
                {t("creditOrders.status") || "Status"}
              </th>
              <th className="px-3 py-3 font-semibold text-slate-600">
                {t("creditOrders.items") || "Items"}
              </th>
              <th className="px-3 py-3 font-semibold text-slate-600">
                {t("creditOrders.total") || "Total"}
              </th>
              <th className="px-3 py-3 font-semibold text-slate-600">
                {t("orders.method") || "Method"}
              </th>
              <th className="px-3 py-3 font-semibold text-slate-600 text-center">
                {t("creditOrders.actions") || "Actions"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => {
              const isCredit = order.paymentType?.toLowerCase() === "credit";

              return (
                <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                  {/* Order Number & Storefront */}
                  <td className="px-3 py-3 font-medium text-slate-800 text-xs sm:text-sm">
                    <div className="text-blue-600 font-semibold">{order.orderNumber}</div>
                    {(order.storefrontId?.locationName ||
                      order.storefrontId?.storefrontName) && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Store className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {order.storefrontId?.locationName ||
                            order.storefrontId?.storefrontName}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Customer / Credit Person */}
                  <td className="px-3 py-3">
                    {order.creditPersonId && typeof order.creditPersonId === "object" ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div
                            className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[140px]"
                            title={order.creditPersonId.name}
                          >
                            {order.creditPersonId.name}
                          </div>
                          <div
                            className="text-xs text-slate-500 truncate max-w-[140px]"
                            title={order.creditPersonId.phone}
                          >
                            {order.creditPersonId.phone}
                          </div>
                        </div>
                      </div>
                    ) : order.customerName ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800 text-xs sm:text-sm truncate max-w-[140px]">
                            {order.customerName}
                          </div>
                          {order.customerPhone && (
                            <div className="text-xs text-slate-500 truncate max-w-[140px]">
                              {order.customerPhone}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : isCredit ? (
                      <button
                        onClick={() => onOpenCreditPersonModal(order)}
                        className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>{t("creditOrders.addCreditPerson") || "+ Customer"}</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>

                  {/* Type Badge */}
                  <td className="px-3 py-3">
                    {isCredit ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                        {t("pos.credit") || "Credit"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                        {t("orders.paid") || "Paid"}
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-3 py-3">
                    {isCredit ? (
                      (() => {
                        const creditStatus = getCreditPaymentStatus(order);
                        const badge = getCreditStatusBadge(creditStatus, t);
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${badge.bgColor} ${badge.textColor} ${badge.borderColor}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`}></span>
                            {badge.label}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {t("creditOrders.statusFullyPaid") || "Fully Paid"}
                      </span>
                    )}
                  </td>

                  {/* Items */}
                  <td className="px-3 py-3 text-slate-600 text-xs sm:text-sm">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                      {order.ordersProducts?.length || 0} {t("creditOrders.items") || "item(s)"}
                    </span>
                  </td>

                  {/* Total */}
                  <td className="px-3 py-3 font-bold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                    {order.finalAmount?.toLocaleString()}{" "}
                    <span className="text-xs font-normal text-slate-500">MMK</span>
                  </td>

                  {/* Payment Method */}
                  <td className="px-3 py-3 text-xs sm:text-sm whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onViewOrder(order._id)}
                        className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded font-medium transition-colors flex items-center gap-1"
                        title={t("creditOrders.view") || "View"}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden lg:inline">{t("creditOrders.view") || "View"}</span>
                      </button>


                      {canDeleteOrder && (
                        <button
                          onClick={() =>
                            handleDeleteOrderClick(order._id, order.orderNumber)
                          }
                          disabled={deletingOrderId === order._id}
                          className="text-xs bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-2 py-1.5 rounded font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t("creditOrders.delete") || "Delete"}
                        >
                          {deletingOrderId === order._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden xl:inline">{t("creditOrders.delete") || "Delete"}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && onPageChange && pagination.totalPages > 1 && (
        <OrdersPaginationBar
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Order"
        message={`Are you sure you want to delete order ${orderToDelete?.number}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setOrderToDelete(null);
        }}
        isLoading={deletingOrderId !== null}
      />
    </div>
  );
};
