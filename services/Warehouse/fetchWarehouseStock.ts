import axios from "../axios";

export interface WarehouseStockInventory {
  _id: string;
  productName: string;
  productCode: string;
  SKU: string;
  barcode?: string;
  category: string;
  buyingPrice?: number;
  sellingPrice?: number;
  profitMargin: number | null;
  profitAmount: number | null;
}

export interface WarehouseStockWarehouse {
  _id: string;
  locationCode: string;
  locationName: string;
  locationAddress?: string;
  // Legacy support
  warehouseCode?: string;
  warehouseName?: string;
}

export interface WarehouseStockItem {
  _id: string;
  inventoryId: WarehouseStockInventory;
  warehouseId: WarehouseStockWarehouse;
  quantity: number;
  isLowStock: boolean;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  availableQuantity: number;
}

interface FetchWarehouseStockResponse {
  success: boolean;
  message: string;
  data: WarehouseStockItem[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  summary?: {
    totalProducts: number;
    totalQuantity: number;
    totalAmount: number;
  };
}

export const fetchWarehouseStock = async (
  warehouseId?: string,
  page: number = 1,
  limit: number = 100,
  category?: string,
  search?: string,
): Promise<FetchWarehouseStockResponse> => {
  try {
    const params = new URLSearchParams();
    if (warehouseId) params.append("warehouseId", warehouseId);
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (category && category !== "all") params.append("category", category);
    if (search && search.trim()) params.append("search", search.trim());

    const url = `/warehouse?${params.toString()}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching warehouse stock:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch warehouse stock",
      data: [],
      summary: {
        totalProducts: 0,
        totalQuantity: 0,
        totalAmount: 0,
      },
    };
  }
};
