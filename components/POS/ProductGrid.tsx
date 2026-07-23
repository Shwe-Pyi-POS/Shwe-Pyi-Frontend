import React from "react";
import {
  Search,
  RefreshCw,
  Store,
  ChevronDown,
  Scan,
  ShoppingCart,
} from "lucide-react";
import { StorefrontProfile } from "../../services/Storefront/fetchStorefrontProfiles";
import { StorefrontStockItem } from "../../services/Storefront/fetchStorefrontStock";

interface ProductGridProps {
  search: string;
  setSearch: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  categories: string[];
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
  totalPages: number;
  totalItems: number;
  filteredProducts: StorefrontStockItem[];
  addToCart: (item: StorefrontStockItem) => void;
  handleBarcodeScan: (val: string) => void;
  storefronts: StorefrontProfile[];
  selectedStorefrontId: string;
  showStorefrontMenu: boolean;
  setShowStorefrontMenu: (val: boolean) => void;
  handleStorefrontChange: (id: string) => void;
  handleRefresh: () => void;
  loading: boolean;
  t: (key: string) => string;
  p: {
    itemsPerPage: number;
    devices: { isMobile: boolean };
  };
  cartCount: number;
  showMobileCart: boolean;
  setShowMobileCart: (val: boolean) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  categories,
  currentPage,
  setCurrentPage,
  totalPages,
  totalItems,
  filteredProducts,
  addToCart,
  handleBarcodeScan,
  storefronts,
  selectedStorefrontId,
  showStorefrontMenu,
  setShowStorefrontMenu,
  handleStorefrontChange,
  handleRefresh,
  loading,
  t,
  p,
  cartCount,
  showMobileCart,
  setShowMobileCart,
}) => {
  return (
    <div className="flex-1 flex flex-col px-6 py-4 overflow-hidden">
      <div className="mb-4">
        <div className="flex items-center gap-3 flex-col sm:flex-row">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none" />
            <Scan className="absolute right-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none opacity-50" />
            <input
              type="text"
              placeholder={
                t("pos.searchOrScanBarcode") ||
                "Search products or scan barcode..."
              }
              className="search-input w-full pl-10 pr-10 py-2.5 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white shadow-sm"
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
              onBlur={() => {
                if (search.trim() && search.trim().length >= 3) {
                  handleBarcodeScan(search);
                }
              }}
              autoFocus
            />
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <select
              className="w-full sm:w-auto border border-dark-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm"
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

            <div className="relative flex-1 sm:flex-initial">
            <button
              onClick={() => setShowStorefrontMenu(!showStorefrontMenu)}
              className="flex items-center gap-2 px-3 py-2.5 bg-dark text-white rounded-xl hover:bg-dark-800 transition-all shadow-sm"
            >
              <Store className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium max-w-[120px] truncate">
                {storefronts.find((sf) => sf._id === selectedStorefrontId)
                  ?.locationName || "Store"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-primary transition-transform duration-200 ${showStorefrontMenu ? "rotate-180" : ""}`}
              />
            </button>

            {showStorefrontMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowStorefrontMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-dark-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 bg-dark-50 border-b border-dark-200">
                    <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider">
                      {t("pos.selectStorefront")}
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {storefronts.map((sf) => (
                      <button
                        key={sf._id}
                        onClick={() => {
                          handleStorefrontChange(sf._id);
                          setShowStorefrontMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors ${sf._id === selectedStorefrontId
                            ? "bg-primary/20 border-l-4 border-primary"
                            : ""
                          }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${sf._id === selectedStorefrontId
                              ? "bg-primary text-white"
                              : "bg-dark-100 text-dark-500"
                            }`}
                        >
                          <Store className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-dark-800 truncate">
                            {sf.locationName}
                          </p>
                          <p className="text-xs text-dark-400">
                            {sf.locationCode}
                          </p>
                        </div>
                        {sf._id === selectedStorefrontId && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t border-dark-200 bg-dark-50">
                    <button
                      onClick={() => {
                        handleRefresh();
                        setShowStorefrontMenu(false);
                      }}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-dark-600 hover:bg-dark-100 rounded-lg transition-colors"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                      />
                      {t("pos.refreshProducts")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </div>
      </div>

      <div className="mb-2 text-sm text-gray-600">
        {t("pos.showingProducts").replace(
          "{count}",
          filteredProducts.length.toString(),
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="text-sm text-gray-600">
            {t("pos.showingProducts").replace(
              "{count}",
              ((currentPage - 1) * p.itemsPerPage + 1).toString(),
            )}{" "}
            to {Math.min(currentPage * p.itemsPerPage, totalItems)} of{" "}
            {totalItems}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="First Page"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {t("common.previous") || "Prev"}
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2)
                  pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors text-sm ${currentPage === pageNum
                        ? "bg-primary text-white border-primary"
                        : "hover:bg-gray-50 border-gray-200"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {t("common.next") || "Next"}
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Last Page"
            >
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        </div>
      )}

      <div className="flex overflow-y-auto grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 pb-20">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            {selectedStorefrontId
              ? t("pos.noProductsInStorefront")
              : t("pos.pleaseSelectStorefront")}
          </div>
        ) : (
          filteredProducts.map((stockItem) => (
            <div
              key={stockItem._id}
              onClick={() => addToCart(stockItem)}
              className={`bg-white p-4 rounded-xl shadow-sm border border-dark-200 cursor-pointer transition-all hover:shadow-lg hover:border-primary hover:scale-[1.02] flex flex-col ${stockItem.quantity === 0
                  ? "opacity-50 grayscale pointer-events-none"
                  : ""
                }`}
            >
              <div className="">
                <h3 className="font-medium text-gray-800 text-sm line-clamp-2">
                  {stockItem.inventoryId.productName}
                </h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  {stockItem.inventoryId.productCode}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stockItem.inventoryId.category}
                </p>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <span className="font-bold text-primary-600">
                  {(stockItem.inventoryId.sellingPrice || 0).toLocaleString()}{" "}
                  MMK
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mobile Cart FAB */}
      <button
        onClick={() => setShowMobileCart(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-full shadow-2xl hover:bg-primary/90 transition-all active:scale-95"
      >
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
        <span className="text-sm font-semibold">Cart</span>
      </button>
    </div>
  );
};
