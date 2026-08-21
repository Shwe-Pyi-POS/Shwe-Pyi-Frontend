import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Package,
  DollarSign,
  TrendingUp,
  Store,
  Warehouse,
} from "lucide-react";
import { ProductDetail } from "../../services/Inventory/fetchProductById";
import { useLanguage } from "../../context/LanguageContext";
import JsBarcode from "jsbarcode";

interface ProductDetailModalProps {
  isOpen: boolean;
  loading: boolean;
  product: ProductDetail | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  loading,
  product,
  onClose,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"about" | "quantity" | "barcode">("about");
  const [stockTab, setStockTab] = useState<"warehouse" | "storefront">(
    "storefront"
  );
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (activeTab === "barcode" && product?.barcode && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, product.barcode, {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: 100,
          displayValue: true,
          fontSize: 16,
          margin: 10,
        });
      } catch (err) {
        console.error("Failed to render barcode", err);
      }
    }
  }, [activeTab, product?.barcode]);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {t("inventory.productDetails")}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 py-2 gap-5">
          <button
            onClick={() => setActiveTab("about")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "about"
                ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {t("inventory.aboutProduct")}
          </button>
          <button
            onClick={() => setActiveTab("quantity")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "quantity"
                ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {t("inventory.productQuantity")}
          </button>
          <button
            onClick={() => setActiveTab("barcode")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "barcode"
                ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {t("inventory.barcode")}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto min-h-[calc(60vh)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-slate-500">
                {t("inventory.loadingProductDetails")}
              </p>
            </div>
          ) : product ? (
            <>
              {activeTab === "about" ? (
                <div className="space-y-6">
                  {/* Product Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        {t("inventory.productName")}
                      </p>
                      <p className="font-bold text-blue-800">
                        {product.productName}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-xs text-green-600 font-medium mb-1">
                        {t("inventory.productCode")}
                      </p>
                      <p className="font-bold text-green-800">
                        {product.productCode}
                      </p>
                    </div>
                  </div>

                  {/* Pricing & Profit */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <p className="text-xs text-slate-500 font-medium">
                          {t("inventory.prices")}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-slate-600">
                            {t("inventory.buyingPriceLabel")}
                          </span>
                          <span className="text-sm font-medium text-slate-800 ml-2">
                            {product.buyingPrice.toLocaleString()} MMK
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-600">
                            {t("inventory.sellingPriceLabel")}
                          </span>
                          <span className="text-sm font-bold text-slate-800 ml-2">
                            {product.sellingPrice.toLocaleString()} MMK
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <p className="text-xs text-green-600 font-medium">
                          {t("inventory.profit")}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-green-600">
                            {t("inventory.profitPercentage")}
                          </span>
                          <span className="text-sm font-medium text-green-800 ml-2">
                            {product.profitMargin}%
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-green-600">
                            {t("inventory.profitAmount")}
                          </span>
                          <span className="text-sm font-bold text-green-800 ml-2">
                            {product.profitAmount.toLocaleString()} MMK
                          </span>
                        </div>
                      </div>
                    </div> */}
                  </div>

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        SKU
                      </p>
                      <p className="text-sm font-mono text-slate-800">
                        {product.SKU}
                      </p>
                    </div> */}
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.barcode")}
                      </p>
                      <p className="text-sm font-mono text-slate-800">
                        {product.barcode || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.category")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.category}
                      </p>
                    </div>
                    {/* <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.subCategoryDetails")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.subCategory || "None"}
                      </p>
                    </div> */}
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.brand")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.brand || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.unitOfMeasureLabel")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.unitOfMeasure}
                      </p>
                    </div>
                    {product.uomConversions &&
                      product.uomConversions.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 font-medium mb-2">
                            {t("inventory.uomConversions")}
                          </p>
                          <table className="w-full text-sm border rounded-lg overflow-hidden">
                            <thead className="bg-slate-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs text-slate-500">
                                  {t("inventory.conversionUnit")}
                                </th>
                                <th className="px-3 py-2 text-right text-xs text-slate-500">
                                  {t("inventory.conversionFactor")}
                                </th>
                                <th className="px-3 py-2 text-center text-xs text-slate-500">
                                  {t("inventory.defaultSellingUnitShort")}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {product.uomConversions.map((row, i) => (
                                <tr key={i}>
                                  <td className="px-3 py-2">{row.unit}</td>
                                  <td className="px-3 py-2 text-right">
                                    {row.factor}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {row.isDefaultSellingUnit ? "✓" : ""}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    {/* <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.productStatus")}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.status}
                      </span>
                    </div> */}
                  </div>

                  {/* Note */}
                  {product.note && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-600 font-medium mb-1">
                        {t("pos.note") || "Note"}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.note}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  {/* {product.description && (
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.productDescription")}
                      </p>
                      <p className="text-sm text-slate-800 bg-slate-50 p-3 rounded-lg">
                        {product.description}
                      </p>
                    </div>
                  )} */}
                </div>
              ) : activeTab === "quantity" ? (
                <div className="space-y-6">
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.createDate")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {formatDate(product.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.lastUpdatedDate")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {formatDate(product.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Total Quantity Summary */}
                  <div className="bg-[#FEFEB0] p-6 rounded-lg border-2 border-[#FEFEB0]">
                    <div className="flex items-center justify-between">
                      <p className="text-[16px] font-medium text-[#585800]">
                        {t("inventory.productTotalQuantity")}
                      </p>
                      <p className="text-4xl font-bold text-slate-800">
                        {product.stockAvailability.totalQuantity.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Stock Tabs */}
                  <div className="flex gap-5">
                    <button
                      onClick={() => setStockTab("warehouse")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        stockTab === "warehouse"
                          ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      {t("inventory.warehouses")}
                    </button>
                    <button
                      onClick={() => setStockTab("storefront")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        stockTab === "storefront"
                          ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                          : "text-slate-600 hover:text-slate-800"
                      }`}
                    >
                      {t("inventory.storefronts")}
                    </button>
                  </div>

                  {/* Warehouse Summary Cards */}
                  {stockTab === "warehouse" &&
                    product.stockAvailability.warehouses.count > 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              {t("inventory.warehouses")}
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {product.stockAvailability.warehouses.count}{" "}
                              {t("inventory.warehouses")}
                            </p>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              {t("inventory.totalQtyInWarehouses")}
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {product.stockAvailability.warehouses.totalQuantity.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Warehouse Location Cards */}
                        <div className="grid grid-cols-2 gap-4">
                          {product.stockAvailability.warehouses.locations.map(
                            (location) => (
                              <div
                                key={location.locationId}
                                className="bg-slate-100 p-4 rounded-lg border border-slate-300"
                              >
                                <h4 className="font-semibold text-slate-800 mb-1">
                                  {location.locationName}
                                </h4>
                                <p className="text-xs text-slate-600 mb-3">
                                  {location.locationAddress || "-"}
                                </p>
                                <div className="flex justify-end">
                                  <span className="text-sm font-bold text-slate-800">
                                    Quantity{" "}
                                    {location.quantity.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </>
                    )}

                  {/* Storefront Summary Cards */}
                  {stockTab === "storefront" &&
                    product.stockAvailability.storefronts.count > 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              {t("inventory.storefronts")}
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {product.stockAvailability.storefronts.count}{" "}
                              {t("inventory.storefronts")}
                            </p>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              Total QTY In Storefronts
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {product.stockAvailability.storefronts.totalQuantity.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Storefront Location Cards */}
                        <div className="grid grid-cols-2 gap-4">
                          {product.stockAvailability.storefronts.locations.map(
                            (location) => (
                              <div
                                key={location.locationId}
                                className="bg-slate-100 p-4 rounded-lg border border-slate-300"
                              >
                                <h4 className="font-semibold text-slate-800 mb-1">
                                  {location.locationName}
                                </h4>
                                <p className="text-xs text-slate-600 mb-3">
                                  {location.locationAddress || "-"}
                                </p>
                                <div className="flex justify-end">
                                  <span className="text-sm font-bold text-slate-800">
                                    Quantity{" "}
                                    {location.quantity.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </>
                    )}

                  {/* Empty States */}
                  {stockTab === "warehouse" &&
                    product.stockAvailability.warehouses.count === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <Warehouse className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>No warehouses found</p>
                      </div>
                    )}

                  {stockTab === "storefront" &&
                    product.stockAvailability.storefronts.count === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <Store className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>No storefronts found</p>
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 space-y-6">
                  {product.barcode ? (
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                      <p className="text-sm font-semibold text-slate-500 mb-4">
                        {product.productName}
                      </p>
                      <svg ref={barcodeRef}></svg>
                      <button
                        onClick={() => {
                          const printWindow = window.open("", "_blank");
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Print Barcode - ${product.productName}</title>
                                  <style>
                                    body {
                                      display: flex;
                                      flex-direction: column;
                                      align-items: center;
                                      justify-content: center;
                                      height: 100vh;
                                      margin: 0;
                                      font-family: sans-serif;
                                    }
                                    svg {
                                      width: 80%;
                                      max-width: 300px;
                                    }
                                  </style>
                                </head>
                                <body>
                                  <h3>${product.productName}</h3>
                                  ${barcodeRef.current?.outerHTML || ""}
                                  <script>
                                    window.onload = function() {
                                      window.print();
                                      window.close();
                                    }
                                  </script>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }
                        }}
                        className="mt-6 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                      >
                        Print Barcode
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p>No barcode set for this product.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500">
                {t("inventory.noProductDetails")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
