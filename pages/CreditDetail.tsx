import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Receipt,
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Plus,
  X,
  Store,
  Box,
  Coins,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Eye,
  BarChart3,
  ShoppingCart,
  Wallet,
  MapPin,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCreditPersonaRecords,
  CreditPersonaRecordsData,
  CreditRecordsPagination,
} from "../services/Credit/fetchCreditPersonaRecords";
import { createCreditRecord } from "../services/Credit/createCreditRecord";
import { deleteCreditRecord } from "../services/Credit/deleteCreditRecord";
import { ConfirmModal } from "../components/Common/ConfirmModal";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import { createOrder } from "../services/Order/createOrder";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import {
  fetchCreditPersonaProducts,
  CreditPersonaProductReportResponse,
} from "../services/Reports/fetchCreditPersonaProducts";
import {
  Order,
  fetchOrders,
  OrderPagination,
} from "../services/Order/fetchOrders";
import {
  fetchOrderSummary,
  OrderSummaryData,
} from "../services/Credit/fetchOrderSummary";
import { OrderDetailModal } from "../components/Orders/OrderDetailModal";
import {
  formatDueDate,
  getDueDateUrgency,
  getDueDateCellClasses,
  getCreditPaymentStatus,
  getCreditStatusBadge,
} from "../components/Orders/orderUtils";
import { useLanguage } from "../context/LanguageContext";
import { DateRangePicker } from "../components/Reports/DateRangePicker";
import { formatDateForAPI } from "../components/Quotation/quotationUtils";

type MainTabType = "summary" | "credit";
type TabType = "orders" | "products" | "payments";

export const CreditDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // Get credit person info from location state if available
  const personInfo = location.state as {
    name?: string;
    phone?: string;
    address?: string;
  } | null;

  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTabType>("summary");
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [personaDetail, setPersonaDetail] =
    useState<CreditPersonaRecordsData | null>(null);
  const [productsReport, setProductsReport] =
    useState<CreditPersonaProductReportResponse | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [personName, setPersonName] = useState(
    personInfo?.name || "Credit Person",
  );
  const [personPhone, setPersonPhone] = useState(personInfo?.phone || "");
  const [personAddress, setPersonAddress] = useState(personInfo?.address || "");

  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPagination, setPaymentsPagination] =
    useState<CreditRecordsPagination | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;
  const canDeletePayment = userRole === "owner";

  const [deletePaymentModalOpen, setDeletePaymentModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: string; amount: number; orderNumber: string } | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  // Add Payment Modal State
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    orderId: "",
    paidAmount: 0,
    paymentMethod: "cash",
  });

  // Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

  // Credit Orders State
  const [creditOrders, setCreditOrders] = useState<Order[]>([]);
  const [loadingCreditOrders, setLoadingCreditOrders] = useState(false);
  const [creditOrdersPagination, setCreditOrdersPagination] =
    useState<OrderPagination | null>(null);
  const [creditOrdersPage, setCreditOrdersPage] = useState(1);
  const [creditOrderStatusFilter, setCreditOrderStatusFilter] =
    useState<string>("all");

  // Add Credit Order Modal State
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [isCreatingCredit, setIsCreatingCredit] = useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [stockItems, setStockItems] = useState<StorefrontStockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [creditForm, setCreditForm] = useState({
    storefrontId: "",
    inventoryId: "",
    quantity: 1,
    finalAmount: 0,
    paidAmount: 0,
    paymentMethod: "normal",
  });

  // Order Summary State
  const [orderSummary, setOrderSummary] = useState<OrderSummaryData | null>(
    null,
  );
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryStartDate, setSummaryStartDate] = useState<Date | null>(null);
  const [summaryEndDate, setSummaryEndDate] = useState<Date | null>(null);
  const [summaryAllOrders, setSummaryAllOrders] = useState<Order[]>([]);
  const [loadingSummaryOrders, setLoadingSummaryOrders] = useState(false);
  const [summaryOrdersPage, setSummaryOrdersPage] = useState(1);
  const [summaryOrdersPagination, setSummaryOrdersPagination] =
    useState<OrderPagination | null>(null);

  useEffect(() => {
    if (id) {
      loadCreditDetail();
      loadCreditOrders(1, creditOrderStatusFilter);
    }
  }, [id]);

  useEffect(() => {
    if (id && mainTab === "summary") {
      loadOrderSummary(summaryStartDate, summaryEndDate);
      loadSummaryOrders(1);
    }
  }, [id, mainTab, summaryStartDate, summaryEndDate]);

  const loadCreditOrders = async (
    page: number = 1,
    statusFilter: string = creditOrderStatusFilter,
  ) => {
    if (!id) return;
    setLoadingCreditOrders(true);
    try {
      const response = await fetchOrders(undefined, undefined, "credit", {
        creditPersonId: id,
        page,
        limit: 10,
        paymentStatus: statusFilter !== "all" ? statusFilter : null,
      });
      if (response.success) {
        setCreditOrders(response.data);
        setCreditOrdersPagination(response.pagination ?? null);
        setCreditOrdersPage(page);
      } else {
        toast.error(response.message || "Failed to load credit orders");
      }
    } catch (error) {
      console.error("Error loading credit orders:", error);
      toast.error("Failed to load credit orders");
    } finally {
      setLoadingCreditOrders(false);
    }
  };

  const loadPaymentRecords = async (page: number = 1) => {
    if (!id) return;
    setPaymentsLoading(true);
    try {
      const response = await fetchCreditPersonaRecords(id, page);
      if (response.success && response.data) {
        setPersonaDetail((prev) =>
          prev
            ? {
              ...prev,
              creditRecords: response.data!.creditRecords,
              summary: response.data!.summary,
              orders: response.data!.orders,
            }
            : response.data!,
        );
        setPaymentsPagination(response.pagination ?? null);
        setPaymentsPage(page);
      } else {
        toast.error(response.message || "Failed to load payment records");
      }
    } catch (error) {
      console.error("Error loading payment records:", error);
      toast.error("Failed to load payment records");
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleDeletePaymentClick = (recordId: string, amount: number, orderNumber: string) => {
    setPaymentToDelete({ id: recordId, amount, orderNumber });
    setDeletePaymentModalOpen(true);
  };

  const handleConfirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    setDeletingPaymentId(paymentToDelete.id);
    try {
      const response = await deleteCreditRecord(paymentToDelete.id);
      if (response.success) {
        toast.success("Payment record deleted successfully");
        loadCreditDetail();
        loadCreditOrders(creditOrdersPage);
        if (mainTab === "summary") {
          loadOrderSummary(summaryStartDate, summaryEndDate);
          loadSummaryOrders(summaryOrdersPage);
        }
      } else {
        toast.error(response.message || "Failed to delete payment record");
      }
    } catch (error: any) {
      console.error("Error deleting payment record:", error);
      toast.error(error.message || "Failed to delete payment record");
    } finally {
      setDeletingPaymentId(null);
      setDeletePaymentModalOpen(false);
      setPaymentToDelete(null);
    }
  };

  const loadCreditDetail = async () => {
    if (!id) return;
    setLoading(true);
    setLoadingProducts(true);
    setPaymentsPage(1);
    try {
      const [personaResponse, productsResponse] = await Promise.all([
        fetchCreditPersonaRecords(id, 1),
        fetchCreditPersonaProducts(id),
      ]);

      if (personaResponse.success && personaResponse.data) {
        setPersonaDetail(personaResponse.data);
        setPersonName(personaResponse.data.creditPerson.name);
        setPersonPhone(personaResponse.data.creditPerson.phone);
        setPersonAddress(personaResponse.data.creditPerson.address || "");
        setPaymentsPagination(personaResponse.pagination ?? null);
      } else {
        toast.error(personaResponse.message || "Failed to load credit details");
      }

      if (productsResponse.success) {
        setProductsReport(productsResponse);
      }
    } catch (error) {
      console.error("Error loading credit details:", error);
      toast.error("Failed to load credit details");
    } finally {
      setLoading(false);
      setLoadingProducts(false);
    }
  };

  const loadOrderSummary = async (
    startDate?: Date | null,
    endDate?: Date | null,
  ) => {
    if (!id) return;
    setLoadingSummary(true);
    try {
      const formattedStart = formatDateForAPI(startDate);
      const formattedEnd = formatDateForAPI(endDate);
      const response = await fetchOrderSummary(
        id,
        formattedStart,
        formattedEnd,
      );
      if (response.success && response.data) {
        setOrderSummary(response.data);
      } else {
        toast.error(response.message || "Failed to load order summary");
      }
    } catch (error) {
      console.error("Error loading order summary:", error);
      toast.error("Failed to load order summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadSummaryOrders = async (page: number = 1) => {
    if (!id) return;
    setLoadingSummaryOrders(true);
    try {
      const formattedStart = formatDateForAPI(summaryStartDate);
      const formattedEnd = formatDateForAPI(summaryEndDate);
      const response = await fetchOrders(
        formattedStart,
        formattedEnd,
        undefined,
        {
          creditPersonId: id,
          page,
          limit: 10,
        },
      );
      if (response.success) {
        setSummaryAllOrders(response.data);
        setSummaryOrdersPagination(response.pagination ?? null);
        setSummaryOrdersPage(page);
      }
    } catch (error) {
      console.error("Error loading summary orders:", error);
    } finally {
      setLoadingSummaryOrders(false);
    }
  };

  const formatDateDisplay = (dateString: string) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const isOverdue = (dueDate?: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Cash",
      kpay: "KBZ Pay",
      kbzpay: "KBZ Pay",
      wavepay: "Wave Pay",
      ayapay: "AYA Pay",
      uabpay: "UAB Pay",
      bank_transfer: "Bank Transfer",
    };
    return labels[method?.toLowerCase()] || method;
  };

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "kpay", label: "KBZ Pay" },
    { value: "wavepay", label: "Wave Pay" },
    { value: "ayapay", label: "AYA Pay" },
    { value: "uabpay", label: "UAB Pay" },
    { value: "bank_transfer", label: "Bank Transfer" },
  ];

  const handleOpenAddPayment = () => {
    // Default to first order if available
    const defaultOrderId = personaDetail?.orders[0]?._id || "";
    setPaymentForm({
      orderId: defaultOrderId,
      paidAmount: 0,
      paymentMethod: "cash",
    });
    setShowAddPaymentModal(true);
  };

  const handleOpenAddCredit = async () => {
    setShowAddCreditModal(true);
    setLoadingStock(true);
    try {
      const response = await fetchStorefrontProfiles();
      if (response.success && response.data) {
        setStorefronts(response.data.filter((sf) => sf.status === "active"));
      }
    } catch (error) {
      console.error("Error loading storefronts:", error);
    } finally {
      setLoadingStock(false);
    }
  };

  const handleStorefrontChange = async (storefrontId: string) => {
    setCreditForm({
      ...creditForm,
      storefrontId,
      inventoryId: "",
      finalAmount: 0,
    });
    setLoadingStock(true);
    try {
      const response = await fetchStorefrontStock();
      if (response.success && response.data) {
        // Filter stock for selected storefront
        const filteredStock = response.data.filter(
          (item) => item.storefrontId?._id === storefrontId,
        );
        setStockItems(filteredStock);
      }
    } catch (error) {
      console.error("Error loading stock:", error);
    } finally {
      setLoadingStock(false);
    }
  };

  const handleAddCreditOrder = async () => {
    if (!creditForm.storefrontId) {
      toast.error("Please select a storefront");
      return;
    }

    setIsCreatingCredit(true);
    try {
      const payload = {
        storefrontId: creditForm.storefrontId,
        ordersProducts: [
          {
            inventoryId: import.meta.env.VITE_CREDIT_ID,
            quantity: 1,
          },
        ],
        subTotal: creditForm.finalAmount,
        finalAmount: creditForm.finalAmount,
        paidAmount: creditForm.paidAmount,
        paymentType: "credit" as "credit",
        paymentMethod: "normal",
        creditPersonId: id, // current credit person
      };

      const response = await createOrder(payload);
      if (response.success) {
        toast.success("Credit order created successfully");
        setShowAddCreditModal(false);
        setCreditForm({
          storefrontId: "",
          quantity: 1,
          finalAmount: 0,
          paidAmount: 0,
          paymentMethod: "normal",
          inventoryId: "",
        });
        await loadCreditDetail();
      } else {
        toast.error(response.message || "Failed to create credit order");
      }
    } catch (error) {
      console.error("Error creating credit order:", error);
      toast.error("Failed to create credit order");
    } finally {
      setIsCreatingCredit(false);
    }
  };

  const handleOpenAddPaymentForOrder = (orderId: string) => {
    setPaymentForm({
      orderId,
      paidAmount: 0,
      paymentMethod: "cash",
    });
    setShowAddPaymentModal(true);
  };

  const handleCloseAddPayment = () => {
    setShowAddPaymentModal(false);
    setPaymentForm({ orderId: "", paidAmount: 0, paymentMethod: "cash" });
  };

  const handleAddPayment = async () => {
    if (!paymentForm.orderId) {
      toast.error(t("creditDetail.selectOrder"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createCreditRecord({
        orderId: paymentForm.orderId,
        paidAmount: paymentForm.paidAmount,
        paymentMethod: paymentForm.paymentMethod,
      });

      if (response.success) {
        toast.success(t("creditDetail.paymentRecorded"));
        handleCloseAddPayment();
        // Refresh the credit details
        await loadCreditDetail();
      } else {
        toast.error(response.message || t("creditDetail.failedToRecord"));
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(t("creditDetail.failedToRecord"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewOrder = async (orderId: string) => {
    setLoadingOrderDetail(true);
    setSelectedOrder(null);
    try {
      const response = await fetchOrderById(orderId);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
      } else {
        toast.error(response.message || "Failed to load order details");
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/credits")}
          className="hidden md:block p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            {personName}
          </h1>
          {personAddress && (
            <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" />
              {personAddress}
            </p>
          )}
          {/* {personPhone && (
            <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
              <Phone className="w-4 h-4" />
              {personPhone}
            </p>
          )} */}
          {mainTab === "summary" && orderSummary?.creditPerson && (
            <div className="flex items-center gap-4 mt-1">
              {orderSummary.creditPerson.creditLimit != null && (
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <Wallet className="hidden xl:block w-4 h-4 text-blue-500" />
                  {t("creditDetail.creditLimit")}:{" "}
                  <span className="font-semibold">
                    {orderSummary.creditPerson.creditLimit.toLocaleString()} MMK
                  </span>
                </p>
              )}
              {orderSummary.creditPerson.remainingLimit != null && (
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <Wallet className="hidden xl:block w-4 h-4 text-green-500" />
                  {t("creditDetail.remainingLimit")}:{" "}
                  <span className="font-semibold text-green-600">
                    {orderSummary.creditPerson.remainingLimit.toLocaleString()}{" "}
                    MMK
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
        <button
          onClick={loadCreditDetail}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden md:inline">{t("creditDetail.refresh")}</span>
        </button>
        {personaDetail && (
          <div className="flex gap-2">
            {/* <button
              onClick={handleOpenAddCredit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm transition-all active:scale-95"
            >
              <Box className="w-4 h-4" />
              Add Credit
            </button> */}
            {personaDetail.orders.length > 0 && mainTab === "credit" && (
              <button
                onClick={handleOpenAddPayment}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                {t("creditDetail.addPayment")}
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-slate-500">{t("creditDetail.loading")}</p>
        </div>
      ) : personaDetail ? (
        <>
          {/* Main Tabs Navigation */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setMainTab("summary")}
              className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors border-b-2 ${mainTab === "summary"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              {t("creditDetail.summary")}
            </button>
            <button
              onClick={() => setMainTab("credit")}
              className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors border-b-2 ${mainTab === "credit"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <CreditCard className="w-4 h-4" />
              {t("creditDetail.title")}
            </button>
          </div>

          {/* Summary Tab */}
          {mainTab === "summary" && (
            <>
              {/* Date Range Filter */}
              <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">
                      {t("creditDetail.dateRange")}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: t("creditDetail.all"), start: null, end: null },
                      {
                        label: t("creditDetail.days7"),
                        start: (() => {
                          const d = new Date();
                          d.setDate(d.getDate() - 7);
                          return d;
                        })(),
                        end: new Date(),
                      },
                      {
                        label: t("creditDetail.days30"),
                        start: (() => {
                          const d = new Date();
                          d.setDate(d.getDate() - 30);
                          return d;
                        })(),
                        end: new Date(),
                      },
                      {
                        label: t("creditDetail.thisMonth"),
                        start: (() => {
                          const d = new Date();
                          d.setDate(1);
                          return d;
                        })(),
                        end: new Date(),
                      },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          setSummaryStartDate(preset.start);
                          setSummaryEndDate(preset.end);
                        }}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${summaryStartDate === null && preset.start === null
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="sm:ml-auto">
                    <DateRangePicker
                      startDate={summaryStartDate}
                      endDate={summaryEndDate}
                      onChange={(start, end) => {
                        setSummaryStartDate(start);
                        setSummaryEndDate(end);
                      }}
                    />
                  </div>
                </div>
              </div>

              {loadingSummary ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-slate-500">{t("creditDetail.loading")}</p>
                </div>
              ) : !orderSummary ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">
                    {t("creditDetail.noOrdersForPeriod")}
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-xl shadow-sm border">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Receipt className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("creditDetail.totalOrders")}
                          </p>
                          <p className="text-xl font-bold text-slate-800">
                            {orderSummary.summary.totalOrders}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-slate-100 rounded-xl">
                          <DollarSign className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("creditDetail.totalAmount")}
                          </p>
                          <p className="text-xl font-bold text-slate-800">
                            {orderSummary.summary.totalFinalAmount.toLocaleString()}{" "}
                            <span className="text-xs font-normal">MMK</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <Coins className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("creditDetail.totalPaidAmount")}
                          </p>
                          <p className="text-xl font-bold text-green-600">
                            {orderSummary.summary.totalPaidAmount.toLocaleString()}{" "}
                            <span className="text-xs font-normal">MMK</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-3 rounded-xl ${orderSummary.summary.totalOutstandingAmount > 0 ? "bg-red-100" : "bg-green-100"}`}
                        >
                          <AlertTriangle
                            className={`w-5 h-5 ${orderSummary.summary.totalOutstandingAmount > 0 ? "text-red-600" : "text-green-600"}`}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("creditDetail.outstandingAmount")}
                          </p>
                          <p
                            className={`text-xl font-bold ${orderSummary.summary.totalOutstandingAmount > 0 ? "text-red-600" : "text-green-600"}`}
                          >
                            {orderSummary.summary.totalOutstandingAmount.toLocaleString()}{" "}
                            <span className="text-xs font-normal">MMK</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl shadow-sm border">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("creditDetail.creditPaidSplit")}
                          </p>
                          <p className="text-xl font-bold text-slate-800">
                            <span className="text-orange-600">
                              {orderSummary.summary.creditOrders}
                            </span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-green-600">
                              {orderSummary.summary.paidOrders}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Storefront vs Direct-Sale Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="p-4 border-b bg-blue-50">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                          <Store className="w-4 h-4 text-blue-600" />
                          {t("creditDetail.storefront")}
                        </h3>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("creditDetail.orders")}
                          </p>
                          <p className="text-lg font-bold text-slate-800">
                            {orderSummary.summary.storefront.totalOrders}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("creditDetail.totalAmount")}
                          </p>
                          <p className="text-lg font-bold text-slate-800">
                            {orderSummary.summary.storefront.totalFinalAmount.toLocaleString()}{" "}
                            MMK
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("creditDetail.totalPaidAmount")}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {orderSummary.summary.storefront.totalPaidAmount.toLocaleString()}{" "}
                            MMK
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("creditDetail.outstandingAmount")}
                          </p>
                          <p
                            className={`text-lg font-bold ${orderSummary.summary.storefront.totalOutstandingAmount > 0 ? "text-red-600" : "text-green-600"}`}
                          >
                            {orderSummary.summary.storefront.totalOutstandingAmount.toLocaleString()}{" "}
                            MMK
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="p-4 border-b bg-purple-50">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4 text-purple-600" />
                          {t("creditDetail.directSale")}
                        </h3>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("creditDetail.orders")}
                          </p>
                          <p className="text-lg font-bold text-slate-800">
                            {orderSummary.summary.directSale.totalOrders}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("creditDetail.totalAmount")}
                          </p>
                          <p className="text-lg font-bold text-slate-800">
                            {orderSummary.summary.directSale.totalFinalAmount.toLocaleString()}{" "}
                            MMK
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("creditDetail.totalPaidAmount")}
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {orderSummary.summary.directSale.totalPaidAmount.toLocaleString()}{" "}
                            MMK
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            {t("creditDetail.outstandingAmount")}
                          </p>
                          <p
                            className={`text-lg font-bold ${orderSummary.summary.directSale.totalOutstandingAmount > 0 ? "text-red-600" : "text-green-600"}`}
                          >
                            {orderSummary.summary.directSale.totalOutstandingAmount.toLocaleString()}{" "}
                            MMK
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* All Orders Table */}
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-primary" />
                        {t("creditDetail.allOrders")} (
                        {summaryOrdersPagination?.totalItems ??
                          summaryAllOrders.length}
                        )
                      </h3>
                      <button
                        onClick={() => loadSummaryOrders(summaryOrdersPage)}
                        disabled={loadingSummaryOrders}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${loadingSummaryOrders ? "animate-spin" : ""}`}
                        />
                        {t("common.refresh")}
                      </button>
                    </div>
                    {loadingSummaryOrders ? (
                      <div className="p-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">
                          Loading orders...
                        </p>
                      </div>
                    ) : summaryAllOrders.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">
                          {t("creditDetail.noOrdersForPeriod")}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left min-w-[900px]">
                            <thead className="bg-slate-50 text-slate-600 border-b">
                              <tr>
                                <th className="px-4 py-3 font-medium">
                                  Order #
                                </th>
                                <th className="px-4 py-3 font-medium">Date</th>
                                <th className="px-4 py-3 font-medium">
                                  {t("creditDetail.saleType")}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                  {t("creditDetail.paymentType")}
                                </th>
                                {/* <th className="px-4 py-3 font-medium">
                                  Storefront
                                </th> */}
                                {/* <th className="px-4 py-3 font-medium">Items</th> */}
                                <th className="px-4 py-3 font-medium text-right">
                                  Total
                                </th>
                                {/* <th className="px-4 py-3 font-medium text-right">
                                  Paid
                                </th> */}
                                {/* <th className="px-4 py-3 font-medium">
                                  {t("creditDetail.dueDate")}
                                </th> */}
                                <th className="px-4 py-3 font-medium">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {summaryAllOrders.map((order) => (
                                <tr
                                  key={order._id}
                                  className="hover:bg-slate-50"
                                >
                                  <td className="px-4 py-3">
                                    <span className="text-blue-600 font-medium">
                                      {order.orderNumber}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {formatDateDisplay(order.createdAt)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.saleType === "direct-sale"
                                          ? "bg-purple-100 text-purple-700"
                                          : "bg-blue-100 text-blue-700"
                                        }`}
                                    >
                                      {order.saleType === "direct-sale"
                                        ? "Direct"
                                        : "Storefront"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.paymentType === "credit"
                                          ? "bg-orange-100 text-orange-700"
                                          : "bg-green-100 text-green-700"
                                        }`}
                                    >
                                      {order.paymentType === "credit"
                                        ? "Credit"
                                        : "Paid"}
                                    </span>
                                  </td>
                                  {/* <td className="px-4 py-3 text-slate-600">
                                    {order.storefrontId
                                      ? order.storefrontId.locationName ||
                                        order.storefrontId.storefrontName ||
                                        "—"
                                      : "—"}
                                  </td> */}
                                  {/* <td className="px-4 py-3 text-slate-600">
                                    {order.ordersProducts?.length || 0}
                                  </td> */}
                                  <td className="px-4 py-3 text-right font-medium text-slate-800">
                                    {order.finalAmount.toLocaleString()} MMK
                                  </td>
                                  {/* <td className="px-4 py-3 text-right font-medium text-green-600">
                                    {order.paidAmount.toLocaleString()} MMK
                                  </td> */}
                                  {/* <td className="px-4 py-3">
                                    {order.dueDate ? (
                                      <span
                                        className={
                                          isOverdue(order.dueDate)
                                            ? "text-red-600 font-medium"
                                            : "text-slate-600"
                                        }
                                      >
                                        {formatDateDisplay(order.dueDate)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td> */}
                                  <td className="px-4 py-3">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.orderStatus === "completed"
                                          ? "bg-green-100 text-green-700"
                                          : order.orderStatus === "cancelled"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >
                                      {order.orderStatus?.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {summaryOrdersPagination &&
                          summaryOrdersPagination.totalPages > 1 && (
                            <div className="px-4 py-3 border-t flex items-center justify-between bg-slate-50">
                              <p className="text-sm text-slate-500">
                                Page {summaryOrdersPage} of{" "}
                                {summaryOrdersPagination.totalPages}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    loadSummaryOrders(summaryOrdersPage - 1)
                                  }
                                  disabled={
                                    summaryOrdersPage <= 1 ||
                                    loadingSummaryOrders
                                  }
                                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    loadSummaryOrders(summaryOrdersPage + 1)
                                  }
                                  disabled={
                                    summaryOrdersPage >=
                                    (summaryOrdersPagination.totalPages ||
                                      1) || loadingSummaryOrders
                                  }
                                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* Credit Tab */}
          {mainTab === "credit" && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <LayoutGrid className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">
                        {t("creditDetail.totalRecords")}
                      </p>
                      <p className="text-2xl font-bold text-slate-800">
                        {personaDetail.summary.totalCreditRecords}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">
                        {t("creditDetail.totalPaid")}
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {personaDetail?.summary?.totalPaidViaCreditRecords?.toLocaleString()}{" "}
                        MMK
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">
                        {t("creditDetail.outstanding")}
                      </p>
                      <p className="text-2xl font-bold text-orange-600">
                        {personaDetail.summary.totalOutstandingAmount.toLocaleString()}{" "}
                        MMK
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex gap-2 mb-6 border-b">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors border-b-2 ${activeTab === "orders"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                  <Receipt className="w-4 h-4" />
                  {t("creditDetail.associatedOrders")} (
                  {personaDetail.orders.length})
                </button>
                <button
                  onClick={() => setActiveTab("products")}
                  className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors border-b-2 ${activeTab === "products"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                  <Box className="w-4 h-4" />
                  Purchased Products (
                  {productsReport?.data.totals.totalUniqueProducts || 0})
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors border-b-2 ${activeTab === "payments"
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                  <CreditCard className="w-4 h-4" />
                  {t("creditDetail.paymentRecords")} (
                  {personaDetail.summary.totalCreditRecords})
                </button>
              </div>

              {/* Tab Content */}
              <div className="mb-6">
                {activeTab === "orders" && (
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-primary" />
                        {t("creditDetail.associatedOrders")} (
                        {creditOrdersPagination?.totalItems ??
                          creditOrders.length}
                        )
                      </h2>
                      <div className="flex items-center gap-2">
                        <select
                          className="border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                          value={creditOrderStatusFilter}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            setCreditOrderStatusFilter(newStatus);
                            loadCreditOrders(1, newStatus);
                          }}
                        >
                          <option value="all">{t("creditOrders.statusAll") || "All Status"}</option>
                          <option value="pending">{t("creditOrders.statusPending") || "Pending Payment"}</option>
                          <option value="unpaid">{t("creditOrders.statusUnpaid") || "Unpaid"}</option>
                          <option value="partial">{t("creditOrders.statusPartial") || "Partially Paid"}</option>
                          <option value="paid">{t("creditOrders.statusFullyPaid") || "Fully Paid"}</option>
                        </select>
                        <button
                          onClick={() => loadCreditOrders(creditOrdersPage, creditOrderStatusFilter)}
                          disabled={loadingCreditOrders}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${loadingCreditOrders ? "animate-spin" : ""}`}
                          />
                          {t("common.refresh")}
                        </button>
                      </div>
                    </div>
                    {loadingCreditOrders ? (
                      <div className="p-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">
                          Loading orders...
                        </p>
                      </div>
                    ) : creditOrders.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">{t("creditDetail.noOrders")}</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left min-w-[900px]">
                            <thead className="bg-slate-50 text-slate-600 border-b">
                              <tr>
                                <th className="px-4 py-3 font-medium">
                                  Order #
                                </th>
                                <th className="px-4 py-3 font-medium">Date</th>
                                {/* <th className="px-4 py-3 font-medium">Type</th> */}
                                {/* <th className="px-4 py-3 font-medium">
                                  Storefront
                                </th> */}
                                {/* <th className="px-4 py-3 font-medium">Items</th> */}
                                <th className="px-4 py-3 font-medium text-right">
                                  Total
                                </th>
                                <th className="px-4 py-3 font-medium text-right">
                                  Paid
                                </th>
                                <th className="px-4 py-3 font-medium text-right">
                                  Remaining
                                </th>
                                <th className="px-4 py-3 font-medium">
                                  Due Date
                                </th>
                                <th className="px-4 py-3 font-medium">
                                  Status
                                </th>
                                <th className="px-4 py-3 font-medium">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {creditOrders.map((order) => (
                                <tr
                                  key={order._id}
                                  className="hover:bg-slate-50 cursor-pointer"
                                  onClick={() => handleViewOrder(order._id)}
                                >
                                  <td className="px-4 py-3">
                                    <span className="font-medium text-blue-600">
                                      {order.orderNumber}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {new Date(
                                      order.createdAt,
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </td>
                                  {/* <td className="px-4 py-3">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        order.saleType === "direct-sale"
                                          ? "bg-purple-100 text-purple-700"
                                          : "bg-blue-100 text-blue-700"
                                      }`}
                                    >
                                      {order.saleType === "direct-sale"
                                        ? "Direct"
                                        : "Storefront"}
                                    </span>
                                  </td> */}
                                  {/* <td className="px-4 py-3 text-slate-600">
                                    {order.storefrontId?.locationName || "—"}
                                  </td> */}
                                  {/* <td className="px-4 py-3 text-slate-600">
                                      {order.ordersProducts?.length || 0}
                                    </td> */}
                                  <td className="px-4 py-3 text-right font-medium text-slate-800">
                                    {order.finalAmount?.toLocaleString()} MMK
                                  </td>
                                  <td className="px-4 py-3 text-right text-green-600 font-medium">
                                    {order.paidAmount?.toLocaleString()} MMK
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium text-orange-600">
                                    {order.remainingBalance?.toLocaleString()}{" "}
                                    MMK
                                  </td>
                                  <td className="px-4 py-3">
                                    {order.dueDate ? (
                                      (() => {
                                        const dueDatePart =
                                          order.dueDate.split("T")[0];
                                        const urgency = getDueDateUrgency(
                                          dueDatePart,
                                          7,
                                        );
                                        return (
                                          <div
                                            className={`rounded-lg px-2 py-1 ${urgency === "near"
                                                ? "bg-amber-50 border border-amber-200"
                                                : ""
                                              }`}
                                          >
                                            <div
                                              className={`text-xs font-medium ${getDueDateCellClasses(urgency)}`}
                                            >
                                              {formatDueDate(dueDatePart)}
                                            </div>
                                            {urgency === "expired" && (
                                              <span className="text-[10px] font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                                                {t(
                                                  "creditOrders.dueDateExpired",
                                                )}
                                              </span>
                                            )}
                                            {urgency === "near" && (
                                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                                {t(
                                                  "creditOrders.dueDateDueSoon",
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {(() => {
                                      const creditStatus =
                                        getCreditPaymentStatus(order);
                                      const badge = getCreditStatusBadge(
                                        creditStatus,
                                        t,
                                      );
                                      return (
                                        <span
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${badge.bgColor} ${badge.textColor} ${badge.borderColor}`}
                                        >
                                          <span
                                            className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`}
                                          ></span>
                                          {badge.label}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewOrder(order._id);
                                        }}
                                        className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1.5 rounded hover:bg-blue-200 border border-blue-200 font-medium transition-colors flex items-center gap-1"
                                      >
                                        <Eye className="w-3 h-3" />
                                        {t("creditOrders.view")}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenAddPaymentForOrder(
                                            order._id,
                                          );
                                        }}
                                        className="text-xs bg-green-100 text-green-700 px-2.5 py-1.5 rounded hover:bg-green-200 border border-green-200 font-medium transition-colors flex items-center gap-1"
                                      >
                                        <Coins className="w-3 h-3" />
                                        {t("creditDetail.addPayment")}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {creditOrdersPagination &&
                          creditOrdersPagination.totalPages > 1 && (
                            <div className="px-4 py-3 border-t flex items-center justify-between bg-slate-50">
                              <p className="text-sm text-slate-500">
                                Page {creditOrdersPage} of{" "}
                                {creditOrdersPagination.totalPages}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    loadCreditOrders(creditOrdersPage - 1)
                                  }
                                  disabled={
                                    creditOrdersPage <= 1 || loadingCreditOrders
                                  }
                                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    loadCreditOrders(creditOrdersPage + 1)
                                  }
                                  disabled={
                                    creditOrdersPage >=
                                    (creditOrdersPagination.totalPages ||
                                      1) || loadingCreditOrders
                                  }
                                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                      </>
                    )}
                  </div>
                )}

                {activeTab === "products" && (
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                      <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Box className="w-5 h-5 text-primary" />
                        Purchased Products Summary
                      </h2>
                      {productsReport && (
                        <div className="flex gap-4 text-sm">
                          <span className="text-slate-500">
                            Total Qty:{" "}
                            <span className="font-bold text-slate-800">
                              {productsReport.data.totals.totalQuantity}
                            </span>
                          </span>
                          <span className="text-slate-500">
                            Total Orders:{" "}
                            <span className="font-bold text-slate-800">
                              {productsReport.data.totals.totalOrderCount}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      {loadingProducts ? (
                        <div className="p-12 text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                          <p className="text-slate-400 text-sm">
                            Loading products...
                          </p>
                        </div>
                      ) : !productsReport ||
                        productsReport.data.products.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 text-sm">
                          No products found for this credit persona.
                        </div>
                      ) : (
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-600 border-b">
                            <tr>
                              <th className="px-4 py-3 font-medium">
                                Product Name
                              </th>
                              <th className="px-4 py-3 font-medium">SKU</th>
                              <th className="px-4 py-3 font-medium text-right">
                                Quantity
                              </th>
                              <th className="px-4 py-3 font-medium text-right">
                                Order Count
                              </th>
                              <th className="px-4 py-3 font-medium">Unit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {productsReport.data.products.map(
                              (product, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-slate-800">
                                      {product.productName}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {product.productCode}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {product.SKU}
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-slate-800">
                                    {product.totalQuantity.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-right text-slate-600">
                                    {product.orderCount}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 uppercase">
                                    {product.unitOfMeasure}
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "payments" && (
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        {t("creditDetail.paymentRecords")}
                      </h2>
                      {paymentsPagination &&
                        paymentsPagination.totalItems > 0 && (
                          <p className="text-xs text-slate-500">
                            {paymentsPagination.totalItems} total records
                          </p>
                        )}
                    </div>
                    {paymentsLoading ? (
                      <div className="p-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">
                          Loading payments...
                        </p>
                      </div>
                    ) : personaDetail.creditRecords.records.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        {t("creditDetail.noRecords")}
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto h-[calc(100vh-525px)]">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 border-b sticky top-0">
                              <tr>
                                <th className="px-4 py-3 font-medium">
                                  {t("creditDetail.order")}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                  {t("creditDetail.paymentDate")}
                                </th>
                                <th className="px-4 py-3 font-medium">
                                  {t("common.method")}
                                </th>
                                <th className="px-4 py-3 font-medium text-right">
                                  {t("creditDetail.amountPaid")}
                                </th>
                                <th className="px-4 py-3 font-medium text-right">
                                  {t("creditDetail.remaining")}
                                </th>
                                {canDeletePayment && (
                                  <th className="px-4 py-3 font-medium text-center">
                                    {t("common.actions") || "Actions"}
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {personaDetail.creditRecords.records.map(
                                (record) => (
                                  <tr
                                    key={record._id}
                                    className="hover:bg-slate-50"
                                  >
                                    <td className="px-4 py-3">
                                      <span className="text-blue-600 font-medium">
                                        {record.orderId.orderNumber}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                      <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {formatDate(record.paymentDate)}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                                        {getPaymentMethodLabel(
                                          record.paymentMethod,
                                        )}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600">
                                      {record.paidAmount.toLocaleString()} MMK
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <span
                                        className={`font-medium ${record.remainingBalanceAfterPayment >
                                            0
                                            ? "text-orange-600"
                                            : "text-green-600"
                                          }`}
                                      >
                                        {record.remainingBalanceAfterPayment?.toLocaleString()}{" "}
                                        MMK
                                      </span>
                                    </td>
                                    {canDeletePayment && (
                                      <td className="px-4 py-3 text-center">
                                        <button
                                          onClick={() =>
                                            handleDeletePaymentClick(
                                              record._id,
                                              record.paidAmount,
                                              record.orderId.orderNumber
                                            )
                                          }
                                          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                                          title="Delete payment record"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>

                        {paymentsPagination &&
                          paymentsPagination.totalPages > 1 && (
                            <div className="px-4 py-3 border-t flex items-center justify-between bg-slate-50">
                              <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    loadPaymentRecords(paymentsPage - 1)
                                  }
                                  disabled={
                                    paymentsPage <= 1 || paymentsLoading
                                  }
                                  className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
                                >
                                  Previous
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    loadPaymentRecords(paymentsPage + 1)
                                  }
                                  disabled={
                                    paymentsPage >=
                                    paymentsPagination.totalPages ||
                                    paymentsLoading
                                  }
                                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
                                >
                                  Next
                                </button>
                              </div>
                              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-700">
                                  Showing{" "}
                                  <span className="font-medium">
                                    {(paymentsPage - 1) *
                                      paymentsPagination.itemsPerPage +
                                      1}
                                  </span>{" "}
                                  to{" "}
                                  <span className="font-medium">
                                    {Math.min(
                                      paymentsPage *
                                      paymentsPagination.itemsPerPage,
                                      paymentsPagination.totalItems,
                                    )}
                                  </span>{" "}
                                  of{" "}
                                  <span className="font-medium">
                                    {paymentsPagination.totalItems}
                                  </span>{" "}
                                  results
                                </p>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      loadPaymentRecords(paymentsPage - 1)
                                    }
                                    disabled={
                                      paymentsPage <= 1 || paymentsLoading
                                    }
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                  >
                                    <ChevronLeft className="h-5 w-5" />
                                  </button>
                                  {Array.from(
                                    {
                                      length: Math.min(
                                        5,
                                        paymentsPagination.totalPages,
                                      ),
                                    },
                                    (_, i) => {
                                      let pageNum: number;
                                      const { totalPages } = paymentsPagination;
                                      if (totalPages <= 5) {
                                        pageNum = i + 1;
                                      } else if (paymentsPage <= 3) {
                                        pageNum = i + 1;
                                      } else if (
                                        paymentsPage >=
                                        totalPages - 2
                                      ) {
                                        pageNum = totalPages - 4 + i;
                                      } else {
                                        pageNum = paymentsPage - 2 + i;
                                      }
                                      return (
                                        <button
                                          key={pageNum}
                                          type="button"
                                          onClick={() =>
                                            loadPaymentRecords(pageNum)
                                          }
                                          disabled={paymentsLoading}
                                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${paymentsPage === pageNum
                                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                              : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"
                                            }`}
                                        >
                                          {pageNum}
                                        </button>
                                      );
                                    },
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      loadPaymentRecords(paymentsPage + 1)
                                    }
                                    disabled={
                                      paymentsPage >=
                                      paymentsPagination.totalPages ||
                                      paymentsLoading
                                    }
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                  >
                                    <ChevronRight className="h-5 w-5" />
                                  </button>
                                </nav>
                              </div>
                            </div>
                          )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Failed to load credit details</p>
          <button
            onClick={loadCreditDetail}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Modals remain same as before */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center bg-green-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-600" />
                {t("creditDetail.recordPayment")}
              </h2>
              <button
                onClick={handleCloseAddPayment}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Order Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("creditDetail.selectOrder")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  value={paymentForm.orderId}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, orderId: e.target.value })
                  }
                >
                  <option value="">
                    -- {t("creditDetail.selectOrder")} --
                  </option>
                  {[...personaDetail?.orders].reverse().map((order) => (
                    <option key={order._id} value={order._id}>
                      {order.orderNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("creditDetail.amount")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder={t("creditDetail.enterAmount")}
                  value={paymentForm.paidAmount || ""}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paidAmount: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("creditDetail.paymentMethod")}
                </label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMethod: e.target.value,
                    })
                  }
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
              <button
                onClick={handleCloseAddPayment}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleAddPayment}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{" "}
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />{" "}
                    {t("creditDetail.recordPayment")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={!!(selectedOrder || loadingOrderDetail)}
        loading={loadingOrderDetail}
        order={selectedOrder}
        onClose={() => {
          setSelectedOrder(null);
          setLoadingOrderDetail(false);
        }}
      />
      {/* Add Credit Model */}
      {showAddCreditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-lg overflow-hidden flex flex-col animate-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-blue-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Box className="w-6 h-6 text-blue-600" />
                Add New Credit Order
              </h2>
              <button
                onClick={() => setShowAddCreditModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-white/50 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Storefront Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Store className="w-4 h-4 text-slate-400" />
                  Select Storefront <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-slate-300 rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  value={creditForm.storefrontId}
                  onChange={(e) => handleStorefrontChange(e.target.value)}
                >
                  <option value="">-- Choose a Storefront --</option>
                  {storefronts.map((sf) => (
                    <option key={sf._id} value={sf._id}>
                      {sf.locationName} ({sf.locationCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Subtotal */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Subtotal (MMK)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter subtotal amount..."
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm font-bold text-lg"
                    value={creditForm.finalAmount}
                    onChange={(e) =>
                      setCreditForm({
                        ...creditForm,
                        finalAmount: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* Summary Summary */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex justify-between items-center text-blue-900">
                <span className="font-medium">Credit Amount to be added:</span>
                <span className="text-xl font-bold">
                  {(
                    creditForm.finalAmount - creditForm.paidAmount
                  ).toLocaleString()}{" "}
                  MMK
                </span>
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setShowAddCreditModal(false)}
                className="px-6 py-3 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCreditOrder}
                disabled={isCreatingCredit}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 font-bold shadow-lg shadow-blue-200 active:scale-95"
              >
                {isCreatingCredit ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Coins className="w-5 h-5" />
                    Add Credit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deletePaymentModalOpen}
        title="Delete Payment Record"
        message={`Are you sure you want to delete the payment of ${paymentToDelete?.amount.toLocaleString()} MMK for order ${paymentToDelete?.orderNumber}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        onConfirm={handleConfirmDeletePayment}
        onCancel={() => {
          setDeletePaymentModalOpen(false);
          setPaymentToDelete(null);
        }}
        isLoading={deletingPaymentId !== null}
      />
    </div>
  );
};
