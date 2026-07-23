import axios from "../axios";
import { Order } from "./fetchOrders";

interface FetchOrderByIdResponse {
  success: boolean;
  message: string;
  data: Order | null;
}

export const fetchOrderById = async (
  orderId: string
): Promise<FetchOrderByIdResponse> => {
  try {
    const response = await axios.get(`/order/${orderId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching order by ID:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch order",
      data: null,
    };
  }
};

