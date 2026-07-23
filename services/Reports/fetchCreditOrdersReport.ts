import axios from "../axios";

export interface CreditOrdersStorefront {
  _id: string;
  locationName: string;
  locationCode: string;
}

export interface CreditOrdersDateRange {
  startDate: string | null;
  endDate: string | null;
}

export interface CreditOrdersTotals {
  totalFinalAmount: number;
  totalPaidAmount: number;
  totalInitialPaidAmount: number;
  totalCreditPaidAmount: number;
  totalRemainingBalance: number;
  orderCount: number;
  creditRecordCount: number;
}

export interface InitialPaymentData {
  paymentMethod: string;
  totalPaidAmount: number;
  orderCount: number;
}

export interface CreditPaymentData {
  paymentMethod: string;
  totalPaidAmount: number;
  recordCount: number;
}

export interface CreditOrdersReportResponse {
  success: boolean;
  message: string;
  data: {
    storefront: CreditOrdersStorefront;
    dateRange: CreditOrdersDateRange;
    totals: CreditOrdersTotals;
    initialPayments: InitialPaymentData[];
    creditPayments: CreditPaymentData[];
  };
}

/**
 * Fetch credit orders report for a specific storefront
 * @param {string} storefrontId - The ID of the storefront
 * @param {string | null} startDate - Start date in YYYY-MM-DD format
 * @param {string | null} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<CreditOrdersReportResponse>} Response from API
 */
export const fetchCreditOrdersReport = async (
  storefrontId: string,
  startDate?: string | null,
  endDate?: string | null,
  saleType?: string | null
): Promise<CreditOrdersReportResponse> => {
  try {
    let url = `/sale-report/credit-orders?storefrontId=${storefrontId}`;
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
    console.error("Error fetching credit orders report:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch credit orders report",
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
          totalFinalAmount: 0,
          totalPaidAmount: 0,
          totalInitialPaidAmount: 0,
          totalCreditPaidAmount: 0,
          totalRemainingBalance: 0,
          orderCount: 0,
          creditRecordCount: 0,
        },
        initialPayments: [],
        creditPayments: [],
      },
    };
  }
};

/**
 * Fetch credit orders report for all storefronts
 * @param {string | null} startDate - Start date in YYYY-MM-DD format
 * @param {string | null} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<CreditOrdersReportResponse>} Response from API
 */
export const fetchAllStorefrontsCreditOrdersReport = async (
  startDate?: string | null,
  endDate?: string | null,
  saleType?: string | null
): Promise<CreditOrdersReportResponse> => {
  try {
    let url = `/sale-report/credit-orders`;
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
      "Error fetching all storefronts credit orders report:",
      error
    );
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to fetch all storefronts credit orders report",
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
          totalFinalAmount: 0,
          totalPaidAmount: 0,
          totalInitialPaidAmount: 0,
          totalCreditPaidAmount: 0,
          totalRemainingBalance: 0,
          orderCount: 0,
          creditRecordCount: 0,
        },
        initialPayments: [],
        creditPayments: [],
      },
    };
  }
};
