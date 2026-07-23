import { StorefrontStockItem } from "../services/Storefront/fetchStorefrontStock";
import {
  UomCartItem,
  createCartLine,
  getCartLineUnitPrice,
  getInventoryUomFromStock,
} from "./posCartUom";
import { buildOrderProductLine } from "./uom";

export interface DirectSaleCartItem extends UomCartItem {
  /** Editable selling price per selected unit (sent as unitPrice on order API). */
  unitPrice: number;
}

export function createDirectSaleCartLine(
  stockItem: StorefrontStockItem,
  qty = 1,
): DirectSaleCartItem {
  const line = createCartLine(stockItem, qty);
  return {
    ...line,
    unitPrice: getCartLineUnitPrice(line),
  };
}

export function getCatalogUnitPrice(item: UomCartItem): number {
  return getCartLineUnitPrice(item);
}

export function applyCatalogUnitPrice(item: DirectSaleCartItem): DirectSaleCartItem {
  return {
    ...item,
    unitPrice: getCatalogUnitPrice(item),
  };
}

export function directSaleCartSubtotal(item: DirectSaleCartItem): number {
  return item.unitPrice * item.qty;
}

export function directSaleLineToOrderProduct(item: DirectSaleCartItem) {
  const { baseUnit } = getInventoryUomFromStock(item.stockItem);
  return {
    ...buildOrderProductLine(
      item.stockItem.inventoryId._id,
      item.qty,
      baseUnit,
      item.selectedUnit,
      item.stockItem.inventoryId.buyingPrice,
    ),
    unitPrice: item.unitPrice,
  };
}
