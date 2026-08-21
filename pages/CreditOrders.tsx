import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Receipt,
  User,
  CreditCard,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { fetchCreditOrders } from "../services/Order/fetchCreditOrders";
import { Order } from "../services/Order/fetchOrders";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import { updatePaidAmount } from "../services/Order/updatePaidAmount";
import { deleteCreditOrder } from "../services/Order/deleteCreditOrder";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { assignCreditPerson } from "../services/Order/assignCreditPerson";
import { updateOrderDueDate } from "../services/Order/updateOrderDueDate";
import {
  formatDueDate,
  isDueDateExpired,
  parseDueDateString,
  getDueDateUrgency,
  getDueDateCellClasses,
} from "../components/Orders/orderUtils";
import { SingleDateCalendar } from "../components/Common/SingleDateCalendar";
import { CreditOrdersFilters } from "../components/Orders/CreditOrdersFilters";
import { OrderDetailModal } from "../components/Orders/OrderDetailModal";
import { CreditPersonModal } from "../components/Orders/CreditPersonModal";
import { useLanguage } from "../context/LanguageContext";
import { DateRangePicker } from "../components/Reports/DateRangePicker";

// Helper function to get today's date
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const CreditOrders: React.FC = () => {
  const { t } = useLanguage();
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] =
    useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [nearDueDateFilter, setNearDueDateFilter] = useState(false);
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [showCreditPersonModal, setShowCreditPersonModal] = useState(false);
  const [selectedOrderForCredit, setSelectedOrderForCredit] =
    useState<Order | null>(null);
  const [assigningCreditPerson, setAssigningCreditPerson] = useState(false);

  // Initialize dates to today
  const [startDate, setStartDate] = useState<Date | null>(getToday());
  const [endDate, setEndDate] = useState<Date | null>(getToday());

  // Paid Amount Edit States
  const [showPaidAmountModal, setShowPaidAmountModal] = useState(false);
  const [selectedOrderForPaidAmount, setSelectedOrderForPaidAmount] =
    useState<Order | null>(null);
  const [newPaidAmount, setNewPaidAmount] = useState("");
  const [updatingPaidAmount, setUpdatingPaidAmount] = useState(false);

  // Delete Order States
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);

  // Due Date Edit States
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [selectedOrderForDueDate, setSelectedOrderForDueDate] =
    useState<Order | null>(null);
  const [newDueDate, setNewDueDate] = useState("");
  const [updatingDueDate, setUpdatingDueDate] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedStorefrontId,
    startDate,
    endDate,
    paymentMethodFilter,
    nearDueDateFilter,
  ]);

  const loadInitialData = async () => {
    // Load storefronts and credit personas
    try {
      const [sfResponse, cpResponse] = await Promise.all([
        fetchStorefrontProfiles(),
        fetchCreditPersonas(),
      ]);

      if (sfResponse.success && sfResponse.data) {
        setStorefronts(sfResponse.data.reverse());
      }

      if (cpResponse.success && cpResponse.data) {
        setCreditPersonas(cpResponse.data);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const formatDateForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);

      const response = await fetchCreditOrders(
        startDateStr,
        endDateStr,
        paymentMethodFilter === "all" ? null : paymentMethodFilter,
        nearDueDateFilter ? 7 : null,
      );

      if (response.success && response.data) {
        let filteredOrders = response.data;

        // If a specific storefront is selected, filter results
        if (selectedStorefrontId !== "all") {
          filteredOrders = response.data.filter(
            (order) =>
              order.storefrontId?._id === selectedStorefrontId ||
              order.storefrontId?.id === selectedStorefrontId,
          );
        }

        setOrders(filteredOrders);
      } else {
        toast.error(response.message || t("orders.failedToLoad"));
      }
    } catch (error) {
      console.error("Error loading credit orders:", error);
      toast.error(t("orders.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = search.toLowerCase();

    const matchesOrderNumber = order.orderNumber
      ?.toLowerCase()
      .includes(searchLower);

    const matchesStorefront = order.storefrontId?.locationName
      ?.toLowerCase()
      .includes(searchLower);

    const matchesCreditPerson =
      order.creditPersonId &&
      typeof order.creditPersonId === "object" &&
      (order.creditPersonId.name?.toLowerCase().includes(searchLower) ||
        order.creditPersonId.phone?.includes(search));

    const matchesProductName = order.ordersProducts?.some((product) =>
      product.inventoryId?.productName?.toLowerCase().includes(searchLower),
    );

    const matchesProductCode = order.ordersProducts?.some(
      (product) =>
        product.inventoryId?.productCode?.toLowerCase().includes(searchLower) ||
        product.inventoryId?.SKU?.toLowerCase().includes(searchLower),
    );

    const matchesSearch =
      matchesOrderNumber ||
      matchesStorefront ||
      matchesCreditPerson ||
      matchesProductName ||
      matchesProductCode;

    return matchesSearch;
  });

  const handleViewOrder = async (orderId: string) => {
    setLoadingDetail(true);
    setSelectedOrder(null);
    try {
      const response = await fetchOrderById(orderId);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
      } else {
        toast.error(response.message || t("orders.failedToLoadDetails"));
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      toast.error(t("orders.failedToLoadDetails"));
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRefreshOrderDetails = async () => {
    if (selectedOrder?._id) {
      setLoadingDetail(true);
      try {
        const response = await fetchOrderById(selectedOrder._id);
        if (response.success && response.data) {
          setSelectedOrder(response.data);
        }
      } catch (error) {
        console.error("Error refreshing order details:", error);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const handleOpenCreditPersonModal = (order: Order) => {
    setSelectedOrderForCredit(order);
    setShowCreditPersonModal(true);
  };

  const handleAssignCreditPerson = async (creditPersonId: string) => {
    if (!selectedOrderForCredit) return;

    setAssigningCreditPerson(true);
    try {
      const response = await assignCreditPerson(
        selectedOrderForCredit._id,
        creditPersonId,
      );
      if (response.success) {
        toast.success("Credit person assigned successfully");
        setShowCreditPersonModal(false);
        setSelectedOrderForCredit(null);
        // Refresh orders
        await loadOrders();
      } else {
        toast.error(response.message || "Failed to assign credit person");
      }
    } catch (error) {
      console.error("Error assigning credit person:", error);
      toast.error("Failed to assign credit person");
    } finally {
      setAssigningCreditPerson(false);
    }
  };

  const handleOpenPaidAmountModal = (order: Order) => {
    setSelectedOrderForPaidAmount(order);
    setNewPaidAmount(order.paidAmount);
    setShowPaidAmountModal(true);
  };

  const handleUpdatePaidAmount = async () => {
    if (!selectedOrderForPaidAmount || !newPaidAmount) return;

    setUpdatingPaidAmount(true);
    try {
      const response = await updatePaidAmount(
        selectedOrderForPaidAmount._id,
        newPaidAmount,
      );
      if (response.success) {
        toast.success("Paid amount updated successfully");
        setShowPaidAmountModal(false);
        setSelectedOrderForPaidAmount(null);
        await loadOrders();
      } else {
        toast.error(response.message || "Failed to update paid amount");
      }
    } catch (error) {
      console.error("Error updating paid amount:", error);
      toast.error("Failed to update paid amount");
    } finally {
      setUpdatingPaidAmount(false);
    }
  };

  const handleOpenDueDateModal = (order: Order) => {
    setSelectedOrderForDueDate(order);
    setNewDueDate(order.dueDate?.split("T")[0] || "");
    setShowDueDateModal(true);
  };

  const handleUpdateDueDate = async () => {
    if (!selectedOrderForDueDate || !newDueDate) return;

    setUpdatingDueDate(true);
    try {
      const response = await updateOrderDueDate(
        selectedOrderForDueDate._id,
        newDueDate,
      );
      if (response.success) {
        toast.success(t("creditOrders.dueDateUpdated"));
        setShowDueDateModal(false);
        setSelectedOrderForDueDate(null);
        await loadOrders();
      } else {
        toast.error(
          response.message || t("creditOrders.failedToUpdateDueDate"),
        );
      }
    } catch (error) {
      console.error("Error updating due date:", error);
      toast.error(t("creditOrders.failedToUpdateDueDate"));
    } finally {
      setUpdatingDueDate(false);
    }
  };

  const handleRemoveDueDate = async () => {
    if (!selectedOrderForDueDate?.dueDate) return;

    setUpdatingDueDate(true);
    try {
      const response = await updateOrderDueDate(
        selectedOrderForDueDate._id,
        null,
      );
      if (response.success) {
        toast.success(t("creditOrders.dueDateRemoved"));
        setShowDueDateModal(false);
        setSelectedOrderForDueDate(null);
        await loadOrders();
      } else {
        toast.error(
          response.message || t("creditOrders.failedToRemoveDueDate"),
        );
      }
    } catch (error) {
      console.error("Error removing due date:", error);
      toast.error(t("creditOrders.failedToRemoveDueDate"));
    } finally {
      setUpdatingDueDate(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MMK",
    }).format(amount);
  };

  // Delete Order Handlers
  const handleOpenDeleteConfirm = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteConfirmModal(true);
  };

  const handleCloseDeleteConfirm = () => {
    setOrderToDelete(null);
    setShowDeleteConfirmModal(false);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    setDeletingOrder(true);
    try {
      const response = await deleteCreditOrder(orderToDelete._id);
      if (response.success) {
        toast.success("Credit order deleted successfully");
        setShowDeleteConfirmModal(false);
        setOrderToDelete(null);
        await loadOrders();
      } else {
        let errMsg = response.message || "Failed to delete credit order";
        if (response.message?.includes("Cannot hard delete order with order items")) {
          errMsg = t("creditOrders.errorHasItems") || response.message;
        } else if (response.message?.includes("Cannot hard delete order with credit records")) {
          errMsg = t("creditOrders.errorHasCreditRecords") || response.message;
        }
        toast.error(errMsg);
      }
    } catch (error: any) {
      console.error("Error deleting credit order:", error);
      let errMsg = error.message || "Failed to delete credit order";
      if (error.message?.includes("Cannot hard delete order with order items")) {
        errMsg = t("creditOrders.errorHasItems") || error.message;
      } else if (error.message?.includes("Cannot hard delete order with credit records")) {
        errMsg = t("creditOrders.errorHasCreditRecords") || error.message;
      }
      toast.error(errMsg);
    } finally {
      setDeletingOrder(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600" />
            {t("creditOrders.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("creditOrders.subtitle")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(newStartDate, newEndDate) => {
              setStartDate(newStartDate);
              setEndDate(newEndDate);
            }}
          />
          <button
            onClick={loadOrders}
            disabled={loading}
            className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">
              {t("creditOrders.refresh")}
            </span>
            <span className="sm:hidden">↻</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <CreditOrdersFilters
        search={search}
        onSearchChange={setSearch}
        storefronts={storefronts}
        selectedStorefrontId={selectedStorefrontId}
        onStorefrontChange={setSelectedStorefrontId}
        paymentMethodFilter={paymentMethodFilter}
        onPaymentMethodChange={setPaymentMethodFilter}
        nearDueDateFilter={nearDueDateFilter}
        onNearDueDateFilterChange={setNearDueDateFilter}
        orders={orders}
        filteredOrders={filteredOrders}
      />

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p>{t("creditOrders.loadingCreditOrders")}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>{t("creditOrders.noCreditOrdersFound")}</p>
          </div>
        ) : (
          <div>
            {/* Mobile scroll indicator */}
            <div className="sm:hidden px-4 py-2 bg-slate-50 text-xs text-slate-500 text-center">
              {t("creditOrders.swipeToSeeMore")}
            </div>

            {/* Table container with horizontal scroll on mobile */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[1100px]">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        Credit Order Number
                      </span>
                      <span className="sm:hidden">Order #</span>
                    </th>

                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        {t("creditOrders.storefront")}
                      </span>
                      <span className="sm:hidden">SF</span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        {t("creditOrders.customer")}
                      </span>
                      <span className="sm:hidden">
                        {t("creditOrders.customer")}
                      </span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        {t("creditOrders.items")}
                      </span>
                      <span className="sm:hidden">
                        {t("creditOrders.items")}
                      </span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        {t("creditOrders.total")}
                      </span>
                      <span className="sm:hidden">
                        {t("creditOrders.total")}
                      </span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        {t("creditOrders.paid")}
                      </span>
                      <span className="sm:hidden">
                        {t("creditOrders.paid")}
                      </span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        {t("creditOrders.remaining")}
                      </span>
                      <span className="sm:hidden">
                        {t("creditOrders.balance")}
                      </span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        {t("creditOrders.dueDate")}
                      </span>
                      <span className="sm:hidden">
                        {t("creditOrders.dueDate")}
                      </span>
                    </th>
                    <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                      <span className="hidden sm:inline">
                        {t("creditOrders.actions")}
                      </span>
                      <span className="sm:hidden">A</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-50">
                      <td className="px-2 sm:px-4 py-3">
                        <div className="font-medium text-slate-800 text-xs sm:text-sm">
                          {order.orderNumber}
                        </div>
                      </td>

                      <td className="px-2 sm:px-4 py-3">
                        <div className="font-medium text-slate-800 text-xs sm:text-sm">
                          <div
                            className="truncate"
                            title={
                              order.storefrontId?.locationName ||
                              order.storefrontId?.storefrontName
                            }
                          >
                            {order.storefrontId?.locationName ||
                              order.storefrontId?.storefrontName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {order.storefrontId?.locationCode ||
                              order.storefrontId?.storefrontCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        {order.creditPersonId &&
                        typeof order.creditPersonId === "object" ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div
                                className="font-medium text-slate-800 text-xs sm:text-sm truncate"
                                title={order.creditPersonId.name}
                              >
                                {order.creditPersonId.name}
                              </div>
                              <div
                                className="text-xs text-slate-500 truncate"
                                title={order.creditPersonId.phone}
                              >
                                {order.creditPersonId.phone}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            <span className="text-slate-400 text-xs sm:text-sm">
                              <span className="hidden sm:inline">
                                {t("creditOrders.noCustomerAssigned")}
                              </span>
                              <span className="sm:hidden">
                                {t("creditOrders.noCustomerAssigned")}
                              </span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-slate-600 text-xs sm:text-sm">
                        {order.ordersProducts?.length || 0}{" "}
                        {t("creditOrders.items")}
                      </td>
                      <td className="px-2 sm:px-4 py-3 font-medium text-slate-800 text-xs sm:text-sm">
                        {order.finalAmount.toLocaleString()}{" "}
                        <span className="hidden sm:inline">MMK</span>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 text-xs sm:text-sm">
                            {order.paidAmount.toLocaleString()}{" "}
                            <span className="hidden sm:inline">MMK</span>
                          </span>
                          {/* <button
                            onClick={() => handleOpenPaidAmountModal(order)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-blue-600 transition-colors"
                            title="Edit Paid Amount"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button> */}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <span className="font-medium text-orange-600 text-xs sm:text-sm">
                          {order.remainingBalance.toLocaleString()}{" "}
                          <span className="hidden sm:inline">MMK</span>
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
                        <div className="min-w-0">
                          {order.dueDate ? (
                            (() => {
                              const dueDatePart = order.dueDate.split("T")[0];
                              const urgency = getDueDateUrgency(dueDatePart, 7);
                              return (
                                <button
                                  onClick={() => handleOpenDueDateModal(order)}
                                  className={`rounded-lg px-2 py-1 text-left w-full transition-colors hover:opacity-80 ${
                                    urgency === "near"
                                      ? "bg-amber-50 border border-amber-200"
                                      : ""
                                  }`}
                                >
                                  <div
                                    className={`font-medium text-xs sm:text-sm ${getDueDateCellClasses(
                                      urgency,
                                    )}`}
                                  >
                                    {formatDueDate(dueDatePart)}
                                  </div>
                                  {urgency === "expired" && (
                                    <span className="inline-block mt-0.5 text-[10px] sm:text-xs font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                                      {t("creditOrders.dueDateExpired")}
                                    </span>
                                  )}
                                  {urgency === "near" && (
                                    <span className="inline-block mt-0.5 text-[10px] sm:text-xs font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                      {t("creditOrders.dueDateDueSoon")}
                                    </span>
                                  )}
                                </button>
                              );
                            })()
                          ) : (
                            <button
                              onClick={() => handleOpenDueDateModal(order)}
                              className="text-slate-400 text-xs sm:text-sm hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              {t("creditOrders.noDueDate")}
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-2 sm:px-4 py-3">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleViewOrder(order._id)}
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded hover:bg-blue-200 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />{" "}
                            <span className="hidden xl:block">
                              {t("creditOrders.view")}
                            </span>
                            <span className="xl:hidden sm:hidden">V</span>
                          </button>
                          {!order.creditPersonId && (
                            <button
                              onClick={() => handleOpenCreditPersonModal(order)}
                              className="text-xs bg-orange-100 text-orange-700 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded hover:bg-orange-200 border border-orange-200 font-medium transition-colors flex items-center gap-1"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span className="hidden xl:block">
                                <span className="hidden sm:inline">
                                  {t("creditOrders.addCreditPerson")}
                                </span>
                                <span className="sm:hidden">
                                  {t("creditOrders.addCreditPerson")}
                                </span>
                              </span>
                            </button>
                          )}
                          {order.creditPersonId && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1.5 rounded flex items-center gap-1">
                              <User className="w-3 h-3" />{" "}
                              <span className="hidden xl:block">
                                {t("creditOrders.assigned")}
                              </span>
                              <span className="xl:hidden sm:hidden">✓</span>
                            </span>
                          )}
                          {(userRole === "owner" || userRole === "admin" || userRole === "cashier") && (
                            <button
                              onClick={() => handleOpenDeleteConfirm(order)}
                              className="text-xs bg-red-100 text-red-700 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded hover:bg-red-200 border border-red-200 font-medium transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span className="hidden xl:block">
                                {t("creditOrders.delete")}
                              </span>
                              <span className="xl:hidden sm:hidden">Del</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        loading={loadingDetail}
        onOrderUpdate={handleRefreshOrderDetails}
      />

      {/* Credit Person Selection Modal */}
      <CreditPersonModal
        isOpen={showCreditPersonModal}
        order={selectedOrderForCredit}
        creditPersonas={creditPersonas}
        assigning={assigningCreditPerson}
        onClose={() => {
          setShowCreditPersonModal(false);
          setSelectedOrderForCredit(null);
        }}
        onAssign={handleAssignCreditPerson}
      />
      {/* Due Date Edit Modal */}
      {showDueDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-600" />
                {t("creditOrders.editDueDateTitle")}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("creditOrders.orderNumber")}
                  </label>
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-600 text-sm">
                    {selectedOrderForDueDate?.orderNumber}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t("creditOrders.selectDueDate")}
                  </label>
                  <SingleDateCalendar
                    value={newDueDate ? parseDueDateString(newDueDate) : null}
                    onChange={(date) => {
                      const formatted = formatDateForAPI(date);
                      if (formatted) setNewDueDate(formatted);
                    }}
                  />
                </div>
              </div>

              {selectedOrderForDueDate?.dueDate && (
                <button
                  type="button"
                  onClick={handleRemoveDueDate}
                  disabled={updatingDueDate}
                  className="w-full mt-4 py-2.5 px-4 rounded-xl border border-red-200 text-red-700 font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {updatingDueDate ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {t("creditOrders.removeDueDate")}
                </button>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowDueDateModal(false);
                    setSelectedOrderForDueDate(null);
                  }}
                  disabled={updatingDueDate}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {t("creditOrders.cancel")}
                </button>
                <button
                  onClick={handleUpdateDueDate}
                  disabled={updatingDueDate || !newDueDate}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {updatingDueDate ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      {t("creditOrders.updatingDueDate")}
                    </>
                  ) : (
                    t("creditOrders.confirm")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paid Amount Edit Modal */}
      {showPaidAmountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Edit Paid Amount
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Order Number
                  </label>
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-600 text-sm">
                    {selectedOrderForPaidAmount?.orderNumber}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total Amount
                  </label>
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-800 font-semibold text-sm">
                    {selectedOrderForPaidAmount?.finalAmount.toLocaleString()}{" "}
                    MMK
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Enter Paid Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newPaidAmount}
                      onChange={(e) => setNewPaidAmount(e.target.value)}
                      placeholder="Enter amount..."
                      className="w-full pl-3 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-lg font-semibold"
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                      MMK
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Remaining Balance:</span>
                    <span className="font-bold text-blue-800">
                      {Math.max(
                        0,
                        (selectedOrderForPaidAmount?.finalAmount || 0) -
                          Number(newPaidAmount || 0),
                      ).toLocaleString()}{" "}
                      MMK
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowPaidAmountModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePaidAmount}
                  disabled={updatingPaidAmount || !newPaidAmount}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {updatingPaidAmount ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {t("creditOrders.deleteTitle")}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {t("creditOrders.deleteSubtitle")}
                  </p>
                </div>
              </div>

              {orderToDelete && (
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{t("creditOrders.orderNumber")}:</span>
                      <span className="font-medium text-slate-800">
                        {orderToDelete.orderNumber}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{t("creditOrders.total")}:</span>
                      <span className="font-medium text-slate-800">
                        {orderToDelete.finalAmount.toLocaleString()} MMK
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">{t("creditOrders.customer")}:</span>
                      <span className="font-medium text-slate-800">
                        {orderToDelete.creditPersonId?.name ||
                          t("creditOrders.noCustomerAssigned")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800">
                  {t("creditOrders.deleteWarning")}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseDeleteConfirm}
                  disabled={deletingOrder}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {t("creditOrders.cancel")}
                </button>
                <button
                  onClick={handleDeleteOrder}
                  disabled={deletingOrder}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                >
                  {deletingOrder ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      {t("creditOrders.deleting")}
                    </>
                  ) : (
                    t("creditOrders.delete")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
