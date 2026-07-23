import axios from "../axios";
import { Order } from "./fetchOrders";

interface FetchCreditOrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
}

export const fetchCreditOrders = async (
  startDate?: string | null,
  endDate?: string | null,
  paymentMethod?: string | null,
  dueDays?: number | null,
): Promise<FetchCreditOrdersResponse> => {
  try {
    let url = "/order?saleType=storefront&";
    const params = new URLSearchParams();

    // Add paymentType=credit to query params
    params.append("paymentType", "credit");

    // Add paymentMethod filter only if it's not "all", not null, and not empty
    if (
      paymentMethod &&
      paymentMethod !== "all" &&
      paymentMethod.trim() !== ""
    ) {
      params.append("paymentMethod", paymentMethod);
    }

    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }

    if (dueDays != null && dueDays > 0) {
      params.append("dueDays", String(dueDays));
    }

    if (params.toString()) {
      url += `${params.toString()}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching credit orders:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch credit orders",
      data: [],
    };
  }
};
