import axios from "../axios";

export interface SaleReportStorefront {
  _id: string;
  locationName: string;
  locationCode: string;
}

export interface SaleReportDateRange {
  startDate: string | null;
  endDate: string | null;
}

export interface SaleReportData {
  finalAmount: number;
  paidAmount: number;
  subTotal: number;
  tax: number;
  discount: number;
  transportFee: number;
  extraChange: number;
  orderCount: number;
  creditOrderCount: number;
  paidOrderCount: number;
}

export interface SaleReportResponse {
  success: boolean;
  message: string;
  data: {
    storefront: SaleReportStorefront;
    dateRange: SaleReportDateRange;
    report: SaleReportData;
  };
}

/**
 * Fetch sale report for a specific storefront
 * @param {string} storefrontId - The ID of the storefront
 * @param {string | null} startDate - Start date in YYYY-MM-DD format
 * @param {string | null} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<SaleReportResponse>} Response from API
 */
export const fetchSaleReport = async (
  storefrontId: string,
  startDate?: string | null,
  endDate?: string | null,
  saleType?: string | null,
): Promise<SaleReportResponse> => {
  try {
    let url = `/sale-report?storefrontId=${storefrontId}`;
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
    console.error("Error fetching sale report:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch sale report",
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
        report: {
          finalAmount: 0,
          paidAmount: 0,
          subTotal: 0,
          tax: 0,
          discount: 0,
          transportFee: 0,
          extraChange: 0,
          orderCount: 0,
          creditOrderCount: 0,
          paidOrderCount: 0,
        },
      },
    };
  }
};

/**
 * Fetch sale report for all storefronts
 * @param {string | null} startDate - Start date in YYYY-MM-DD format
 * @param {string | null} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<SaleReportResponse>} Response from API
 */
export const fetchAllStorefrontsSaleReport = async (
  startDate?: string | null,
  endDate?: string | null,
  saleType?: string | null,
): Promise<SaleReportResponse> => {
  try {
    let url = `/sale-report`;
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
    console.error("Error fetching all storefronts sale report:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to fetch all storefronts sale report",
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
        report: {
          finalAmount: 0,
          paidAmount: 0,
          subTotal: 0,
          tax: 0,
          discount: 0,
          transportFee: 0,
          extraChange: 0,
          orderCount: 0,
          creditOrderCount: 0,
          paidOrderCount: 0,
        },
      },
    };
  }
};
