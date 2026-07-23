import axios from "../axios";
import { Order } from "./fetchOrders";

interface FetchOrdersByStorefrontResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
    orders: Order[];
  } | null;
}

export const fetchOrdersByStorefront = async (
  storefrontId: string,
  startDate?: string | null,
  endDate?: string | null
): Promise<FetchOrdersByStorefrontResponse> => {
  try {
    let url = `/order?storefrontId=${storefrontId}`;
    const params = new URLSearchParams();

    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }

    if (params.toString()) {
      url += `&${params.toString()}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching orders by storefront:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch orders",
      data: null,
    };
  }
};
