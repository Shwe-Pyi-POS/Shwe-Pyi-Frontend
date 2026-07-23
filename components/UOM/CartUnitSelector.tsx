import React from "react";
import { UomConversion } from "../../types/uom";
import { getUnitOptions } from "../../utils/uom";

interface CartUnitSelectorProps {
  baseUnit: string;
  conversions?: UomConversion[];
  selectedUnit: string;
  onUnitChange: (unit: string) => void;
  className?: string;
  disabled?: boolean;
}

export const CartUnitSelector: React.FC<CartUnitSelectorProps> = ({
  baseUnit,
  conversions,
  selectedUnit,
  onUnitChange,
  className = "",
  disabled = false,
}) => {
  const options = getUnitOptions(baseUnit, conversions);
  if (options.length <= 1) return null;

  return (
    <select
      disabled={disabled}
      className={`text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-primary outline-none disabled:bg-slate-100 disabled:cursor-not-allowed ${className}`}
      value={selectedUnit}
      onChange={(e) => onUnitChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};
