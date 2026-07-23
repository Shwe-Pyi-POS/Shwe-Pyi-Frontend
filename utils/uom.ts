import { UomConversion } from "../types/uom";

export function normalizeUnit(unit: string): string {
  return unit.trim();
}

export function getUnitOptions(
  baseUnit: string,
  conversions?: UomConversion[],
): { value: string; label: string; isBase: boolean }[] {
  const base = normalizeUnit(baseUnit) || "piece";
  const options: { value: string; label: string; isBase: boolean }[] = [
    { value: base, label: base, isBase: true },
  ];
  for (const c of conversions || []) {
    const u = normalizeUnit(c.unit);
    if (u && !options.some((o) => o.value === u)) {
      options.push({ value: u, label: u, isBase: false });
    }
  }
  return options;
}

export function hasUomConversions(conversions?: UomConversion[]): boolean {
  return (conversions?.length ?? 0) > 0;
}

export function getDefaultSellingUnit(
  baseUnit: string,
  conversions?: UomConversion[],
): string {
  const base = normalizeUnit(baseUnit) || "piece";
  const def = conversions?.find((c) => c.isDefaultSellingUnit);
  if (def?.unit?.trim()) return normalizeUnit(def.unit);
  return base;
}

export function getConversionFactor(
  baseUnit: string,
  selectedUnit: string,
  conversions?: UomConversion[],
): number {
  const base = normalizeUnit(baseUnit);
  const selected = normalizeUnit(selectedUnit);
  if (selected === base) return 1;
  const conv = conversions?.find((c) => normalizeUnit(c.unit) === selected);
  return conv?.factor ?? 1;
}

/** Price per one unit of `selectedUnit` (base price is per base unit). */
export function getUnitPrice(
  sellingPrice: number,
  baseUnit: string,
  selectedUnit: string,
  conversions?: UomConversion[],
): number {
  const factor = getConversionFactor(baseUnit, selectedUnit, conversions);
  if (
    normalizeUnit(selectedUnit) === normalizeUnit(baseUnit) ||
    factor <= 0
  ) {
    return sellingPrice;
  }
  return sellingPrice / factor;
}

export function getAvailableQuantityInUnit(
  baseUnit: string,
  selectedUnit: string,
  conversions: UomConversion[] | undefined,
  availableQuantity: number,
  quantityByUnit?: Record<string, number>,
): number {
  const selected = normalizeUnit(selectedUnit);
  if (quantityByUnit && selected in quantityByUnit) {
    return quantityByUnit[selected];
  }
  const factor = getConversionFactor(baseUnit, selectedUnit, conversions);
  if (normalizeUnit(selectedUnit) === normalizeUnit(baseUnit)) {
    return availableQuantity;
  }
  return availableQuantity * factor;
}

export function formatQuantityByUnit(
  quantityByUnit?: Record<string, number>,
): string {
  if (!quantityByUnit || Object.keys(quantityByUnit).length === 0) return "";
  return Object.entries(quantityByUnit)
    .map(([unit, qty]) => `${qty.toLocaleString()} ${unit}`)
    .join(" · ");
}

export function buildOrderProductLine(
  inventoryId: string,
  quantity: number,
  baseUnit: string,
  selectedUnit: string,
  buyingPrice?: number,
): { inventoryId: string; quantity: number; unit?: string; buyingPrice?: number } {
  return {
    inventoryId,
    quantity,
    unit: selectedUnit || baseUnit,
    ...(buyingPrice !== undefined ? { buyingPrice } : {}),
  };
}

export function validateUomConversions(
  baseUnit: string,
  conversions: UomConversion[],
): string | null {
  const base = normalizeUnit(baseUnit);
  if (!base) return "Unit of measure is required";

  const seen = new Set<string>();
  let hasDefault = false;

  for (const row of conversions) {
    const unit = normalizeUnit(row.unit);
    if (!unit) return "Each conversion unit must not be empty";
    if (row.factor <= 0) return "Conversion factor must be greater than 0";
    if (unit === base) {
      return "Conversion unit must not be the same as base unit of measure";
    }
    if (seen.has(unit)) return "Duplicate conversion unit names are not allowed";
    seen.add(unit);
    if (row.isDefaultSellingUnit) hasDefault = true;
  }

  if (conversions.length > 0 && !hasDefault) {
    return "At least one conversion must be marked as default selling unit";
  }

  return null;
}

export function cartLineKey(stockItemId: string, unit: string): string {
  return `${stockItemId}::${normalizeUnit(unit)}`;
}
