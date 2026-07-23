import axios from "../axios";

export interface CreditPersonSales {
  creditPersonId: string;
  totalQuantity: number;
  orderCount: number;
  name: string;
  phone: string;
}

export interface ProductsByCreditPersonData {
  creditPersons: CreditPersonSales[];
  totalQuantity: number;
  totalOrders: number;
  uniqueCreditPersonsCount: number;
  inventoryId: string;
  productName: string;
  productCode: string;
  SKU: string;
  unitOfMeasure: string;
  category: string;
  subCategory: string;
  brand: string;
}

export interface ProductsByCreditPersonResponse {
  success: boolean;
  message: string;
  data: {
    storefront: any;
    dateRange: {
      startDate: string | null;
      endDate: string | null;
    };
    totals: {
      totalQuantity: number;
      totalOrders: number;
      totalUniqueProducts: number;
      totalUniqueCreditPersons: number;
    };
    products: ProductsByCreditPersonData[];
  };
}

/**
 * Fetch products and their credit person analytics
 * @param {string} inventoryId - Optional inventory ID to filter
 * @param {string | null} startDate - Start date in YYYY-MM-DD format
 * @param {string | null} endDate - End date in YYYY-MM-DD format
 * @param {string} storefrontId - Optional storefront ID
 * @returns {Promise<ProductsByCreditPersonResponse>} Response from API
 */
export const fetchProductsByCreditPerson = async (
  inventoryId?: string,
  startDate?: string | null,
  endDate?: string | null,
  storefrontId?: string
): Promise<ProductsByCreditPersonResponse> => {
  try {
    const params = new URLSearchParams();

    if (inventoryId) {
      params.append("inventoryId", inventoryId);
    }
    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }
    if (storefrontId && storefrontId !== "all") {
      params.append("storefrontId", storefrontId);
    }

    const url = `/sale-report/products-by-credit-person?${params.toString()}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching products by credit person:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to fetch products by credit person",
      data: {
        storefront: null,
        dateRange: {
          startDate: null,
          endDate: null,
        },
        totals: {
          totalQuantity: 0,
          totalOrders: 0,
          totalUniqueProducts: 0,
          totalUniqueCreditPersons: 0,
        },
        products: [],
      },
    };
  }
};
