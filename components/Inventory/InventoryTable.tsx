import React from "react";
import { Product } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

interface InventoryTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onViewDetails: (productId: string) => void;
  onStatusToggle?: (
    productId: string,
    currentStatus: "active" | "inactive",
  ) => void;
  selectedProductIds?: string[];
  onSelectionChange?: (productId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  showSelectBoxes?: boolean;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  onEdit,
  onViewDetails,
  onStatusToggle,
  selectedProductIds = [],
  onSelectionChange,
  onSelectAll,
  showSelectBoxes = false,
}) => {
  const { t } = useLanguage();

  // Get user role from localStorage (set during login)
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;
  // console.log("User role from localStorage:", userRole);

  const allSelected =
    products.length > 0 && selectedProductIds.length === products.length;
  const someSelected =
    selectedProductIds.length > 0 &&
    selectedProductIds.length < products.length;

  if (products.length === 0) {
    return (
      <div className="bg-white shadow-sm border rounded-xl p-8 text-center">
        <p className="text-slate-500">{t("inventory.noProductsFound")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
      {/* Mobile scroll indicator */}
      <div className="sm:hidden px-4 py-2 bg-slate-50 border-b text-xs text-slate-500 text-center">
        ← Swipe to see more →
      </div>

      {/* Table container with horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              {showSelectBoxes && onSelectionChange && (
                <th className="px-2 sm:px-4 py-3 text-center w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                </th>
              )}
              <th className="px-2 sm:px-4 py-3 text-center">No</th>
              <th className="px-2 sm:px-4 py-3">Code</th>
              <th className="px-2 sm:px-4 py-3">Name</th>
              <th className="px-2 sm:px-4 py-3">Category</th>
              <th className="px-2 sm:px-4 py-3 text-right">Cost</th>
              <th className="px-2 sm:px-4 py-3 text-right">Price</th>
              <th className="px-2 sm:px-4 py-3 text-center">Status</th>
              <th className="px-2 sm:px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p, index) => {
              const isSelected = selectedProductIds.includes(p.id);
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  {showSelectBoxes && onSelectionChange && (
                    <td className="px-2 sm:px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) =>
                          onSelectionChange(p.id, e.target.checked)
                        }
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                    </td>
                  )}
                  <td className="px-2 sm:px-4 py-3 text-center text-slate-600">
                    {String(index + 1).padStart(2, "0")}
                  </td>
                  <td className="px-2 sm:px-4 py-3 font-medium text-xs sm:text-sm">
                    {p.productCode}
                  </td>
                  <td className="px-2 sm:px-4 py-3 font-medium">
                    <div
                      className="max-w-[120px] sm:max-w-none truncate"
                      title={p.name}
                    >
                      {p.name}
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-slate-500 text-xs sm:text-sm">
                    {p.category}
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-right text-slate-400 text-xs sm:text-sm">
                    {p.costPrice.toLocaleString()} MMK
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-right font-bold text-slate-800 text-xs sm:text-sm">
                    {p.sellingPrice.toLocaleString()} MMK
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-center">
                    {onStatusToggle && userRole === "owner" ? (
                      <button
                        onClick={() =>
                          onStatusToggle(p.id, p.status || "active")
                        }
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${p.status === "active"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                      >
                        {p.status === "active" ? "Active" : "Inactive"}
                      </button>
                    ) : (
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${p.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        {p.status === "active" ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-2 sm:px-4 py-3">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <button
                        onClick={() => onViewDetails(p.id)}
                        className="inventory-view-btn px-2 py-1 sm:px-3 sm:py-1.5 text-xs rounded-2xl border border-[#000] hover:bg-gray-200 transition-colors whitespace-nowrap"
                      >
                        <span className="hidden sm:inline">
                          {t("inventory.checkItem")}
                        </span>
                        <span className="sm:hidden">View</span>
                      </button>
                      {(userRole === "owner" || userRole === "inventory-manager") && (
                        <button
                          onClick={() => onEdit(p)}
                          className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs rounded-2xl border border-[#000] hover:bg-gray-200 transition-colors whitespace-nowrap"
                        >
                          <span className="hidden sm:inline">
                            {t("inventory.editItem")}
                          </span>
                          <span className="sm:hidden">Edit</span>
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
    </div>
  );
};
