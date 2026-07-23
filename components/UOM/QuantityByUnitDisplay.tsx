import React from "react";
import { formatQuantityByUnit } from "../../utils/uom";

interface QuantityByUnitDisplayProps {
  quantity: number;
  quantityByUnit?: Record<string, number>;
  className?: string;
}

export const QuantityByUnitDisplay: React.FC<QuantityByUnitDisplayProps> = ({
  quantity,
  quantityByUnit,
  className = "",
}) => {
  const breakdown = formatQuantityByUnit(quantityByUnit);
  return (
    <span className={className} title={breakdown || undefined}>
      {quantity.toLocaleString()}
      {breakdown ? (
        <span className="block text-[10px] text-slate-500 font-normal mt-0.5 max-w-[140px] truncate">
          {breakdown}
        </span>
      ) : null}
    </span>
  );
};
