import React, { useState } from "react";
import { Product } from "../../types";
import { UomConversion } from "../../types/uom";
import { useLanguage } from "../../context/LanguageContext";
import { UomConversionsEditor } from "./UomConversionsEditor";

// const UNIT_OF_MEASURE_OPTIONS = [
//   "piece",
//   "kg",
//   "gram",
//   "liter",
//   "ml",
//   "meter",
//   "cm",
//   "box",
//   "pack",
//   "carton",
//   "dozen",
//   "pair",
// ];

export interface ProductFormData {
  productName: string;
  productCode: string;
  saleCode?: string;
  SKU: string;
  barcode?: string;
  category: string;
  subCategory?: string;
  brand?: string;
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
  unitOfMeasure: string;
  uomConversions: UomConversion[];
  reorderPoint?: number;
  reorderQuantity?: number;
  taxRate?: number;
  status?: string;
  tags?: string[];
  note?: string;
  weightPerPiece?: number;
  buyingPricePerKg?: number;
  sellingPricePerKg?: number;
}

export interface ApiProduct {
  _id?: string;
  id?: string;
  productName: string;
  productCode: string;
  saleCode?: string;
  SKU: string;
  barcode?: string;
  category: string;
  subCategory?: string;
  brand?: string;
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
  unitOfMeasure: string;
  uomConversions: UomConversion[];
  reorderPoint?: number;
  reorderQuantity?: number;
  taxRate?: number;
  status?: string;
  tags?: string[];
  note?: string;
  stockWarehouse?: number;
  stockShop?: number;
  weightPerPiece?: number;
  buyingPricePerKg?: number;
  sellingPricePerKg?: number;
}

interface ProductModalProps {
  isOpen: boolean;
  editingId: string | null;
  formData: ProductFormData;
  error: string | null;
  isLoading: boolean;
  products: Product[];
  apiProducts: ApiProduct[];
  onClose: () => void;
  onSave: () => void;
  onFormDataChange: (data: ProductFormData) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  editingId,
  formData,
  error,
  isLoading,
  products,
  apiProducts,
  onClose,
  onSave,
  onFormDataChange,
}) => {
  const { t } = useLanguage();

  // Combobox states for category and subCategory
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryShowDropdown, setCategoryShowDropdown] = useState(false);
  // const [subCategoryInput, setSubCategoryInput] = useState("");
  // const [subCategoryShowDropdown, setSubCategoryShowDropdown] = useState(false);

  // Get unique categories from products
  const getUniqueCategories = (): string[] => {
    const categories = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        categories.add(p.category);
      }
    });
    return Array.from(categories).sort();
  };

  // Get unique subcategories from API products
  // const getUniqueSubCategories = (): string[] => {
  //   const subCategories = new Set<string>();
  //   apiProducts.forEach((p) => {
  //     if (p.subCategory && p.subCategory.trim()) {
  //       subCategories.add(p.subCategory);
  //     }
  //   });
  //   return Array.from(subCategories).sort();
  // };

  // Filter categories/subcategories based on input
  const getFilteredCategories = (input: string): string[] => {
    const allCategories = getUniqueCategories();
    if (!input.trim()) return allCategories;
    return allCategories.filter((cat) =>
      cat.toLowerCase().includes(input.toLowerCase()),
    );
  };

  // const getFilteredSubCategories = (input: string): string[] => {
  //   const allSubCategories = getUniqueSubCategories();
  //   if (!input.trim()) return allSubCategories;
  //   return allSubCategories.filter((subCat) =>
  //     subCat.toLowerCase().includes(input.toLowerCase())
  //   );
  // };

  const updateFormData = (updates: Partial<ProductFormData>) => {
    onFormDataChange({ ...formData, ...updates });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {editingId
            ? t("inventory.editProduct")
            : t("inventory.addNewProduct")}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Required Fields */}
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.productName")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border rounded p-2"
              value={formData.productName}
              onChange={(e) => {
                const productName = e.target.value;
                updateFormData({ productName, productCode: productName });
              }}
            />
          </div>

          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.barcode")}
            </label>
            <input
              className="w-full border rounded p-2"
              value={formData.barcode || ""}
              onChange={(e) => updateFormData({ barcode: e.target.value })}
              placeholder={t("inventory.barcode") || "Enter barcode"}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.productCode")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border rounded p-2"
              value={formData.productCode}
              onChange={(e) => updateFormData({ productCode: e.target.value })}
            />
          </div>

          {/* <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.sku")}
            </label>
            <input
              className="w-full border rounded p-2"
              value={formData.SKU}
              onChange={(e) => updateFormData({ SKU: e.target.value })}
            />
          </div> */}

          <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.category")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full border rounded p-2 pr-8"
                value={categoryInput || formData.category}
                onChange={(e) => {
                  const value = e.target.value;
                  setCategoryInput(value);
                  updateFormData({ category: value });
                  setCategoryShowDropdown(true);
                }}
                onFocus={() => setCategoryShowDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setCategoryShowDropdown(false), 200);
                }}
                placeholder={t("inventory.categoryPlaceholder")}
              />
              {categoryShowDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {getFilteredCategories(
                    categoryInput || formData.category,
                  ).map((category) => (
                    <div
                      key={category}
                      className="px-4 py-2 hover:bg-primary/10 cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        updateFormData({ category });
                        setCategoryInput("");
                        setCategoryShowDropdown(false);
                      }}
                    >
                      {category}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.subCategory")}
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full border rounded p-2 pr-8"
                value={subCategoryInput || formData.subCategory}
                onChange={(e) => {
                  const value = e.target.value;
                  setSubCategoryInput(value);
                  updateFormData({ subCategory: value });
                  setSubCategoryShowDropdown(true);
                }}
                onFocus={() => setSubCategoryShowDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setSubCategoryShowDropdown(false), 200);
                }}
                placeholder={t("inventory.subCategoryPlaceholder")}
              />
              {subCategoryShowDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {getFilteredSubCategories(
                    subCategoryInput || formData.subCategory
                  ).map((subCategory) => (
                    <div
                      key={subCategory}
                      className="px-4 py-2 hover:bg-primary/10 cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        updateFormData({ subCategory });
                        setSubCategoryInput("");
                        setSubCategoryShowDropdown(false);
                      }}
                    >
                      {subCategory}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div> */}

          <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.brand")}
            </label>
            <input
              className="w-full border rounded p-2"
              value={formData.brand}
              onChange={(e) => updateFormData({ brand: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.unitOfMeasure")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border rounded p-2"
              value={formData.unitOfMeasure}
              onChange={(e) =>
                updateFormData({ unitOfMeasure: e.target.value })
              }
              placeholder={t("inventory.unitOfMeasurePlaceholder")}
            />
          </div>

          <UomConversionsEditor
            baseUnit={formData.unitOfMeasure}
            conversions={formData.uomConversions}
            onChange={(uomConversions) => updateFormData({ uomConversions })}
          />

          {/* <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500">
              {t("common.description")}
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
            />
          </div> */}

          {formData.category?.toLowerCase() === "hollow" && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500">
                  Weight per Piece (Kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="w-full border rounded p-2 bg-amber-50/50"
                  value={formData.weightPerPiece || 0}
                  onChange={(e) => {
                    const weight = Number(e.target.value);
                    updateFormData({
                      weightPerPiece: weight,
                      buyingPrice: weight * (formData.buyingPricePerKg || 0),
                      sellingPrice: weight * (formData.sellingPricePerKg || 0),
                    });
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500">
                  Buying Price per Kg <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border rounded p-2 bg-amber-50/50"
                  value={formData.buyingPricePerKg || 0}
                  onChange={(e) => {
                    const pricePerKg = Number(e.target.value);
                    updateFormData({
                      buyingPricePerKg: pricePerKg,
                      buyingPrice: (formData.weightPerPiece || 0) * pricePerKg,
                    });
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500">
                  Selling Price per Kg <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border rounded p-2 bg-amber-50/50"
                  value={formData.sellingPricePerKg || 0}
                  onChange={(e) => {
                    const pricePerKg = Number(e.target.value);
                    updateFormData({
                      sellingPricePerKg: pricePerKg,
                      sellingPrice: (formData.weightPerPiece || 0) * pricePerKg,
                    });
                  }}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.buyingPrice")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`w-full border rounded p-2 ${
                formData.category?.toLowerCase() === "hollow" ? "bg-slate-100 cursor-not-allowed" : ""
              }`}
              disabled={formData.category?.toLowerCase() === "hollow"}
              value={formData.buyingPrice}
              onChange={(e) =>
                updateFormData({ buyingPrice: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500">
              {t("inventory.sellingPrice")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`w-full border rounded p-2 ${
                formData.category?.toLowerCase() === "hollow" ? "bg-slate-100 cursor-not-allowed" : ""
              }`}
              disabled={formData.category?.toLowerCase() === "hollow"}
              value={formData.sellingPrice}
              onChange={(e) =>
                updateFormData({ sellingPrice: Number(e.target.value) })
              }
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500">
              {t("pos.note") || "Note"}
            </label>
            <textarea
              className="w-full border rounded p-2"
              rows={2}
              value={formData.note || ""}
              onChange={(e) => updateFormData({ note: e.target.value })}
              placeholder={t("pos.notePlaceholder") || "Enter product note..."}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onSave}
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t("inventory.saving") : t("inventory.save")}
          </button>
        </div>
      </div>
    </div>
  );
};
