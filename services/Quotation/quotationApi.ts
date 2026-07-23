import axios from "../axios";
import {
  CreateQuotationPayload,
  Quotation,
  QuotationPagination,
  QuotationSummary,
  UpdateQuotationPayload,
} from "./quotationTypes";

export interface FetchQuotationsParams {
  status?: string;
  saleType?: string;
  customerName?: string;
  page?: number;
  limit?: number;
  startDate?: string | null;
  endDate?: string | null;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface FetchQuotationsResponse {
  success: boolean;
  message: string;
  data: {
    summary: QuotationSummary;
    quotations: Quotation[];
    pagination: QuotationPagination;
  };
}

interface QuotationResponse {
  success: boolean;
  message: string;
  data: Quotation;
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

export const createQuotation = async (
  data: CreateQuotationPayload,
): Promise<QuotationResponse> => {
  try {
    const response = await axios.post("/quotation", data);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      message: err.response?.data?.message || "Failed to create quotation",
      data: {} as Quotation,
    };
  }
};

export const fetchQuotations = async (
  params: FetchQuotationsParams = {},
): Promise<FetchQuotationsResponse> => {
  try {
    const response = await axios.get(
      `/quotation${buildQuery(params as Record<string, string | number | undefined | null>)}`,
    );
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      message: err.response?.data?.message || "Failed to fetch quotations",
      data: {
        summary: { totalQuotations: 0, totalAmount: 0, totalProducts: 0 },
        quotations: [],
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

export const fetchQuotationById = async (
  id: string,
): Promise<QuotationResponse> => {
  try {
    const response = await axios.get(`/quotation/${id}`);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      message: err.response?.data?.message || "Failed to fetch quotation",
      data: {} as Quotation,
    };
  }
};

export const updateQuotation = async (
  id: string,
  data: UpdateQuotationPayload,
): Promise<QuotationResponse> => {
  try {
    const response = await axios.patch(`/quotation/${id}`, data);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      message: err.response?.data?.message || "Failed to update quotation",
      data: {} as Quotation,
    };
  }
};

export const deleteQuotation = async (
  id: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.delete(`/quotation/${id}`);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      message: err.response?.data?.message || "Failed to delete quotation",
    };
  }
};

export const markQuotationAsConverted = async (
  id: string,
  convertedOrderId: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.patch(`/quotation/${id}/convert-to-order`, {
      convertedOrderId,
    });
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      message:
        err.response?.data?.message || "Failed to mark quotation as converted",
    };
  }
};
