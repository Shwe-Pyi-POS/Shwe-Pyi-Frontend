import axios from "../axios";
import { Order, OrderPagination } from "./fetchOrders";

export interface FetchDirectSaleOrdersQueryOptions {
  page?: number;
  limit?: number;
  paymentType?: string | null;
  paymentMethod?: string | null;
}

export interface FetchDirectSaleOrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
  pagination?: OrderPagination;
}

export const fetchDirectSaleOrders = async (
  startDate?: string | null,
  endDate?: string | null,
  paymentType?: string | null,
  paymentMethod?: string | null,
  query?: FetchDirectSaleOrdersQueryOptions,
): Promise<FetchDirectSaleOrdersResponse> => {
  try {
    const params = new URLSearchParams();
    params.append("saleType", "direct-sale");
    params.append("page", String(query?.page ?? 1));
    params.append("limit", String(query?.limit ?? 100));

    if (paymentType && paymentType !== "all") {
      params.append("paymentType", paymentType);
    }
    if (paymentMethod && paymentMethod !== "all") {
      params.append("paymentMethod", paymentMethod);
    }
    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }

    const response = await axios.get(`/order?${params.toString()}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error fetching direct sale orders:", error);
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      message:
        err.response?.data?.message || "Failed to fetch direct sale orders",
      data: [],
    };
  }
};
