import React from "react";
import { Product } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

interface CategoryFilterProps {
  products: Product[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  filteredCount: number;
  totalCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  products,
  selectedCategory,
  onCategoryChange,
  filteredCount,
  totalCount,
}) => {
  const { t } = useLanguage();

  const getUniqueCategories = (): string[] => {
    const categories = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        categories.add(p.category);
      }
    });
    return Array.from(categories).sort();
  };

  if (products.length === 0) return null;

  return (
    <div className="mb-4 flex items-center gap-4">
      <label className="text-sm font-medium text-slate-700">
        {t("inventory.filterByCategory")}:
      </label>
      <select
        className="border rounded-lg px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-primary outline-none"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="All">{t("inventory.allCategories")}</option>
        {getUniqueCategories().map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <span className="text-sm text-slate-500">
        {t("inventory.showing")
          .replace("{count}", filteredCount.toString())
          .replace("{total}", totalCount.toString())}
      </span>
    </div>
  );
};

