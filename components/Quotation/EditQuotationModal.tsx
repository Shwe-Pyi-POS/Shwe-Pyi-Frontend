import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  Search,
  Plus,
  Minus,
  Trash2,
  Loader2,
  Package,
  User,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../../services/Credit/fetchCreditPersonas";
import { createCreditPersona } from "../../services/Credit/createCreditPersona";
import { AddCustomerInline } from "../POS/AddCustomerInline";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../../services/Storefront/fetchStorefrontStock";
import {
  fetchQuotationById,
  updateQuotation,
} from "../../services/Quotation/quotationApi";
import {
  Quotation,
  getQuotationProducts,
} from "../../services/Quotation/quotationTypes";
import { CartUnitSelector } from "../UOM/CartUnitSelector";
import {
  UomCartItem,
  cartLineSubtotal,
  cartLineToOrderProduct,
  createCartLine,
  getCartLineId,
  getCartLineUnitPrice,
} from "../../utils/posCartUom";
import { getDefaultSellingUnit } from "../../utils/uom";
import { formatMMK } from "./quotationUtils";

interface EditQuotationModalProps {
  isOpen: boolean;
  quotationId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditQuotationModal: React.FC<EditQuotationModalProps> = ({
  isOpen,
  quotationId,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saleMode, setSaleMode] = useState<"storefront" | "direct-sale">("direct-sale");
  const [storefrontId, setStorefrontId] = useState<string | null>(null);

  // Cart & details states
  const [cart, setCart] = useState<UomCartItem[]>([]);
  const [note, setNote] = useState("");
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Customer states
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [selectedCreditPersonId, setSelectedCreditPersonId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Stock search states
  const [stockItems, setStockItems] = useState<StorefrontStockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load Credit Personas
  const loadCreditPersonas = async () => {
    const res = await fetchCreditPersonas();
    if (res.success) {
      setCreditPersonas(res.data);
    }
  };

  // Load Stock Items
  const loadStock = useCallback(async (query: string, sfId: string | null) => {
    setLoadingStock(true);
    try {
      const res = await fetchStorefrontStock(
        sfId || undefined,
        1,
        100,
        undefined,
        query
      );
      if (res.success) {
        setStockItems(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStock(false);
    }
  }, []);

  // Initialize data on open
  useEffect(() => {
    if (isOpen && quotationId) {
      const init = async () => {
        setLoading(true);
        await loadCreditPersonas();
        
        const res = await fetchQuotationById(quotationId);
        if (res.success) {
          const q: Quotation = res.data;
          setSaleMode(q.saleType);
          const sfIdVal = q.storefrontId ? (typeof q.storefrontId === "object" ? q.storefrontId._id : q.storefrontId) : null;
          setStorefrontId(sfIdVal);
          setNote(q.note || "");
          setTax(q.tax || 0);
          setDiscount(q.discount || 0);

          if (q.creditPersonId) {
            const cpId = typeof q.creditPersonId === "object" ? q.creditPersonId._id : q.creditPersonId;
            setSelectedCreditPersonId(cpId);
            setCustomerName(typeof q.creditPersonId === "object" ? q.creditPersonId.name : q.customerName || "");
            setCustomerPhone(typeof q.creditPersonId === "object" ? q.creditPersonId.phone : q.customerPhone || "");
          } else {
            setSelectedCreditPersonId("");
            setCustomerName(q.customerName || "");
            setCustomerPhone(q.customerPhone || "");
          }

          // Fetch stocks using this storefront context to map conversions correctly
          const stockRes = await fetchStorefrontStock(
            sfIdVal || undefined,
            1,
            150,
            undefined,
            ""
          );
          let loadedStock: StorefrontStockItem[] = [];
          if (stockRes.success) {
            loadedStock = stockRes.data;
            setStockItems(loadedStock);
          }

          // Map quotation products to UomCartItem
          const mappedCart: UomCartItem[] = getQuotationProducts(q).map((p) => {
            const matchedStock = loadedStock.find(
              (item) => item.inventoryId?._id === (typeof p.inventoryId === "object" ? p.inventoryId._id : p.inventoryId)
            );

            if (matchedStock) {
              return {
                stockItem: matchedStock,
                qty: p.quantity,
                selectedUnit: p.unit || matchedStock.inventoryId.unitOfMeasure,
              };
            } else {
              // Reconstruct UOM cart item if stock not found
              const invId = typeof p.inventoryId === "object" ? p.inventoryId._id : p.inventoryId;
              const simulatedStock: StorefrontStockItem = {
                _id: invId,
                inventoryId: {
                  _id: invId,
                  productName: p.productName || "Unknown Product",
                  productCode: p.productCode || "",
                  sellingPrice: (p.unitPrice ?? 0) * (p.factor || 1),
                  buyingPrice: 0,
                  unitOfMeasure: p.unit || "piece",
                  uomConversions: p.unit ? [{ unit: p.unit, factor: p.factor || 1 }] : [],
                },
                availableQuantity: 999999,
              };
              return {
                stockItem: simulatedStock,
                qty: p.quantity,
                selectedUnit: p.unit || "piece",
              };
            }
          });

          setCart(mappedCart);
        } else {
          toast.error(res.message);
          onClose();
        }
        setLoading(false);
      };
      init();
    } else {
      setCart([]);
      setNote("");
      setTax(0);
      setDiscount(0);
      setSelectedCreditPersonId("");
      setCustomerName("");
      setCustomerPhone("");
      setSearchQuery("");
      setStockItems([]);
    }
  }, [isOpen, quotationId, onClose]);

  // Debounced search logic for products
  useEffect(() => {
    if (isOpen) {
      const delayDebounce = setTimeout(() => {
        loadStock(searchQuery, storefrontId);
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchQuery, storefrontId, isOpen, loadStock]);

  const handleAddItem = (stock: StorefrontStockItem) => {
    const newLine = createCartLine(stock, 1);
    const lineId = getCartLineId(newLine);

    setCart((prev) => {
      const exists = prev.find((i) => getCartLineId(i) === lineId);
      if (exists) {
        return prev.map((i) =>
          getCartLineId(i) === lineId
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }
      return [...prev, newLine];
    });
    toast.success(`${stock.inventoryId.productName} added`);
  };

  const handleUpdateQty = (idx: number, amount: number) => {
    setCart((prev) =>
      prev
        .map((item, i) => {
          if (i === idx) {
            const nextQty = Math.max(0, item.qty + amount);
            return { ...item, qty: nextQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const handleRemoveItem = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUnitChange = (idx: number, unit: string) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          return { ...item, selectedUnit: unit };
        }
        return item;
      })
    );
  };

  const handleSave = async () => {
    if (!quotationId) return;
    if (cart.length === 0) {
      toast.error(t("quotation.form.emptyCart") || "Cart is empty");
      return;
    }

    setSaving(true);
    const subtotal = cart.reduce((sum, item) => sum + cartLineSubtotal(item), 0);
    const finalAmount = subtotal + tax - discount;

    const payload = {
      saleType: saleMode,
      storefrontId: storefrontId || undefined,
      creditPersonId: selectedCreditPersonId || undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      note: note.trim() || undefined,
      products: cart.map(cartLineToOrderProduct),
      subTotal: subtotal,
      tax,
      discount,
      finalAmount,
    };

    const res = await updateQuotation(quotationId, payload);
    setSaving(false);
    if (res.success) {
      toast.success(t("quotation.updated") || "Quotation updated successfully");
      if (onSuccess) onSuccess();
      onClose();
    } else {
      toast.error(res.message);
    }
  };

  const handleAddCustomerInline = async (
    name: string,
    phone: string,
    address: string
  ): Promise<boolean> => {
    try {
      const res = await createCreditPersona({ name, phone, address });
      if (res.success) {
        toast.success(t("credit.customerCreated"));
        await loadCreditPersonas();
        setSelectedCreditPersonId(res.data._id);
        setCustomerName(res.data.name);
        setCustomerPhone(res.data.phone);
        setShowAddCustomerForm(false);
        return true;
      } else {
        toast.error(res.message);
        return false;
      }
    } catch {
      toast.error("Failed to create customer");
      return false;
    }
  };

  const selectedCreditPerson = creditPersonas.find(
    (c) => c._id === selectedCreditPersonId
  );

  const filteredCreditPersons = creditPersonas.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  const subtotal = cart.reduce((sum, item) => sum + cartLineSubtotal(item), 0);
  const finalAmount = subtotal + tax - discount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Edit Quotation Items & Info
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Left side: Product Search */}
            <div className="w-full md:w-1/2 border-r flex flex-col overflow-hidden bg-slate-50/30">
              <div className="p-4 border-b bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search products by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingStock ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : stockItems.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-10">
                    No products found in stock.
                  </p>
                ) : (
                  stockItems.map((item) => {
                    const price = item.inventoryId.sellingPrice;
                    return (
                      <div
                        key={item._id}
                        className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-primary/30 transition-all"
                      >
                        <div>
                          <h4 className="font-semibold text-slate-800 text-sm">
                            {item.inventoryId.productName}
                          </h4>
                          <span className="text-xs text-slate-400 font-mono">
                            {item.inventoryId.productCode}
                          </span>
                          <span className="text-xs font-semibold text-primary block mt-0.5">
                            {formatMMK(price)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddItem(item)}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-all active:scale-95"
                        >
                          Add Item
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right side: Cart & Form Details */}
            <div className="w-full md:w-1/2 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Cart list */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                    Selected Products ({cart.length})
                  </h4>
                  {cart.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed">
                      No items selected. Add products from the left side.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item, idx) => {
                        const lineTotal = cartLineSubtotal(item);
                        return (
                          <div
                            key={idx}
                            className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-slate-800 text-xs truncate">
                                {item.stockItem.inventoryId.productName}
                              </h5>
                              <div className="flex items-center gap-2 mt-1">
                                <CartUnitSelector
                                  baseUnit={item.stockItem.inventoryId.unitOfMeasure || "piece"}
                                  conversions={item.stockItem.inventoryId.uomConversions}
                                  selectedUnit={item.selectedUnit}
                                  onUnitChange={(u) => handleUnitChange(idx, u)}
                                  className="text-[10px] py-0.5"
                                />
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {formatMMK(getCartLineUnitPrice(item))} / {item.selectedUnit}
                                </span>
                              </div>
                            </div>

                            {/* Qty controls */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(idx, -1)}
                                className="p-1 bg-white hover:bg-slate-100 border rounded-lg active:scale-90"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold w-6 text-center text-slate-700">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(idx, 1)}
                                className="p-1 bg-white hover:bg-slate-100 border rounded-lg active:scale-90"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Total & Delete */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-bold text-slate-800 font-mono min-w-[70px] text-right">
                                {formatMMK(lineTotal)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Customer Information Block */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                      Customer Info
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddCustomerForm(!showAddCustomerForm)}
                      className="text-xs text-primary font-semibold flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add New Customer
                    </button>
                  </div>

                  {showAddCustomerForm ? (
                    <div className="p-3 bg-slate-50 border rounded-xl">
                      <AddCustomerInline
                        onSave={handleAddCustomerInline}
                        onCancel={() => setShowAddCustomerForm(false)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Customer select Search Dropdown */}
                      <div className="relative">
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          Select Credit Customer
                        </label>
                        <div
                          onClick={() => setShowDropdown(!showDropdown)}
                          className="w-full border rounded-lg px-3 py-2 text-sm bg-white flex items-center justify-between cursor-pointer"
                        >
                          <span className="text-slate-700">
                            {selectedCreditPerson?.name || "Walk-in Customer (None)"}
                          </span>
                          <span className="text-slate-400 text-xs">▼</span>
                        </div>

                        {showDropdown && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                            <div className="p-2 border-b sticky top-0 bg-white">
                              <input
                                type="text"
                                placeholder="Search customer..."
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                className="w-full border px-2 py-1 text-xs rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div
                              onClick={() => {
                                setSelectedCreditPersonId("");
                                setCustomerName("");
                                setCustomerPhone("");
                                setShowDropdown(false);
                              }}
                              className="px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer text-slate-500"
                            >
                              Walk-in Customer (None)
                            </div>
                            {filteredCreditPersons.map((c) => (
                              <div
                                key={c._id}
                                onClick={() => {
                                  setSelectedCreditPersonId(c._id);
                                  setCustomerName(c.name);
                                  setCustomerPhone(c.phone);
                                  setShowDropdown(false);
                                }}
                                className="px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer"
                              >
                                {c.name} ({c.phone})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Manual Customer Name & Phone Fields if walk-in */}
                      {!selectedCreditPersonId && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                              Customer Name
                            </label>
                            <input
                              type="text"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                              Customer Phone
                            </label>
                            <input
                              type="text"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              className="w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tax, Discount, Notes */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                    Additional Info
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                        Tax Amount (MMK)
                      </label>
                      <input
                        type="number"
                        value={tax || ""}
                        onChange={(e) => setTax(Number(e.target.value))}
                        className="w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                        Discount Amount (MMK)
                      </label>
                      <input
                        type="number"
                        value={discount || ""}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-0.5">
                      Notes
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      className="w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* Summary & Save footer */}
              <div className="p-4 border-t bg-slate-50 space-y-3.5">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>{formatMMK(subtotal)}</span>
                  </div>
                  {tax > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Tax:</span>
                      <span>+{formatMMK(tax)}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-{formatMMK(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-800 pt-1 border-t">
                    <span>Total Amount:</span>
                    <span className="text-primary font-extrabold text-base font-mono">
                      {formatMMK(finalAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="flex-1 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
