import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw, Receipt } from "lucide-react";
import { toast } from "sonner";
import {
  fetchOrders,
  Order,
  OrderPagination,
} from "../services/Order/fetchOrders";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { assignCreditPerson } from "../services/Order/assignCreditPerson";
import { OrdersFilters } from "../components/Orders/OrdersFilters";
import { OrdersTable } from "../components/Orders/OrdersTable";
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

export const Orders: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize payment type from URL query if present (e.g. /orders?type=credit)
  const initialType = searchParams.get("type");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>(
    initialType && ["paid", "credit"].includes(initialType.toLowerCase())
      ? initialType.toLowerCase()
      : "all",
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] =
    useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [showCreditPersonModal, setShowCreditPersonModal] = useState(false);
  const [selectedOrderForCredit, setSelectedOrderForCredit] =
    useState<Order | null>(null);
  const [assigningCreditPerson, setAssigningCreditPerson] = useState(false);

  // Initialize dates to today
  const [startDate, setStartDate] = useState<Date | null>(getToday());
  const [endDate, setEndDate] = useState<Date | null>(getToday());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [pagination, setPagination] = useState<OrderPagination | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // When type param in URL changes from external navigation
  useEffect(() => {
    const currentTypeParam = searchParams.get("type");
    if (
      currentTypeParam &&
      ["paid", "credit"].includes(currentTypeParam.toLowerCase())
    ) {
      setPaymentTypeFilter(currentTypeParam.toLowerCase());
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedStorefrontId,
    startDate,
    endDate,
    paymentMethodFilter,
    paymentTypeFilter,
  ]);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedStorefrontId,
    startDate,
    endDate,
    currentPage,
    itemsPerPage,
    paymentMethodFilter,
    paymentTypeFilter,
  ]);

  const loadInitialData = async () => {
    // Load storefronts
    try {
      const sfResponse = await fetchStorefrontProfiles();
      if (sfResponse.success && sfResponse.data) {
        setStorefronts(sfResponse.data.reverse());
      }
    } catch (error) {
      console.error("Error loading storefronts:", error);
    }

    // Load credit personas
    try {
      const cpResponse = await fetchCreditPersonas();
      if (cpResponse.success && cpResponse.data) {
        setCreditPersonas(cpResponse.data.filter((p) => !p.blacklist));
      }
    } catch (error) {
      console.error("Error loading credit personas:", error);
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

      const response = await fetchOrders(
        startDateStr,
        endDateStr,
        paymentTypeFilter === "all" ? null : paymentTypeFilter,
        {
          page: currentPage,
          limit: itemsPerPage,
          storefrontId:
            selectedStorefrontId !== "all" ? selectedStorefrontId : null,
          paymentMethod:
            paymentMethodFilter !== "all" ? paymentMethodFilter : null,
          saleType: "storefront",
        },
      );

      if (response.success && response.data) {
        setOrders(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        } else {
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalItems: response.data.length,
            itemsPerPage: response.data.length,
          });
        }
      } else {
        setOrders([]);
        setPagination(null);
        toast.error(response.message || t("orders.failedToLoad"));
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error(t("orders.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentTypeChange = (newType: string) => {
    setPaymentTypeFilter(newType);
    if (newType === "all") {
      searchParams.delete("type");
    } else {
      searchParams.set("type", newType);
    }
    setSearchParams(searchParams);
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = search.toLowerCase();

    // Check if search matches order number
    const matchesOrderNumber = order.orderNumber
      ?.toLowerCase()
      .includes(searchLower);

    // Check if search matches storefront location
    const matchesStorefront =
      order.storefrontId?.locationName
        ?.toLowerCase()
        .includes(searchLower) ||
      order.storefrontId?.storefrontName?.toLowerCase().includes(searchLower);

    // Check customer / credit person
    const matchesCreditPerson =
      order.creditPersonId &&
      typeof order.creditPersonId === "object" &&
      (order.creditPersonId.name?.toLowerCase().includes(searchLower) ||
        order.creditPersonId.phone?.includes(search));

    const matchesCustomer =
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.customerPhone?.includes(search);

    // Check if search matches any product name in the order
    const matchesProductName = order.ordersProducts?.some((product) =>
      product.inventoryId?.productName?.toLowerCase().includes(searchLower),
    );

    // Check if search matches any product code in the order
    const matchesProductCode = order.ordersProducts?.some(
      (product) =>
        product.inventoryId?.productCode?.toLowerCase().includes(searchLower) ||
        product.inventoryId?.SKU?.toLowerCase().includes(searchLower),
    );

    const matchesSearch =
      matchesOrderNumber ||
      matchesStorefront ||
      matchesCreditPerson ||
      matchesCustomer ||
      matchesProductName ||
      matchesProductCode;

    const matchesPaymentType =
      paymentTypeFilter === "all" ||
      order.paymentType?.toLowerCase() === paymentTypeFilter.toLowerCase();
    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      order.paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase();

    return matchesSearch && matchesPaymentType && matchesPaymentMethod;
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
        toast.success(t("orders.creditPersonAssigned"));
        setShowCreditPersonModal(false);
        setSelectedOrderForCredit(null);
        await loadOrders();
      } else {
        toast.error(response.message || t("orders.failedToAssign"));
      }
    } catch (error) {
      console.error("Error assigning credit person:", error);
      toast.error(t("orders.failedToAssign"));
    } finally {
      setAssigningCreditPerson(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
            {t("orders.title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t("orders.subtitle")}</p>
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
            className="hidden sm:flex items-center gap-2 bg-slate-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm sm:text-base cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{t("common.refresh")}</span>
            <span className="sm:hidden">↻</span>
          </button>
        </div>
      </div>

      {/* Filters with Payment Type Dropdown */}
      <OrdersFilters
        search={search}
        onSearchChange={setSearch}
        storefronts={storefronts}
        selectedStorefrontId={selectedStorefrontId}
        onStorefrontChange={(id) => {
          setSelectedStorefrontId(id);
        }}
        paymentTypeFilter={paymentTypeFilter}
        onPaymentTypeChange={handlePaymentTypeChange}
        paymentMethodFilter={paymentMethodFilter}
        onPaymentMethodChange={setPaymentMethodFilter}
        orders={orders}
        filteredOrders={filteredOrders}
        totalItems={pagination?.totalItems}
        showPaymentTypeFilter={true}
      />

      {/* Orders Table */}
      <OrdersTable
        loading={loading}
        orders={filteredOrders}
        onViewOrder={handleViewOrder}
        onOpenCreditPersonModal={handleOpenCreditPersonModal}
        onOrderDeleted={async () => {
          await loadOrders();
        }}
        pagination={pagination}
        onPageChange={setCurrentPage}
        onLimitChange={(limit) => {
          setItemsPerPage(limit);
          setCurrentPage(1);
        }}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={!!(selectedOrder || loadingDetail)}
        loading={loadingDetail}
        order={selectedOrder}
        onClose={() => {
          setSelectedOrder(null);
          setLoadingDetail(false);
        }}
        onOrderUpdate={async () => {
          await loadOrders();
          await handleRefreshOrderDetails();
        }}
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
    </div>
  );
};
