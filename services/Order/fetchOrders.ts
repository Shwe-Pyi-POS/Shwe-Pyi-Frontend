import axios from "../axios";

export interface OrderProduct {
  inventoryId: {
    _id: string;
    productName: string;
    productCode: string;
    SKU: string;
    profitMargin: number | null;
    profitAmount: number | null;
    id?: string;
  };
  quantity: number;
  unit?: string;
  unitPrice: number;
  factor?: number;
  baseQuantity?: number;
  _id: string;
}

export interface OrderStorefront {
  _id: string;
  storefrontCode: string;
  storefrontName: string;
  locationCode?: string;
  locationName?: string;
  id?: string;
}

export interface SoldBy {
  _id: string;
  name: string;
  role: string;
}

export interface CreditPerson {
  _id: string;
  name: string;
  phone: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  saleType?: "storefront" | "direct-sale";
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  note?: string | null;
  storefrontId: OrderStorefront | null;
  ordersProducts: OrderProduct[];
  creditPersonId: CreditPerson | string | null;
  soldBy?: SoldBy;
  subTotal: number;
  tax: number;
  discount: number;
  finalAmount: number;
  paidAmount: number;
  extraChange: number;
  orderStatus: string;
  isDeleted: boolean;
  deletedAt: string | null;
  paymentType: "paid" | "credit" | string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  totalPaidAmount?: Record<string, unknown>;
  remainingBalance?: number;
  dueDate?: string | null;
  transportFee?: number;
  id?: string;
}

export interface OrderPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface FetchOrdersQueryOptions {
  page?: number;
  limit?: number;
  storefrontId?: string | null;
  paymentMethod?: string | null;
  creditPersonId?: string | null;
  saleType?: "storefront" | "direct-sale";
  /** Server-side search (e.g. product name) — GET /order?search=... */
  search?: string | null;
  /** Filter by buying price — GET /order?buyingPrice=... */
  buyingPrice?: number | null;
  /** Filter by unit price (selling price) — GET /order?unitPrice=... */
  unitPrice?: number | null;
  /** Filter by payment status — GET /order?paymentStatus=... */
  paymentStatus?: string | null;
}

export interface FetchOrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
  pagination?: OrderPagination;
}

export const fetchOrders = async (
  startDate?: string | null,
  endDate?: string | null,
  paymentType?: string | null,
  query?: FetchOrdersQueryOptions,
): Promise<FetchOrdersResponse> => {
  try {
    const params = new URLSearchParams();
    params.append("page", String(query?.page ?? 1));
    params.append("limit", String(query?.limit ?? 100));

    if (query?.saleType) {
      params.append("saleType", query.saleType);
    }

    if (paymentType && paymentType !== "all") {
      params.append("paymentType", paymentType);
    }

    if (query?.paymentStatus && query.paymentStatus !== "all") {
      params.append("paymentStatus", query.paymentStatus);
    }

    if (query?.paymentMethod && query.paymentMethod !== "all") {
      params.append("paymentMethod", query.paymentMethod);
    }

    if (query?.storefrontId) {
      params.append("storefrontId", query.storefrontId);
    }

    if (query?.creditPersonId) {
      params.append("creditPersonId", query.creditPersonId);
    }

    if (query?.search) {
      params.append("search", query.search);
    }

    if (query?.buyingPrice !== undefined && query?.buyingPrice !== null) {
      params.append("buyingPrice", String(query.buyingPrice));
    }

    if (query?.unitPrice !== undefined && query?.unitPrice !== null) {
      params.append("unitPrice", String(query.unitPrice));
    }

    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }

    const url = `/order?${params.toString()}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch orders",
      data: [],
    };
  }
};
