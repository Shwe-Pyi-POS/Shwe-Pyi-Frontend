import axios from "../axios";

export interface ProductSalesData {
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  minUnitPrice: number;
  maxUnitPrice: number;
  inventoryId: string;
  productName: string;
  productCode: string;
  SKU: string;
  category: string;
  subCategory: string;
  brand: string;
  unitOfMeasure: string;
  averageUnitPrice: number;
  buyingPrice?: number;
}

export interface ProductSalesStatisticsResponse {
  success: boolean;
  message: string;
  data: {
    storefront: {
      _id: string;
      locationName: string;
      locationCode: string;
    };
    dateRange: {
      startDate: string | null;
      endDate: string | null;
    };
    totals: {
      totalQuantity: number;
      totalRevenue: number;
      totalUniqueProducts: number;
      totalBuyingCost?: number;
      totalProfit?: number;
    };
    products: ProductSalesData[];
  };
}

/**
 * Fetch product sales statistics for a specific storefront
 * @param {string} storefrontId - The ID of the storefront
 * @param {string | null} startDate - Start date in YYYY-MM-DD format
 * @param {string | null} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<ProductSalesStatisticsResponse>} Response from API
 */
export const fetchProductSalesStatistics = async (
  storefrontId: string,
  startDate?: string | null,
  endDate?: string | null,
  saleType?: string | null,
): Promise<ProductSalesStatisticsResponse> => {
  try {
    let url = `/sale-report/products?storefrontId=${storefrontId}`;
    const params = new URLSearchParams();

    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }
    if (saleType) {
      params.append("saleType", saleType);
    }

    if (params.toString()) {
      url += `&${params.toString()}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching product sales statistics:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to fetch product sales statistics",
      data: {
        storefront: {
          _id: storefrontId,
          locationName: "Unknown",
          locationCode: "N/A",
        },
        dateRange: {
          startDate: null,
          endDate: null,
        },
        totals: {
          totalQuantity: 0,
          totalRevenue: 0,
          totalUniqueProducts: 0,
          totalBuyingCost: 0,
          totalProfit: 0,
        },
        products: [],
      },
    };
  }
};

/**
 * Fetch product sales statistics for all storefronts
 * @param {string | null} startDate - Start date in YYYY-MM-DD format
 * @param {string | null} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<ProductSalesStatisticsResponse>} Response from API
 */
export const fetchAllStorefrontsProductSalesStatistics = async (
  startDate?: string | null,
  endDate?: string | null,
  saleType?: string | null,
): Promise<ProductSalesStatisticsResponse> => {
  try {
    let url = `/sale-report/products`;
    const params = new URLSearchParams();

    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }
    if (saleType) {
      params.append("saleType", saleType);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error(
      "Error fetching all storefronts product sales statistics:",
      error
    );
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to fetch all storefronts product sales statistics",
      data: {
        storefront: {
          _id: "all",
          locationName: "All Storefronts",
          locationCode: "ALL",
        },
        dateRange: {
          startDate: null,
          endDate: null,
        },
        totals: {
          totalQuantity: 0,
          totalRevenue: 0,
          totalUniqueProducts: 0,
          totalBuyingCost: 0,
          totalProfit: 0,
        },
        products: [],
      },
    };
  }
};
