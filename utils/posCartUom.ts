import { StorefrontStockItem } from "../services/Storefront/fetchStorefrontStock";
import {
  buildOrderProductLine,
  cartLineKey,
  getAvailableQuantityInUnit,
  getDefaultSellingUnit,
  getUnitPrice,
} from "./uom";

export interface UomCartItem {
  stockItem: StorefrontStockItem;
  qty: number;
  selectedUnit: string;
}

export function getInventoryUomFromStock(stockItem: StorefrontStockItem) {
  const inv = stockItem.inventoryId;
  return {
    baseUnit: inv.unitOfMeasure?.trim() || "piece",
    conversions: inv.uomConversions,
  };
}

export function createCartLine(
  stockItem: StorefrontStockItem,
  qty = 1,
): UomCartItem {
  const { baseUnit, conversions } = getInventoryUomFromStock(stockItem);
  return {
    stockItem,
    qty,
    selectedUnit: getDefaultSellingUnit(baseUnit, conversions),
  };
}

export function getCartLineId(item: UomCartItem): string {
  return cartLineKey(item.stockItem._id, item.selectedUnit);
}

export function getCartLineUnitPrice(item: UomCartItem): number {
  const { baseUnit, conversions } = getInventoryUomFromStock(item.stockItem);
  return getUnitPrice(
    item.stockItem.inventoryId.sellingPrice || 0,
    baseUnit,
    item.selectedUnit,
    conversions,
  );
}

export function getCartLineMaxQty(item: UomCartItem): number {
  const { baseUnit, conversions } = getInventoryUomFromStock(item.stockItem);
  return getAvailableQuantityInUnit(
    baseUnit,
    item.selectedUnit,
    conversions,
    item.stockItem.availableQuantity,
    item.stockItem.quantityByUnit,
  );
}

export function cartLineToOrderProduct(item: UomCartItem) {
  const { baseUnit } = getInventoryUomFromStock(item.stockItem);
  return buildOrderProductLine(
    item.stockItem.inventoryId._id,
    item.qty,
    baseUnit,
    item.selectedUnit,
  );
}

export function cartLineSubtotal(item: UomCartItem): number {
  return getCartLineUnitPrice(item) * item.qty;
}
