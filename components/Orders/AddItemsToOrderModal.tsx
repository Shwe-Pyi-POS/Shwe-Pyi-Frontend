import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2, Search, Package } from "lucide-react";
import { toast } from "sonner";
import { Order } from "../../services/Order/fetchOrders";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../../services/Storefront/fetchStorefrontStock";
import {
  addItemsToOrder,
  AddItemToOrderRequest,
} from "../../services/Order/addItemsToOrder";
import { useLanguage } from "../../context/LanguageContext";
import { UomConversion } from "../../types/uom";
import { CartUnitSelector } from "../UOM/CartUnitSelector";
import { ConfirmModal } from "../Common/ConfirmModal";
import {
  buildOrderProductLine,
  cartLineKey,
  getAvailableQuantityInUnit,
  getDefaultSellingUnit,
  getUnitPrice,
} from "../../utils/uom";

interface InventoryProduct {
  _id: string;
  productName: string;
  productCode: string;
  sellingPrice: number;
  buyingPrice: number;
  unitOfMeasure: string;
  uomConversions?: UomConversion[];
  quantityByUnit?: Record<string, number>;
  availableQuantity: number;
}

interface SelectedItem {
  lineId: string;
  inventoryId: string;
  productName: string;
  productCode: string;
  quantity: number;
  selectedUnit: string;
  unitOfMeasure: string;
  uomConversions?: UomConversion[];
  quantityByUnit?: Record<string, number>;
  availableQuantity: number;
  sellingPrice: number;
  unitPrice: number;
  subtotal: number;
}

const buildSelectedItem = (
  product: InventoryProduct,
  quantity: number,
  selectedUnit?: string,
): SelectedItem => {
  const unit =
    selectedUnit ||
    getDefaultSellingUnit(product.unitOfMeasure, product.uomConversions);
  const unitPrice = getUnitPrice(
    product.sellingPrice,
    product.unitOfMeasure,
    unit,
    product.uomConversions,
  );
  const maxQty = getAvailableQuantityInUnit(
    product.unitOfMeasure,
    unit,
    product.uomConversions,
    product.availableQuantity,
    product.quantityByUnit,
  );
  const qty = Math.min(Math.max(1, quantity), maxQty);
  return {
    lineId: cartLineKey(product._id, unit),
    inventoryId: product._id,
    productName: product.productName,
    productCode: product.productCode,
    quantity: qty,
    selectedUnit: unit,
    unitOfMeasure: product.unitOfMeasure,
    uomConversions: product.uomConversions,
    quantityByUnit: product.quantityByUnit,
    availableQuantity: product.availableQuantity,
    sellingPrice: product.sellingPrice,
    unitPrice,
    subtotal: unitPrice * qty,
  };
};

interface AddItemsToOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddItemsToOrderModal: React.FC<AddItemsToOrderModalProps> = ({
  isOpen,
  order,
  onClose,
  onSuccess,
}) => {
  // console.log("order", order);
  const { t } = useLanguage();
  const [inventoryProducts, setInventoryProducts] = useState<
    InventoryProduct[]
  >([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0); // Percentage for display
  const [markup, setMarkup] = useState(0); // Add markup state
  const [markupAmount, setMarkupAmount] = useState(0); // Add markup amount state
  const [paidAmount, setPaidAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [discountManuallyChanged, setDiscountManuallyChanged] = useState(false);
  const [taxManuallyChanged, setTaxManuallyChanged] = useState(false);
  const [useMarkup, setUseMarkup] = useState(false); // Add useMarkup state
  const [showPaidAmountConfirm, setShowPaidAmountConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      loadInventoryProducts();
      // Initialize form with existing order values
      setTax(order.tax || 0);
      const existingDiscount = order.discount || 0;
      setDiscount(existingDiscount);
      const subtotal = order.subTotal || 0;
      const finalAmount = order.finalAmount || 0;

      // Auto-detect if order is using markup or discount
      // If final amount > subtotal, it's markup
      // If final amount < subtotal, it's discount
      const isMarkup = finalAmount > subtotal;
      setUseMarkup(isMarkup);

      // Calculate percentage based on detected mode
      let calculatedPercent = 0;
      if (isMarkup) {
        // Calculate fixed markup amount
        calculatedPercent =
          subtotal > 0 ? Math.round(((finalAmount - subtotal) * 100) / 100) : 0;
        setMarkupAmount(calculatedPercent);
        setMarkup(0);
        setDiscountPercent(0);
      } else {
        // Calculate discount percentage
        calculatedPercent =
          subtotal > 0 ? ((existingDiscount / subtotal) * 100 * 100) / 100 : 0;
        setDiscountPercent(calculatedPercent);
        setMarkup(0);
      }

      setPaidAmount(order.paidAmount || 0);
      setDiscountManuallyChanged(false);
      setTaxManuallyChanged(false);
    } else {
      // Reset form when modal closes
      setSelectedItems([]);
      setSearchProduct("");
      setTax(0);
      setDiscount(0);
      setDiscountPercent(0);
      setMarkup(0);
      setMarkupAmount(0);
      setPaidAmount(0);
      setDiscountManuallyChanged(false);
      setTaxManuallyChanged(false);
      setUseMarkup(false);
    }
  }, [isOpen, order]);

  // Auto-update tax when items are added/removed (if not manually changed)
  useEffect(() => {
    if (order) {
      const existingSubtotal = order.subTotal || 0;
      const existingTax = order.tax || 0;
      const newItemsSubtotal = selectedItems.reduce(
        (sum, item) => sum + item.subtotal,
        0,
      );
      const totalSubtotal = existingSubtotal + newItemsSubtotal;

      if (existingSubtotal > 0 && !taxManuallyChanged) {
        // Update tax proportionally if not manually changed
        const calculatedTax = Math.max(
          0,
          Math.round(((totalSubtotal * existingTax) / existingSubtotal) * 100) /
            100,
        );
        setTax(calculatedTax);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItems, order]);

  // Update absolute discount amount when percentage or subtotal changes
  useEffect(() => {
    if (order) {
      const existingSubtotal = order.subTotal || 0;
      const newItemsSubtotal = selectedItems.reduce(
        (sum, item) => sum + item.subtotal,
        0,
      );
      const totalSubtotal = existingSubtotal + newItemsSubtotal;

      // Calculate discount from percentage
      const calculatedDiscount = Math.max(
        0,
        Math.round(((totalSubtotal * discountPercent) / 100) * 100) / 100,
      );
      setDiscount(calculatedDiscount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountPercent, selectedItems, order]);

  const loadInventoryProducts = async () => {
    if (!order || !order.storefrontId?._id) {
      toast.error(t("orders.noStorefrontSelected") || "No storefront selected");
      setInventoryProducts([]);
      return;
    }

    setLoadingProducts(true);
    try {
      const response = await fetchStorefrontStock();
      if (response.success && response.data) {
        // Filter by order's storefront ID
        const storefrontStockItems = response.data.filter(
          (item: StorefrontStockItem) =>
            item.storefrontId?._id === order.storefrontId._id,
        );

        // Map storefront stock items to InventoryProduct format
        const products = storefrontStockItems.map(
          (item: StorefrontStockItem) => ({
            _id: item.inventoryId._id,
            productName: item.inventoryId.productName || "",
            productCode: item.inventoryId.productCode || "",
            sellingPrice: item.inventoryId.sellingPrice || 0,
            buyingPrice: 0,
            unitOfMeasure: item.inventoryId.unitOfMeasure?.trim() || "piece",
            uomConversions: item.inventoryId.uomConversions,
            quantityByUnit: item.quantityByUnit,
            availableQuantity: item.availableQuantity || item.quantity || 0,
          }),
        );
        setInventoryProducts(products);

        if (products.length === 0) {
          console.warn(
            `No products found for storefront: ${
              order.storefrontId.storefrontName || order.storefrontId._id
            }`,
          );
        }
      }
    } catch (error) {
      console.error("Error loading storefront products:", error);
      toast.error(
        t("orders.failedToLoadProducts") ||
          "Failed to load storefront products",
      );
      setInventoryProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredProducts = inventoryProducts.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchProduct.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchProduct.toLowerCase()),
  );

  const handleAddItem = (product: InventoryProduct) => {
    if (product.availableQuantity <= 0) {
      toast.error(t("orders.outOfStock") || "Out of stock");
      return;
    }

    const defaultUnit = getDefaultSellingUnit(
      product.unitOfMeasure,
      product.uomConversions,
    );
    const lineId = cartLineKey(product._id, defaultUnit);
    const existingItem = selectedItems.find((item) => item.lineId === lineId);

    if (existingItem) {
      const maxQty = getAvailableQuantityInUnit(
        product.unitOfMeasure,
        existingItem.selectedUnit,
        product.uomConversions,
        product.availableQuantity,
        product.quantityByUnit,
      );
      if (existingItem.quantity + 1 > maxQty) {
        toast.error(t("pos.cannotExceedStock") || "Cannot exceed stock");
        return;
      }
      setSelectedItems(
        selectedItems.map((item) =>
          item.lineId === lineId
            ? buildSelectedItem(product, item.quantity + 1, item.selectedUnit)
            : item,
        ),
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        buildSelectedItem(product, 1, defaultUnit),
      ]);
    }
  };

  const handleRemoveItem = (lineId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.lineId !== lineId));
  };

  const handleQuantityChange = (lineId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(lineId);
      return;
    }
    setSelectedItems(
      selectedItems.map((item) => {
        if (item.lineId !== lineId) return item;
        const product: InventoryProduct = {
          _id: item.inventoryId,
          productName: item.productName,
          productCode: item.productCode,
          sellingPrice: item.sellingPrice,
          buyingPrice: 0,
          unitOfMeasure: item.unitOfMeasure,
          uomConversions: item.uomConversions,
          quantityByUnit: item.quantityByUnit,
          availableQuantity: item.availableQuantity,
        };
        const maxQty = getAvailableQuantityInUnit(
          item.unitOfMeasure,
          item.selectedUnit,
          item.uomConversions,
          item.availableQuantity,
          item.quantityByUnit,
        );
        if (quantity > maxQty) {
          toast.error(t("pos.cannotExceedStock") || "Cannot exceed stock");
          return buildSelectedItem(product, maxQty, item.selectedUnit);
        }
        return buildSelectedItem(product, quantity, item.selectedUnit);
      }),
    );
  };

  const handleUnitChange = (lineId: string, unit: string) => {
    setSelectedItems((prev) => {
      const source = prev.find((i) => i.lineId === lineId);
      if (!source) return prev;

      const product: InventoryProduct = {
        _id: source.inventoryId,
        productName: source.productName,
        productCode: source.productCode,
        sellingPrice: source.sellingPrice,
        buyingPrice: 0,
        unitOfMeasure: source.unitOfMeasure,
        uomConversions: source.uomConversions,
        quantityByUnit: source.quantityByUnit,
        availableQuantity: source.availableQuantity,
      };
      const updated = buildSelectedItem(product, source.quantity, unit);
      const rest = prev.filter((i) => i.lineId !== lineId);
      const duplicateIdx = rest.findIndex((i) => i.lineId === updated.lineId);

      if (duplicateIdx >= 0) {
        const duplicate = rest[duplicateIdx];
        return rest.map((i, idx) =>
          idx === duplicateIdx
            ? buildSelectedItem(
                product,
                duplicate.quantity + updated.quantity,
                unit,
              )
            : i,
        );
      }
      return [...rest, updated];
    });
  };

  const calculateTotals = () => {
    const newItemsSubtotal = selectedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const existingSubtotal = order?.subTotal || 0;
    const existingTax = order?.tax || 0;
    const existingDiscount = order?.discount || 0;

    // Total subtotal including new items
    const totalSubtotal = existingSubtotal + newItemsSubtotal;

    // Tax: If tax was manually changed, use the form value as absolute amount
    // Otherwise, calculate proportionally based on new subtotal
    const calculatedTax = taxManuallyChanged
      ? tax
      : existingSubtotal > 0
        ? Math.max(
            0,
            Math.round(
              ((totalSubtotal * existingTax) / existingSubtotal) * 100,
            ) / 100,
          )
        : 0;

    // Calculate discount or markup based on toggle
    let calculatedDiscount = 0;
    if (useMarkup) {
      // When using markup, no discount is applied
      calculatedDiscount = 0;
    } else {
      // When using discount, calculate from percentage
      calculatedDiscount = Math.max(
        0,
        Math.round(((totalSubtotal * discountPercent) / 100) * 100) / 100,
      );
    }

    // Final amount calculation
    let finalAmount;
    if (useMarkup) {
      // Apply markup to total
      finalAmount = totalSubtotal + calculatedTax + markupAmount;
    } else {
      // Apply discount to total
      finalAmount = totalSubtotal + calculatedTax - calculatedDiscount;
    }

    // Extra change = paidAmount - finalAmount (if paidAmount > finalAmount)
    const extraChange = Math.max(0, paidAmount - finalAmount);

    return {
      subTotal: totalSubtotal,
      tax: calculatedTax,
      discount: calculatedDiscount,
      finalAmount,
      extraChange,
      paidAmount,
    };
  };

  const handleSubmitAddItems = () => {
    if (selectedItems.length === 0) {
      toast.error(
        t("orders.noItemsSelected") || "Please select at least one item",
      );
      return;
    }

    if (!order) return;

    setShowPaidAmountConfirm(true);
  };

  const confirmPaidAmountAndAdd = async () => {
    if (!order || selectedItems.length === 0) return;

    setSubmitting(true);
    try {
      const totals = calculateTotals();

      const payload = {
        items: selectedItems.map((item) =>
          buildOrderProductLine(
            item.inventoryId,
            item.quantity,
            item.unitOfMeasure,
            item.selectedUnit,
          ),
        ) as AddItemToOrderRequest[],
        subTotal: totals.subTotal,
        tax: totals.tax,
        discount: totals.discount,
        finalAmount: totals.finalAmount,
        extraChange: totals.extraChange,
        paidAmount: totals.paidAmount,
      };

      const response = await addItemsToOrder(order._id, payload);

      if (response.success) {
        setShowPaidAmountConfirm(false);
        toast.success(
          t("orders.itemsAddedSuccess") || "Items added successfully",
        );
        onClose();
        setSelectedItems([]);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(
          response.message ||
            t("orders.failedToAddItems") ||
            "Failed to add items",
        );
      }
    } catch (error: any) {
      console.error("Error adding items to order:", error);
      toast.error(
        error.message || t("orders.failedToAddItems") || "Failed to add items",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  const confirmTotals = calculateTotals();
  const paidAmountConfirmMessage = [
    t("orders.confirmPaidAmountMessageAdd") ||
      "Please confirm the paid amount is correct before adding items:",
    "",
    `${t("orders.paidAmount") || "Paid Amount"}: ${paidAmount.toLocaleString()} MMK`,
    `${t("orders.finalAmount") || "Final Amount"}: ${confirmTotals.finalAmount.toLocaleString()} MMK`,
    confirmTotals.extraChange > 0
      ? `${t("orders.change") || "Change"}: ${confirmTotals.extraChange.toLocaleString()} MMK`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/10 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            {t("orders.addItemsToOrder") || "Add Items to Order"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Modal Body - Two Column Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Column: Product Selection */}
          <div className="flex-1 border-r overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-slate-50">
              <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                {t("orders.selectProductsToAdd") || "Select Products to Add"}
                {order.storefrontId && (
                  <span className="text-xs font-normal text-slate-500 ml-auto">
                    (
                    {order.storefrontId.storefrontName ||
                      order.storefrontId.locationName}
                    )
                  </span>
                )}
              </h4>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={
                    t("orders.searchProducts") || "Search products..."
                  }
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-slate-500">
                    {t("orders.loadingProducts") || "Loading products..."}
                  </span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">
                    {searchProduct
                      ? t("orders.noProductsFound") || "No products found"
                      : t("orders.noProductsInStorefront") ||
                        "No products available in this storefront"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      onClick={() => handleAddItem(product)}
                      disabled={
                        product.availableQuantity !== undefined &&
                        product.availableQuantity <= 0
                      }
                      className="p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:bg-white"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-slate-800 text-sm">
                          {product.productName}
                        </p>
                        {product.availableQuantity !== undefined && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              product.availableQuantity > 0
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {product.availableQuantity > 0
                              ? `${product.availableQuantity} ${
                                  t("orders.inStock") || "in stock"
                                }`
                              : t("orders.outOfStock") || "Out of stock"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {product.productCode}
                      </p>
                      <p className="text-sm font-semibold text-primary mt-1">
                        {product.sellingPrice.toLocaleString()} MMK
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Items & Totals */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Original Order Items
            {order.ordersProducts && order.ordersProducts.length > 0 && (
              <div className="p-4 border-b bg-slate-50">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {t("orders.originalItems") || "Original Order Items"} (
                  {order.ordersProducts.length})
                </h4>
                <div className="max-h-32 overflow-y-auto border rounded-lg bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left font-medium text-slate-600 text-xs">
                          {t("orders.product") || "Product"}
                        </th>
                        <th className="p-2 text-center font-medium text-slate-600 text-xs">
                          {t("orders.qty") || "Qty"}
                        </th>
                        <th className="p-2 text-right font-medium text-slate-600 text-xs">
                          {t("orders.subTotal") || "Subtotal"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {order.ordersProducts.map((item, index) => (
                        <tr
                          key={item._id || index}
                          className="hover:bg-slate-50"
                        >
                          <td className="p-2">
                            <div>
                              <p className="font-medium text-slate-800 text-xs">
                                {item.inventoryId?.productName || "Unknown"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {item.inventoryId?.productCode}
                              </p>
                            </div>
                          </td>
                          <td className="p-2 text-center font-medium text-xs">
                            {item.quantity}
                          </td>
                          <td className="p-2 text-right font-medium text-slate-800 text-xs">
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
                <div className="mt-2 pt-2 border-t text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>
                      {t("orders.currentSubtotal") || "Current Subtotal"}:
                    </span>
                    <span className="font-semibold">
                      {order.subTotal?.toLocaleString()} MMK
                    </span>
                  </div>
                </div>
              </div>
            )} */}

            {/* New Items to Add */}
            <div className="flex-1 overflow-y-auto p-4 border-b bg-white">
              <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-green-600" />
                {t("orders.newItemsToAdd") || "New Items to Add"} (
                {selectedItems.length})
              </h4>
              {selectedItems.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">
                  {t("orders.noItemsSelected") || "No items selected"}
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map((item) => {
                    const maxQty = getAvailableQuantityInUnit(
                      item.unitOfMeasure,
                      item.selectedUnit,
                      item.uomConversions,
                      item.availableQuantity,
                      item.quantityByUnit,
                    );
                    return (
                      <div
                        key={item.lineId}
                        className="bg-slate-50 p-3 rounded-lg border flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-slate-800 text-sm">
                              {item.productName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {item.productCode} ·{" "}
                              {item.unitPrice.toLocaleString()} MMK /{" "}
                              {item.selectedUnit}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.lineId)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <CartUnitSelector
                            baseUnit={item.unitOfMeasure}
                            conversions={item.uomConversions}
                            selectedUnit={item.selectedUnit}
                            onUnitChange={(unit) =>
                              handleUnitChange(item.lineId, unit)
                            }
                          />
                          <div className="flex items-center gap-1 ml-auto">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.lineId,
                                  item.quantity - 1,
                                )
                              }
                              className="w-6 h-6 rounded border flex items-center justify-center hover:bg-slate-200 text-sm"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={maxQty}
                              value={item.quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.lineId,
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="w-12 text-center border rounded py-1 text-sm"
                            />
                            <span className="text-xs text-slate-500">
                              {item.selectedUnit}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.lineId,
                                  item.quantity + 1,
                                )
                              }
                              className="w-6 h-6 rounded border flex items-center justify-center hover:bg-slate-200 text-sm"
                            >
                              +
                            </button>
                          </div>
                          <p className="font-medium text-slate-800 text-sm w-full text-right">
                            {item.subtotal.toLocaleString()} MMK
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Totals & Financial Inputs */}
        <div className="p-4 border-t bg-white">
          {/* Discount/Markup Toggle */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Pricing Option
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="pricingOption"
                  checked={!useMarkup}
                  onChange={() => setUseMarkup(false)}
                  className="mr-2"
                />
                <span className="text-sm">Discount</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="pricingOption"
                  checked={useMarkup}
                  onChange={() => setUseMarkup(true)}
                  className="mr-2"
                />
                <span className="text-sm">Markup</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t("orders.tax") || "Tax"} (MMK)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={tax}
                onChange={(e) => {
                  setTax(parseFloat(e.target.value) || 0);
                  setTaxManuallyChanged(true);
                }}
                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            {!useMarkup && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t("orders.discount") || "Discount"} (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={discountPercent}
                    onChange={(e) => {
                      const percent = parseFloat(e.target.value) || 0;
                      setDiscountPercent(Math.min(100, Math.max(0, percent)));
                      setDiscountManuallyChanged(true);
                    }}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    = {discount.toLocaleString()} MMK
                  </span>
                </div>
              </div>
            )}
            {useMarkup && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Markup Amount (MMK)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={markupAmount}
                    onChange={(e) => {
                      const amount = parseFloat(e.target.value) || 0;
                      setMarkupAmount(Math.max(0, amount));
                      setDiscountManuallyChanged(true);
                    }}
                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    MMK
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t("orders.paidAmount") || "Paid Amount"} (MMK)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
              className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
          <div className="bg-slate-50 p-3 rounded-lg space-y-1.5 text-xs mb-3">
            {(() => {
              const totals = calculateTotals();
              const newItemsSubtotal = selectedItems.reduce(
                (sum, item) => sum + item.subtotal,
                0,
              );
              const existingSubtotal = order?.subTotal || 0;
              return (
                <>
                  {selectedItems.length > 0 && (
                    <>
                      <div className="flex justify-between text-slate-500 pb-1 border-b">
                        <span>
                          {t("orders.currentSubtotal") || "Current Subtotal"}:
                        </span>
                        <span>{existingSubtotal.toLocaleString()} MMK</span>
                      </div>
                      <div className="flex justify-between text-green-600 pb-1">
                        <span>
                          {t("orders.newItemsSubtotal") || "New Items Subtotal"}
                          :
                        </span>
                        <span>+{newItemsSubtotal.toLocaleString()} MMK</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between pt-1 border-t font-medium">
                    <span className="text-slate-700">
                      {t("orders.totalSubtotal") || "Total Subtotal"}
                    </span>
                    <span className="font-bold">
                      {totals.subTotal.toLocaleString()} MMK
                    </span>
                  </div>
                  {totals.tax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>{t("orders.tax") || "Tax"}</span>
                      <span>+{totals.tax.toLocaleString()} MMK</span>
                    </div>
                  )}
                  {!useMarkup && totals.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t("orders.discount") || "Discount"}</span>
                      <span>-{totals.discount.toLocaleString()} MMK</span>
                    </div>
                  )}
                  {useMarkup && markupAmount > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Markup Amount</span>
                      <span>+{markupAmount.toLocaleString()} MMK</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-base text-primary">
                    <span>{t("orders.finalAmount") || "Final Amount"}</span>
                    <span>{totals.finalAmount.toLocaleString()} MMK</span>
                  </div>
                  {totals.extraChange > 0 && (
                    <div className="flex justify-between text-blue-600 font-medium">
                      <span>{t("orders.change") || "Change"}</span>
                      <span>{totals.extraChange.toLocaleString()} MMK</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
            >
              {t("common.cancel") || "Cancel"}
            </button>
            <button
              onClick={handleSubmitAddItems}
              disabled={submitting || selectedItems.length === 0}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("orders.addingItems") || "Adding Items..."}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {t("orders.addItems") || "Add Items"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showPaidAmountConfirm}
        title={t("orders.confirmPaidAmountTitle") || "Confirm Paid Amount"}
        message={paidAmountConfirmMessage}
        confirmText={t("orders.confirmAddItems") || "Yes, Add Items"}
        confirmButtonColor="primary"
        onConfirm={confirmPaidAmountAndAdd}
        onCancel={() => setShowPaidAmountConfirm(false)}
        isLoading={submitting}
      />
    </div>
  );
};
