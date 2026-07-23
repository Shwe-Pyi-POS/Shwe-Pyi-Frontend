import { UomConversion } from "../../types/uom";

export type QuotationStatus = "draft" | "converted" | "cancelled";
export type QuotationSaleType = "storefront" | "direct-sale";

export interface QuotationProductInput {
  inventoryId: string;
  unit?: string;
  quantity: number;
}

export interface QuotationProduct {
  inventoryId: string | {
    _id: string;
    productName: string;
    productCode: string;
    SKU?: string;
    sellingPrice?: number;
    unitOfMeasure?: string;
    uomConversions?: UomConversion[];
  };
  productName?: string;
  productCode?: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  factor?: number;
  baseQuantity?: number;
  lineTotal?: number;
}

export interface QuotationStorefrontRef {
  _id: string;
  locationName?: string;
  locationCode?: string;
  storefrontName?: string;
  storefrontCode?: string;
}

export interface QuotationCreatedBy {
  _id: string;
  name: string;
  role?: string;
}

export interface Quotation {
  _id: string;
  quotationNumber: string;
  saleType: QuotationSaleType;
  storefrontId?: QuotationStorefrontRef | string | null;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  products: QuotationProduct[];
  ordersProducts?: QuotationProduct[];
  subTotal: number;
  tax: number;
  discount: number;
  finalAmount: number;
  status: QuotationStatus;
  convertedOrderId?: string | { _id: string; orderNumber?: string };
  createdBy?: QuotationCreatedBy;
  createdAt: string;
  updatedAt?: string;
}

export interface QuotationSummary {
  totalQuotations: number;
  totalAmount: number;
  totalProducts: number;
}

export interface QuotationPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface CreateQuotationPayload {
  saleType: QuotationSaleType;
  storefrontId?: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  ordersProducts: QuotationProductInput[];
  subTotal?: number;
  tax?: number;
  discount?: number;
  finalAmount?: number;
}

export interface UpdateQuotationPayload {
  customerName?: string;
  customerPhone?: string;
  note?: string;
  saleType?: QuotationSaleType;
  storefrontId?: string;
  products?: QuotationProductInput[];
  ordersProducts?: QuotationProductInput[];
  subTotal?: number;
  tax?: number;
  discount?: number;
  finalAmount?: number;
  status?: QuotationStatus;
}

export const getQuotationProducts = (q: Quotation): QuotationProduct[] =>
  q.products?.length ? q.products : q.ordersProducts || [];

export const resolveInventoryId = (
  inv: QuotationProduct["inventoryId"],
): string =>
  typeof inv === "string" ? inv : inv._id;
