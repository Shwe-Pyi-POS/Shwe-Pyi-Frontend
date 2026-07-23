import axios from "../axios";
import { UomConversion } from "../../types/uom";

export interface StorefrontStockInventory {
  _id: string;
  productName: string;
  productCode: string;
  SKU: string;
  category: string;
  profitMargin: number | null;
  profitAmount: number | null;
  sellingPrice?: number;
  unitOfMeasure?: string;
  uomConversions?: UomConversion[];
}

export interface StorefrontStockStorefront {
  _id: string;
  locationCode: string;
  locationName: string;
  // Legacy support
  storefrontCode?: string;
  storefrontName?: string;
}

export interface StorefrontStockItem {
  _id: string;
  storefrontId: StorefrontStockStorefront;
  inventoryId: StorefrontStockInventory;
  quantity: number;
  quantityByUnit?: Record<string, number>;
  isLowStock: boolean;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  availableQuantity: number;
}

interface FetchStorefrontStockResponse {
  success: boolean;
  message: string;
  data: StorefrontStockItem[];
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

export const fetchStorefrontStock = async (
  storefrontId?: string,
  page: number = 1,
  limit: number = 100,
  category?: string,
  search?: string,
): Promise<FetchStorefrontStockResponse> => {
  try {
    const params = new URLSearchParams();
    if (storefrontId) params.append("storefrontId", storefrontId);
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (category && category !== "all") params.append("category", category);
    if (search && search.trim()) params.append("search", search.trim());

    const url = `/storefront-inventory?${params.toString()}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching storefront stock:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch storefront stock",
      data: [],
      summary: {
        totalProducts: 0,
        totalQuantity: 0,
        totalAmount: 0,
      },
    };
  }
};
