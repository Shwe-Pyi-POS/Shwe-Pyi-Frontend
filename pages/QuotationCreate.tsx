import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Store,
  ChevronDown,
  Loader2,
  Scan,
  X,
  FileText,
  ShoppingBag,
  List,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import { fetchCategories } from "../services/Inventory/fetchCategories";
import {
  createQuotation,
  fetchQuotationById,
  updateQuotation,
} from "../services/Quotation/quotationApi";
import { QuotationSaleType } from "../services/Quotation/quotationTypes";
import { CartUnitSelector } from "../components/UOM/CartUnitSelector";
import {
  UomCartItem,
  cartLineSubtotal,
  cartLineToOrderProduct,
  createCartLine,
  getCartLineId,
  getCartLineUnitPrice,
  getInventoryUomFromStock,
} from "../utils/posCartUom";
import { getDefaultSellingUnit } from "../utils/uom";
import { getSavedPrintPaperSize } from "../utils/printPaperSize";
import { VoucherReceiptData } from "../components/Print/VoucherContent";

type CartItem = UomCartItem;

const HIDDEN_PRODUCT_ID = "69a15d55218ec5ff9a3fe4a3";

export const QuotationCreate: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = Boolean(editId);

  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] = useState("");
  const [saleMode, setSaleMode] = useState<QuotationSaleType>("storefront");
  const [allStockItems, setAllStockItems] = useState<StorefrontStockItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(100);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showStorefrontMenu, setShowStorefrontMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);

  const loadStockItems = useCallback(async () => {
    try {
      const sfId = saleMode === "storefront" ? selectedStorefrontId : undefined;
      const response = await fetchStorefrontStock(
        sfId || undefined,
        currentPage,
        itemsPerPage,
        selectedCategory === "All" ? undefined : selectedCategory,
        search,
      );
      if (response.success && response.data) {
        let items = response.data;
        if (saleMode === "direct-sale") {
          const seen = new Set<string>();
          items = items.filter((item) => {
            const invId = item.inventoryId._id;
            if (seen.has(invId)) return false;
            seen.add(invId);
            return true;
          });
        }
        setAllStockItems(items);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalItems(response.pagination.totalItems);
        }
      }
    } catch {
      toast.error(t("pos.failedToLoadProducts"));
    }
  }, [
    saleMode,
    selectedStorefrontId,
    currentPage,
    itemsPerPage,
    selectedCategory,
    search,
    t,
  ]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const sfResponse = await fetchStorefrontProfiles();
        if (sfResponse.success && sfResponse.data) {
          const active = sfResponse.data.filter((sf) => sf.status === "active");
          setStorefronts(active);
          if (active.length > 0) {
            setSelectedStorefrontId((prev) => prev || active[0]._id);
          }
        }
        const catResponse = await fetchCategories();
        if (catResponse.success && catResponse.data) {
          setCategories(catResponse.data);
        }

        if (isEdit && editId) {
          const res = await fetchQuotationById(editId);
          if (!res.success) {
            toast.error(res.message);
            navigate("/quotations");
            return;
          }
          const q = res.data;
          if (q.status !== "draft") {
            toast.error(t("quotation.form.notEditable"));
            navigate(`/quotations/${editId}`);
            return;
          }
          setSaleMode(q.saleType);
          const sf =
            typeof q.storefrontId === "object"
              ? q.storefrontId?._id
              : (q.storefrontId as string) || "";
          if (sf) setSelectedStorefrontId(sf);
          setCustomerName(q.customerName || "");
          setCustomerPhone(q.customerPhone || "");
          setNote(q.note || "");
          setTax(q.tax || 0);
          setDiscount(q.discount || 0);

          const products = q.products?.length
            ? q.products
            : q.ordersProducts || [];
          setCart(
            products.map((p) => {
              const inv = p.inventoryId;
              const invId = typeof inv === "string" ? inv : inv._id;
              const baseUnit =
                typeof inv === "object"
                  ? inv.unitOfMeasure?.trim() || "piece"
                  : "piece";
              const selectedUnit =
                p.unit ||
                getDefaultSellingUnit(
                  baseUnit,
                  typeof inv === "object" ? inv.uomConversions : undefined,
                );
              const stockItem: StorefrontStockItem = {
                _id: `q-${invId}`,
                storefrontId: {
                  _id: sf || "",
                  locationCode: "",
                  locationName: "",
                },
                inventoryId: {
                  _id: invId,
                  productName:
                    p.productName ||
                    (typeof inv === "object" ? inv.productName : "") ||
                    "",
                  productCode:
                    p.productCode ||
                    (typeof inv === "object" ? inv.productCode : "") ||
                    "",
                  SKU: typeof inv === "object" ? inv.SKU || "" : "",
                  category: "",
                  profitMargin: null,
                  profitAmount: null,
                  sellingPrice:
                    p.unitPrice ||
                    (typeof inv === "object" ? inv.sellingPrice : 0) ||
                    0,
                  unitOfMeasure: baseUnit,
                  uomConversions:
                    typeof inv === "object" ? inv.uomConversions : undefined,
                },
                quantity: 0,
                availableQuantity: 999999,
                isLowStock: false,
                lastUpdated: "",
                createdAt: "",
                updatedAt: "",
              };
              return { stockItem, qty: p.quantity, selectedUnit };
            }),
          );
        }

        // await loadStockItems();
      } catch {
        toast.error(t("pos.failedToLoadData"));
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, isEdit]);

  useEffect(() => {
    if (selectedStorefrontId) {
      loadStockItems();
    }
  }, [selectedStorefrontId, search, selectedCategory, currentPage, saleMode]);

  const filteredProducts = allStockItems.filter(
    (item) => item.inventoryId?._id !== HIDDEN_PRODUCT_ID,
  );

  const addToCart = (stockItem: StorefrontStockItem) => {
    const newLine = createCartLine(stockItem, 1);
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
          return { ...item, qty: Math.max(1, newQty) };
        }
        return item;
      }),
    );
  };

  const setCartLineUnit = (lineId: string, unit: string) => {
    setCart((prev) =>
      prev.map((item) =>
        getCartLineId(item) === lineId ? { ...item, selectedUnit: unit } : item,
      ),
    );
  };

  const removeFromCart = (lineId: string) => {
    setCart((prev) => prev.filter((item) => getCartLineId(item) !== lineId));
  };

  const handleBarcodeScan = async (searchValue: string) => {
    if (!searchValue.trim()) return;
    if (saleMode === "storefront" && !selectedStorefrontId) {
      toast.error(t("pos.pleaseSelectStorefront"));
      return;
    }
    try {
      const response = await fetchStorefrontStock(
        saleMode === "storefront" ? selectedStorefrontId : undefined,
        1,
        1,
        undefined,
        searchValue.trim(),
      );
      if (response.success && response.data?.length) {
        addToCart(response.data[0]);
        toast.success(
          `${response.data[0].inventoryId.productName} ${t("pos.addedToCart")}`,
        );
        setSearch("");
      } else {
        toast.error(t("pos.productNotFound"));
      }
    } catch {
      toast.error(t("pos.failedToSearchProduct"));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + cartLineSubtotal(item), 0);
  const finalAmount = Math.max(0, subtotal + tax - discount);

  const handleStorefrontChange = (storefrontId: string) => {
    setSelectedStorefrontId(storefrontId);
    setCart([]);
    setSelectedCategory("All");
  };

  const handleSaleModeChange = (mode: QuotationSaleType) => {
    setSaleMode(mode);
    setCart([]);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadStockItems();
    setLoading(false);
    toast.success(t("pos.productsRefreshed"));
  };

  const handleSave = async () => {
    if (cart.length === 0) {
      toast.error(t("quotation.form.productsRequired"));
      return;
    }
    if (saleMode === "storefront" && !selectedStorefrontId) {
      toast.error(t("quotation.form.storefrontRequired"));
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        saleType: saleMode,
        storefrontId:
          saleMode === "storefront" ? selectedStorefrontId : undefined,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        note: note.trim() || undefined,
        ordersProducts: cart.map(cartLineToOrderProduct),
        subTotal: subtotal,
        tax,
        discount,
        finalAmount,
      };

      const res =
        isEdit && editId
          ? await updateQuotation(editId, payload)
          : await createQuotation(payload);

      if (res.success) {
        toast.success(
          isEdit ? t("quotation.form.updated") : t("quotation.form.created"),
        );

        if (!isEdit) {
          const quotationNumber =
            res.data.quotationNumber || `QT-${Date.now()}`;
          const storefrontLabel =
            saleMode === "storefront"
              ? storefronts.find((sf) => sf._id === selectedStorefrontId)
                  ?.locationName || ""
              : t("quotation.saleTypeDirectSale");
          const billTo = customerName.trim()
            ? `${customerName.trim()}${customerPhone.trim() ? ` · ${customerPhone.trim()}` : ""}`
            : storefrontLabel;

          const receiptData: VoucherReceiptData = {
            documentType: "quotation",
            date: new Date().toISOString(),
            invoiceNumber: quotationNumber,
            storefrontName: billTo,
            items: cart.map((i) => ({
              name: i.stockItem.inventoryId.productName,
              code: i.stockItem.inventoryId.productCode,
              qty: i.qty,
              unit: i.selectedUnit,
              price: getCartLineUnitPrice(i),
            })),
            subtotal,
            tax,
            discountAmount: discount,
            discountPercent: 0,
            total: finalAmount,
            paymentMethod: t("quotation.status.draft"),
            note: note.trim() || undefined,
          };

          localStorage.setItem(
            `receipt_${quotationNumber}`,
            JSON.stringify(receiptData),
          );

          setCart([]);
          setCustomerName("");
          setCustomerPhone("");
          setNote("");
          setTax(0);
          setDiscount(0);
          setShowSaveModal(false);

          navigate(
            `/print-receipt/${encodeURIComponent(quotationNumber)}?size=${getSavedPrintPaperSize()}&autoprint=1`,
          );
        } else {
          navigate(`/quotations/${res.data._id}`);
        }
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error(t("quotation.loadFailed"));
    } finally {
      setIsProcessing(false);
      setShowSaveModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-60px)] bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (saleMode === "storefront" && storefronts.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-60px)] bg-gray-100">
        <div className="text-center px-4">
          <Store className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-gray-600">
            {t("quotation.form.storefrontRequired")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-60px)] overflow-hidden bg-gray-100">
      {/* Product grid — same layout as POS */}
      <div className="flex-1 flex flex-col px-4 sm:px-6 py-4 overflow-hidden">
        <div className="mb-3 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/quotations")}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-xl bg-white hover:bg-gray-50"
            >
              <List className="w-4 h-4" />
              {t("sidebar.quotations")}
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSaleModeChange("storefront")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                saleMode === "storefront"
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-gray-200 hover:border-primary"
              }`}
            >
              <Store className="w-4 h-4" />
              {t("quotation.saleTypeStorefront")}
            </button>
            <button
              type="button"
              onClick={() => handleSaleModeChange("direct-sale")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                saleMode === "direct-sale"
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-gray-200 hover:border-primary"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              {t("quotation.saleTypeDirectSale")}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none" />
              <Scan className="absolute right-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none opacity-50" />
              <input
                type="text"
                placeholder={t("pos.searchOrScanBarcode")}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white shadow-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim()) {
                    e.preventDefault();
                    handleBarcodeScan(search);
                  }
                }}
                autoFocus
              />
            </div>

            <select
              className="border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary outline-none shadow-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">{t("pos.allCategories")}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {saleMode === "storefront" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStorefrontMenu(!showStorefrontMenu)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all shadow-sm"
                >
                  <Store className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {storefronts.find((sf) => sf._id === selectedStorefrontId)
                      ?.locationName || t("quotation.storefront")}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showStorefrontMenu ? "rotate-180" : ""}`}
                  />
                </button>
                {showStorefrontMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowStorefrontMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
                      <div className="p-3 bg-gray-50 border-b">
                        <p className="text-xs font-semibold text-gray-500 uppercase">
                          {t("pos.selectStorefront")}
                        </p>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {storefronts.map((sf) => (
                          <button
                            key={sf._id}
                            type="button"
                            onClick={() => {
                              handleStorefrontChange(sf._id);
                              setShowStorefrontMenu(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 ${
                              sf._id === selectedStorefrontId
                                ? "bg-primary/15 border-l-4 border-primary"
                                : ""
                            }`}
                          >
                            <Store className="w-4 h-4 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {sf.locationName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {sf.locationCode}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="p-2 border-t">
                        <button
                          type="button"
                          onClick={() => {
                            handleRefresh();
                            setShowStorefrontMenu(false);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                        >
                          <RefreshCw className="w-4 h-4" />
                          {t("pos.refreshProducts")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {saleMode === "direct-sale" && (
              <button
                type="button"
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-2.5 border rounded-xl bg-white hover:bg-gray-50 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                {t("common.refresh")}
              </button>
            )}
          </div>
        </div>

        <div className="mb-2 text-sm text-gray-600">
          {t("pos.showingProducts").replace(
            "{count}",
            filteredProducts.length.toString(),
          )}
        </div>

        <div className="overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              {saleMode === "storefront" && !selectedStorefrontId
                ? t("pos.pleaseSelectStorefront")
                : t("pos.noProductsInStorefront")}
            </div>
          ) : (
            filteredProducts.map((stockItem) => (
              <div
                key={stockItem._id}
                role="button"
                tabIndex={0}
                onClick={() => addToCart(stockItem)}
                onKeyDown={(e) => e.key === "Enter" && addToCart(stockItem)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer transition-all hover:shadow-lg hover:border-primary hover:scale-[1.02] flex flex-col"
              >
                <h3 className="font-medium text-gray-800 text-sm line-clamp-2">
                  {stockItem.inventoryId.productName}
                </h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  {stockItem.inventoryId.productCode}
                </p>
                {stockItem.inventoryId.category && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stockItem.inventoryId.category}
                  </p>
                )}
                <div className="mt-auto pt-3">
                  <span className="font-bold text-primary">
                    {(stockItem.inventoryId.sellingPrice || 0).toLocaleString()}{" "}
                    MMK
                  </span>
                  {saleMode === "storefront" && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t("common.quantity")}: {stockItem.availableQuantity}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart sidebar — same as POS */}
      <div className="w-full sm:w-96 bg-white flex flex-col border-l border-gray-200 shadow-xl h-[calc(100vh-60px)]">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">{t("quotation.cartTitle")}</h2>
          <p className="text-xs text-gray-400 mt-1">
            {saleMode === "direct-sale"
              ? t("quotation.saleTypeDirectSale")
              : storefronts.find((sf) => sf._id === selectedStorefrontId)
                  ?.locationName}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              {t("pos.emptyCart")}
            </div>
          ) : (
            cart.map((item) => {
              const lineId = getCartLineId(item);
              const { baseUnit, conversions } = getInventoryUomFromStock(
                item.stockItem,
              );
              const unitPrice = getCartLineUnitPrice(item);
              return (
                <div
                  key={lineId}
                  className="flex flex-col gap-2 border-b border-gray-200 pb-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.stockItem.inventoryId.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {unitPrice.toLocaleString()} MMK / {item.selectedUnit} ·{" "}
                        {(unitPrice * item.qty).toLocaleString()} MMK
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(lineId)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CartUnitSelector
                      baseUnit={baseUnit}
                      conversions={conversions}
                      selectedUnit={item.selectedUnit}
                      onUnitChange={(unit) => setCartLineUnit(lineId, unit)}
                    />
                    {!conversions?.length && (
                      <span className="text-xs font-medium text-gray-700">
                        {item.selectedUnit}
                      </span>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => updateQty(lineId, -1)}
                        className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) =>
                          setQty(lineId, parseInt(e.target.value, 10) || 1)
                        }
                        className="text-sm font-medium w-12 text-center border rounded px-1 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => updateQty(lineId, 1)}
                        className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 space-y-3">
          <div className="flex justify-between text-xl font-bold text-gray-900">
            <span>{t("common.total")}</span>
            <span>{subtotal.toLocaleString()} MMK</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            disabled={cart.length === 0}
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            {t("quotation.saveQuotation")}
          </button>
        </div>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="font-bold">{t("common.processing")}</p>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-primary/10 flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {t("quotation.saveQuotation")}
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="p-1 hover:bg-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("quotation.customerName")} ({t("common.optional")})
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("quotation.customerPhone")} ({t("common.optional")})
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("common.notes")} ({t("common.optional")})
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("common.tax")} (MMK)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={tax}
                    onChange={(e) => setTax(Number(e.target.value) || 0)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("common.discount")} (MMK)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{t("common.subtotal")}</span>
                  <span>{subtotal.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t">
                  <span>{t("quotation.finalAmount")}</span>
                  <span className="text-primary">
                    {finalAmount.toLocaleString()} MMK
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 border rounded-lg text-sm font-medium"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-50"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
