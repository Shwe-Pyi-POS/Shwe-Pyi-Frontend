import axios from "../axios";

export interface PaidOrdersStorefront {
  _id: string;
  locationName: string;
  locationCode: string;
}

export interface PaidOrdersDateRange {
  startDate: string | null;
  endDate: string | null;
}

export interface PaidOrdersTotals {
  totalPaidAmount: number;
  totalFinalAmount: number;
  totalOrderCount: number;
}

export interface PaymentMethodData {
  paymentMethod: string;
  totalPaidAmount: number;
  totalFinalAmount: number;
  orderCount: number;
}

export interface PaidOrdersReportResponse {
  success: boolean;
  message: string;
  data: {
    storefront: PaidOrdersStorefront;
    dateRange: PaidOrdersDateRange;
    totals: PaidOrdersTotals;
    paymentMethods: PaymentMethodData[];
  };
}

/**
 * Fetch paid orders report for a specific storefront
 * @param {string} storefrontId - The ID of the storefront
 * @param {string | null} startDate - Start date in YYYY-MM-DD format
 * @param {string | null} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<PaidOrdersReportResponse>} Response from API
 */
export const fetchPaidOrdersReport = async (
  storefrontId: string,
  startDate?: string | null,
  endDate?: string | null,
  saleType?: string | null,
): Promise<PaidOrdersReportResponse> => {
  console.log(startDate, endDate, saleType);
  try {
    let url = `/sale-report/paid-orders?storefrontId=${storefrontId}`;
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
    console.error("Error fetching paid orders report:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch paid orders report",
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
          totalPaidAmount: 0,
          totalFinalAmount: 0,
          totalOrderCount: 0,
        },
        paymentMethods: [],
      },
    };
  }
};

/**
 * Fetch paid orders report for all storefronts
 * @param {string | null} startDate - Start date in YYYY-MM-DD format
 * @param {string | null} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<PaidOrdersReportResponse>} Response from API
 */
export const fetchAllStorefrontsPaidOrdersReport = async (
  startDate?: string | null,
  endDate?: string | null,
  saleType?: string | null,
): Promise<PaidOrdersReportResponse> => {
  try {
    let url = `/sale-report/paid-orders`;
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
    console.error("Error fetching all storefronts paid orders report:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to fetch all storefronts paid orders report",
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
          totalPaidAmount: 0,
          totalFinalAmount: 0,
          totalOrderCount: 0,
        },
        paymentMethods: [],
      },
    };
  }
};
