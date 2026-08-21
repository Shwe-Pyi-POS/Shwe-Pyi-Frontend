import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { markQuotationAsConverted } from "../services/Quotation/quotationApi";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { getSavedPrintPaperSize } from "../utils/printPaperSize";
import { detectDevice } from "../utils/deviceDetect";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import { fetchCategories } from "../services/Inventory/fetchCategories";
import { createDirectSale } from "../services/Order/createDirectSale";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { createCreditPersona } from "../services/Credit/createCreditPersona";
import {
  DirectSaleCartItem,
  createDirectSaleCartLine,
  directSaleCartSubtotal,
  directSaleLineToOrderProduct,
  applyCatalogUnitPrice,
  getCatalogUnitPrice,
} from "../utils/directSaleCart";
import { getCartLineId } from "../utils/posCartUom";
import { PaymentMethod } from "../types/pos";

const DIRECT_SALE_STOREFRONT_ID = import.meta.env.VITE_DIRECT_SALE_STOREFRONT_ID || "6a28df12c5cf1644db3c35a1";

export const useDirectSale = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] = useState<string>("");
  const [allStockItems, setAllStockItems] = useState<StorefrontStockItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(100);

  const [cart, setCart] = useState<DirectSaleCartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<"paid" | "credit">("paid");
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [selectedCreditPersonId, setSelectedCreditPersonId] =
    useState<string>("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState("");
  const [discount, setDiscount] = useState(0);
  const [markup, setMarkup] = useState(0);
  const [markupAmount, setMarkupAmount] = useState(0);
  const [note, setNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStorefrontMenu, setShowStorefrontMenu] = useState(false);
  const [useMarkup, setUseMarkup] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH,
  );
  const [showDiscountCalculator, setShowDiscountCalculator] = useState(false);
  const [showMarkupCalculator, setShowMarkupCalculator] = useState(false);
  const [discountAmount, setDiscountAmount] = useState("");
  const [transportFee, setTransportFee] = useState(0);
  const [perItemTransportFees, setPerItemTransportFees] = useState<Record<string, number>>({});
  const [createdAt, setCreatedAt] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const devices = detectDevice();

  const [convertingQuotationId, setConvertingQuotationId] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const state = location.state as { quotationToConvert?: any } | null;
    if (state?.quotationToConvert) {
      const q = state.quotationToConvert;
      setConvertingQuotationId(q._id);

      // Set customer
      if (q.customerName) setCustomerName(q.customerName);
      if (q.customerPhone) setCustomerPhone(q.customerPhone);
      if (q.note) setNote(q.note);
      if (q.discount) setDiscount(q.discount);
      const cpId = typeof q.creditPersonId === "object" ? q.creditPersonId?._id : q.creditPersonId;
      if (cpId) setSelectedCreditPersonId(cpId);

      // Set storefront
      const sfId = typeof q.storefrontId === "object" ? q.storefrontId?._id : q.storefrontId;
      if (sfId) setSelectedStorefrontId(sfId);

      // Populate cart
      const products = q.products?.length ? q.products : q.ordersProducts || [];
      const loadedCart: DirectSaleCartItem[] = products.map((p: any) => {
        const inv = p.inventoryId;
        const invId = typeof inv === "string" ? inv : inv._id;
        const baseUnit = typeof inv === "object" ? inv.unitOfMeasure?.trim() || "piece" : "piece";
        const selectedUnit = p.unit || baseUnit;
        const stockItem: StorefrontStockItem = {
          _id: `q-${invId}`,
          storefrontId: {
            _id: sfId || "",
            locationCode: "",
            locationName: "",
          },
          inventoryId: {
            _id: invId,
            productName: p.productName || (typeof inv === "object" ? inv.productName : "") || "",
            productCode: p.productCode || (typeof inv === "object" ? inv.productCode : "") || "",
            SKU: typeof inv === "object" ? inv.SKU || "" : "",
            category: "",
            profitMargin: null,
            profitAmount: null,
            sellingPrice: p.unitPrice || (typeof inv === "object" ? inv.sellingPrice : 0) || 0,
            unitOfMeasure: baseUnit,
            uomConversions: typeof inv === "object" ? inv.uomConversions : undefined,
          },
          quantity: p.quantity,
          availableQuantity: 999999,
          isLowStock: false,
          lastUpdated: "",
          createdAt: "",
          updatedAt: "",
        };
        const unitPrice = p.unitPrice || (typeof inv === "object" ? inv.sellingPrice : 0) || 0;
        return { stockItem, qty: p.quantity, selectedUnit, unitPrice };
      });
      setCart(loadedCart);

      // Clear location state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const loadStockItems = async (storefrontIdOverride?: string) => {
    const targetStorefrontId = storefrontIdOverride || selectedStorefrontId || DIRECT_SALE_STOREFRONT_ID;
    try {
      const response = await fetchStorefrontStock(
        targetStorefrontId,
        currentPage,
        itemsPerPage,
        selectedCategory === "All" ? undefined : selectedCategory,
        search,
      );
      if (response.success && response.data) {
        setAllStockItems(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalItems(response.pagination.totalItems);
        }
      }
    } catch (error) {
      console.error("Error loading stock items:", error);
      toast.error(t("pos.failedToLoadProducts"));
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const sfResponse = await fetchStorefrontProfiles();
      let firstId: string | null = null;
      if (sfResponse.success && sfResponse.data) {
        const activeStorefronts = sfResponse.data.filter(
          (sf) => sf.status === "active",
        );
        setStorefronts(activeStorefronts);
        const match = activeStorefronts.find(
          (sf) => sf._id === DIRECT_SALE_STOREFRONT_ID,
        );
        if (match) {
          firstId = match._id;
          setSelectedStorefrontId(match._id);
        } else if (activeStorefronts.length > 0) {
          firstId = activeStorefronts[0]._id;
          setSelectedStorefrontId(activeStorefronts[0]._id);
        }
      }

      const catResponse = await fetchCategories();
      if (catResponse.success && catResponse.data) {
        setCategories(catResponse.data);
      }

      await loadStockItems(firstId || undefined);
    } catch (error) {
      toast.error(t("directSale.failedToProcessSale"));
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }

    loadCreditPersonas();
  };

  const loadCreditPersonas = async () => {
    try {
      const cpResponse = await fetchCreditPersonas();
      if (cpResponse.success && cpResponse.data) {
        const activePersonas = cpResponse.data.filter((p) => !p.blacklist);
        setCreditPersonas(activePersonas);
      }
    } catch (error) {
      console.error("Error loading credit personas:", error);
    }
  };

  const handleAddCustomer = async (
    name: string,
    phone: string,
    address: string,
  ): Promise<boolean> => {
    try {
      const result = await createCreditPersona({
        name,
        phone,
        address: address || undefined,
      });
      if (result.success && result.data) {
        setCreditPersonas((prev) => [...prev, result.data!]);
        setSelectedCreditPersonId(result.data._id);
        toast.success("Customer added successfully");
        return true;
      } else {
        toast.error(result.message || "Failed to add customer");
        return false;
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Failed to add customer");
      return false;
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedStorefrontId && !loading) {
      loadStockItems();
    }
  }, [selectedStorefrontId, search, selectedCategory, currentPage]);

  const handleRefresh = async () => {
    setLoading(true);
    await loadStockItems();
    setLoading(false);
    toast.success(t("pos.productsRefreshed"));
  };

  const filteredProducts = allStockItems.filter((item) => {
    const hideProduct = item.inventoryId?._id === "69a15d55218ec5ff9a3fe4a3";
    return !hideProduct;
  });

  const addToCart = (stockItem: StorefrontStockItem) => {
    const newLine = createDirectSaleCartLine(stockItem, 1);
    const lineId = getCartLineId(newLine);

    setCart((prev) => {
      const existing = prev.find((item) => getCartLineId(item) === lineId);
      if (existing) {
        return prev.map((item) =>
          getCartLineId(item) === lineId
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
      }
      return [...prev, newLine];
    });
  };

  const updateQty = (lineId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (getCartLineId(item) === lineId) {
          const newQty = item.qty + delta;
          if (newQty < 1) return item;
          return { ...item, qty: newQty };
        }
        return item;
      }),
    );
  };

  const setQty = (lineId: string, newQty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (getCartLineId(item) === lineId) {
          if (newQty < 1) {
            return { ...item, qty: 1 };
          }
          return { ...item, qty: newQty };
        }
        return item;
      }),
    );
  };

  const setCartLineUnit = (lineId: string, unit: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (getCartLineId(item) !== lineId) return item;
        return applyCatalogUnitPrice({ ...item, selectedUnit: unit });
      }),
    );
  };

  const setCartLineUnitPrice = (lineId: string, raw: string) => {
    const value = raw === "" ? 0 : Math.max(0, parseFloat(raw) || 0);
    setCart((prev) =>
      prev.map((item) =>
        getCartLineId(item) === lineId ? { ...item, unitPrice: value } : item,
      ),
    );
  };

  const removeFromCart = (lineId: string) => {
    setCart((prev) => prev.filter((item) => getCartLineId(item) !== lineId));
  };

  const handleBarcodeScan = async (searchValue: string) => {
    if (!searchValue.trim()) return;

    try {
      const response = await fetchStorefrontStock(
        selectedStorefrontId,
        1,
        1,
        undefined,
        searchValue.trim(),
      );

      if (response.success && response.data && response.data.length > 0) {
        const matchingProduct = response.data[0];

        addToCart(matchingProduct);

        toast.success(
          `${matchingProduct.inventoryId.productName} ${
            t("pos.addedToCart") || "added to cart"
          }`,
        );

        setSearch("");
      } else {
        toast.error(t("pos.productNotFound") || "Product not found");
      }
    } catch (error) {
      console.error("Error during barcode scan:", error);
      toast.error(t("pos.failedToSearchProduct") || "Failed to search product");
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + directSaleCartSubtotal(item),
    0,
  );

  const totalAfterDiscount = Math.round(
    subtotal * (1 - (Number(discount) || 0) / 100),
  );
  const totalAfterMarkup = subtotal + markupAmount;

  const total =
    (useMarkup ? totalAfterMarkup : totalAfterDiscount) + transportFee;
  const combinedDiscountAmount = useMarkup
    ? 0
    : Math.round(subtotal - totalAfterDiscount);

  useEffect(() => {
    if (
      showCheckoutModal &&
      paymentType === "paid" &&
      paymentMethod !== PaymentMethod.FOC
    ) {
      setPaidAmount(Math.ceil(total));
    }
  }, [showCheckoutModal, total, paymentType, paymentMethod]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (
      paymentType === "paid" &&
      paymentMethod !== PaymentMethod.FOC &&
      paidAmount < total
    ) {
      toast.error(t("pos.paidAmountError"));
      return;
    }

    const finalPaidAmount =
      paymentMethod === PaymentMethod.FOC ? 0 : paidAmount;

    setIsProcessing(true);

    try {
      const paymentMethodMap: Record<PaymentMethod, string> = {
        [PaymentMethod.CASH]: "cash",
        [PaymentMethod.KBZ_PAY]: "kpay",
        [PaymentMethod.WAVE_PAY]: "wavepay",
        [PaymentMethod.AYA_PAY]: "ayapay",
        [PaymentMethod.UAB_PAY]: "uabpay",
        [PaymentMethod.BANK_TRANSFER]: "bank_transfer",
        [PaymentMethod.NORMAL]: "normal",
        [PaymentMethod.HOT]: "hot",
        [PaymentMethod.FOC]: "foc",
        [PaymentMethod.MMQR]: "MMQR",
      };

      const discountAmount = useMarkup
        ? 0
        : Math.round(subtotal - totalAfterDiscount);

      const extraChange =
        paymentType === "paid" && finalPaidAmount > total
          ? finalPaidAmount - total
          : 0;

      const orderPayload = {
        saleType: "direct-sale" as const,
        ...(customerName.trim() ? { customerName: customerName.trim() } : {}),
        ...(customerPhone.trim()
          ? { customerPhone: customerPhone.trim() }
          : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        ordersProducts: cart.map(directSaleLineToOrderProduct),
        subTotal: subtotal,
        tax: 0,
        discount: discountAmount,
        finalAmount: total,
        paidAmount: finalPaidAmount,
        extraChange,
        storefrontId: selectedStorefrontId,
        paymentType: paymentType,
        paymentMethod: paymentMethodMap[paymentMethod],
        orderDate: new Date(createdAt).toISOString(),
        transportFee: transportFee,
        ...(selectedCreditPersonId
          ? { creditPersonId: selectedCreditPersonId }
          : {}),
      };

      const result = await createDirectSale(orderPayload);

      if (result.success) {
        const selectedPersona = creditPersonas.find(
          (cp) => cp._id === selectedCreditPersonId,
        );

        const receiptData = {
          date: new Date().toISOString(),
          invoiceNumber: result.data?.orderNumber || `INV-${Date.now()}`,
          storefrontName: "HONGCHI Myanmar",
          items: cart.map((i) => ({
            name: i.stockItem.inventoryId.productName,
            code: i.stockItem.inventoryId.productCode,
            qty: i.qty,
            unit: i.selectedUnit,
            price: i.unitPrice,
          })),
          subtotal,
          discountPercent: discount,
          transportFee,
          total,
          paidAmount: finalPaidAmount,
          change: finalPaidAmount - total,
          paymentMethod,
          paymentType,
          note,
          customerName: selectedPersona?.name,
          customerPhone: selectedPersona?.phone,
          customerAddress: selectedPersona?.address,
          creditPersonName: selectedPersona?.name,
          perItemTransportFees,
        };

        const receiptId = `receipt_${receiptData.invoiceNumber}`;
        localStorage.setItem(receiptId, JSON.stringify(receiptData));

        navigate(
          `/print-receipt/${receiptData.invoiceNumber}?size=${getSavedPrintPaperSize()}&autoprint=1`,
        );
        setCart([]);
        setDiscount(0);
        setMarkup(0);
        setMarkupAmount(0);
        setTransportFee(0);
        setPerItemTransportFees({});
        setNote("");
        setCustomerName("");
        setCustomerPhone("");
        setPaidAmount(0);
        setPaymentMethod(
          paymentType === "credit" ? PaymentMethod.NORMAL : PaymentMethod.CASH,
        );
        setPaymentType("paid");
        setSelectedCreditPersonId("");
        setCreatedAt(new Date().toISOString().split("T")[0]);

        setSuccessOrderNumber(result.data?.orderNumber || `INV-${Date.now()}`);
        setShowSuccessModal(true);

        if (convertingQuotationId && result.data?._id) {
          await markQuotationAsConverted(convertingQuotationId, result.data._id);
          setConvertingQuotationId(null);
        }

        await loadStockItems();
      } else {
        toast.error(result.message || t("directSale.failedToProcessSale"));
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(t("directSale.failedToProcessSale"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStorefrontChange = (storefrontId: string) => {
    setSelectedStorefrontId(storefrontId);
    setCart([]);
    setSelectedCategory("All");
  };

  return {
    storefronts,
    selectedStorefrontId,
    loading,
    categories,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    cart,
    setCart,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    paidAmount,
    setPaidAmount,
    paymentType,
    setPaymentType,
    creditPersonas,
    selectedCreditPersonId,
    setSelectedCreditPersonId,
    showCheckoutModal,
    setShowCheckoutModal,
    showSuccessModal,
    setShowSuccessModal,
    successOrderNumber,
    setSuccessOrderNumber,
    discount,
    setDiscount,
    markupAmount,
    setMarkupAmount,
    note,
    setNote,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    isProcessing,
    showStorefrontMenu,
    setShowStorefrontMenu,
    useMarkup,
    setUseMarkup,
    paymentMethod,
    setPaymentMethod,
    showDiscountCalculator,
    setShowDiscountCalculator,
    showMarkupCalculator,
    setShowMarkupCalculator,
    discountAmount,
    setDiscountAmount,
    transportFee,
    setTransportFee,
    perItemTransportFees,
    setPerItemTransportFees,
    createdAt,
    setCreatedAt,
    devices,
    filteredProducts,
    subtotal,
    total,
    combinedDiscountAmount,
    addToCart,
    updateQty,
    setQty,
    removeFromCart,
    setCartLineUnit,
    setCartLineUnitPrice,
    handleStorefrontChange,
    handleRefresh,
    handleBarcodeScan,
    handleCheckout,
    handleAddCustomer,
  };
};
