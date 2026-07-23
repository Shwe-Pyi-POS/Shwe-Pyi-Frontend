import axios from "../axios";

export interface ReportPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface ReportDateRange {
  startDate: string | null;
  endDate: string | null;
}

export interface POStatusBreakdown {
  pending: number;
  confirmed: number;
  arrived: number;
  completed: number;
  cancelled: number;
}

export interface PurchaseReportSummary {
  totalPOs: number;
  totalAmount: number;
  totalProductsOrdered: number;
  totalReceived: number;
  totalRemaining: number;
  statusBreakdown: POStatusBreakdown;
}

export interface PurchaseReportProductLine {
  inventoryId: string;
  productName: string;
  productCode: string;
  purchaseQuantity: number;
  receivedQuantity: number;
  buyingPrice: number;
  remainingQuantity: number;
}

export interface PurchaseReportSupplierRef {
  _id: string;
  supplierName: string;
  supplierCode?: string;
  contactNumber?: string;
}

export interface PurchaseReportPurchasedBy {
  _id: string;
  name: string;
  role: string;
}

export interface PurchaseReportPurchase {
  _id: string;
  poNumber: string;
  supplierId: PurchaseReportSupplierRef | string;
  status: string;
  totalAmount: number;
  products: PurchaseReportProductLine[];
  purchasedBy?: PurchaseReportPurchasedBy;
  totalRemainingQuantity?: number;
  createdAt?: string;
}

export interface PurchaseReportResponse {
  success: boolean;
  message: string;
  data: {
    dateRange: ReportDateRange;
    summary: PurchaseReportSummary;
    purchases: PurchaseReportPurchase[];
    pagination: ReportPagination;
  };
}

export interface PurchaseProductReportTotals {
  totalOrdered: number;
  totalReceived: number;
  totalRemaining: number;
  totalAmount: number;
  uniqueProducts: number;
}

export interface PurchaseProductReportItem {
  inventoryId: string;
  productName: string;
  productCode: string;
  category: string;
  subCategory: string;
  brand: string;
  unitOfMeasure: string;
  totalOrdered: number;
  totalReceived: number;
  totalRemaining: number;
  totalAmount: number;
  poCount: number;
}

export interface PurchaseProductReportResponse {
  success: boolean;
  message: string;
  data: {
    dateRange: ReportDateRange;
    totals: PurchaseProductReportTotals;
    products: PurchaseProductReportItem[];
    pagination: ReportPagination;
  };
}

export interface PurchaseSupplierReportTotals {
  totalSuppliers: number;
  totalPOs: number;
  totalAmount: number;
  totalOrdered: number;
  totalReceived: number;
  totalRemaining: number;
}

export interface PurchaseSupplierReportItem {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  contactNumber: string;
  totalPOs: number;
  totalAmount: number;
  totalOrdered: number;
  totalReceived: number;
  totalRemaining: number;
  lastPODate: string | null;
}

export interface PurchaseSupplierReportResponse {
  success: boolean;
  message: string;
  data: {
    dateRange: ReportDateRange;
    totals: PurchaseSupplierReportTotals;
    suppliers: PurchaseSupplierReportItem[];
    pagination: ReportPagination;
  };
}

export interface PurchaseReportQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  supplierId?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface PurchaseProductReportQueryParams {
  page?: number;
  limit?: number;
  supplierId?: string;
  category?: string;
  startDate?: string | null;
  endDate?: string | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PurchaseSupplierReportQueryParams {
  page?: number;
  limit?: number;
  startDate?: string | null;
  endDate?: string | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const buildQuery = (params: Record<string, string | number | undefined | null>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

export const fetchPurchaseReport = async (
  params: PurchaseReportQueryParams = {},
): Promise<PurchaseReportResponse> => {
  try {
    const response = await axios.get(
      `/purchase-report${buildQuery(params as Record<string, string | number | undefined | null>)}`,
    );
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching purchase report:", error);
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      message: err.response?.data?.message || "Failed to fetch purchase report",
      data: {
        dateRange: { startDate: null, endDate: null },
        summary: {
          totalPOs: 0,
          totalAmount: 0,
          totalProductsOrdered: 0,
          totalReceived: 0,
          totalRemaining: 0,
          statusBreakdown: {
            pending: 0,
            confirmed: 0,
            arrived: 0,
            completed: 0,
            cancelled: 0,
          },
        },
        purchases: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
        },
      },
    };
  }
};

export const fetchPurchaseProductReport = async (
  params: PurchaseProductReportQueryParams = {},
): Promise<PurchaseProductReportResponse> => {
  try {
    const response = await axios.get(
      `/purchase-report/products${buildQuery(params as Record<string, string | number | undefined | null>)}`,
    );
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching purchase product report:", error);
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      message:
        err.response?.data?.message || "Failed to fetch purchase product report",
      data: {
        dateRange: { startDate: null, endDate: null },
        totals: {
          totalOrdered: 0,
          totalReceived: 0,
          totalRemaining: 0,
          totalAmount: 0,
          uniqueProducts: 0,
        },
        products: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
        },
      },
    };
  }
};

export const fetchPurchaseSupplierReport = async (
  params: PurchaseSupplierReportQueryParams = {},
): Promise<PurchaseSupplierReportResponse> => {
  try {
    const response = await axios.get(
      `/purchase-report/suppliers${buildQuery(params as Record<string, string | number | undefined | null>)}`,
    );
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching purchase supplier report:", error);
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      message:
        err.response?.data?.message ||
        "Failed to fetch purchase supplier report",
      data: {
        dateRange: { startDate: null, endDate: null },
        totals: {
          totalSuppliers: 0,
          totalPOs: 0,
          totalAmount: 0,
          totalOrdered: 0,
          totalReceived: 0,
          totalRemaining: 0,
        },
        suppliers: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10,
        },
      },
    };
  }
};
