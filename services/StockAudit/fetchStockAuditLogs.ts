import axios from "../axios";

export interface InventoryInfo {
  _id: string;
  productName: string;
  productCode: string;
  SKU: string;
  category: string;
  profitMargin: number | null;
  profitAmount: number | null;
}

export interface AdminInfo {
  _id: string;
  name: string;
  role: string;
}

export interface LocationInfo {
  _id: string;
  locationCode: string;
  locationName: string;
}

export interface StockAuditLog {
  _id: string;
  inventoryId: InventoryInfo;
  adminId: AdminInfo;
  locationId: LocationInfo;
  locationType: "warehouse" | "storefront" | string;
  stockRecordId: string;
  beforeQuantity: number;
  afterQuantity: number;
  quantityChange: number;
  action: string;
  reason: string | null;
  relatedTransactionId: string | null;
  relatedTransactionType: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
  isIncrease: boolean;
  isDecrease: boolean;
}

interface Pagination {
  currentPage: string | number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: string | number;
}

interface FetchStockAuditLogsResponse {
  success: boolean;
  message: string;
  data: StockAuditLog[];
  pagination: Pagination;
}

export const fetchStockAuditLogs = async (
  page: number = 1,
  limit: number = 10,
): Promise<FetchStockAuditLogsResponse> => {
  try {
    const response = await axios.get(
      `/stock-audit-logs?page=${page}&limit=${limit}`,
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching stock audit logs:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch stock audit logs",
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
      },
    };
  }
};
