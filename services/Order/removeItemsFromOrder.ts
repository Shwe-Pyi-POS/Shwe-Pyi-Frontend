import axios from "../axios";
import { Order } from "./fetchOrders";
import { AddItemToOrderRequest, AddItemsToOrderPayload } from "./addItemsToOrder";

export interface RemoveItemsFromOrderPayload {
  items: AddItemToOrderRequest[]; // Quantity should be negative
  subTotal: number;
  tax: number;
  discount: number;
  finalAmount: number;
  extraChange: number;
  paidAmount: number;
}

interface RemoveItemsFromOrderResponse {
  success: boolean;
  message: string;
  data?: Order;
}

export const removeItemsFromOrder = async (
  orderId: string,
  payload: RemoveItemsFromOrderPayload
): Promise<RemoveItemsFromOrderResponse> => {
  try {
    const response = await axios.patch(`/order/${orderId}/items/remove`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Error removing items from order:", error);

    if (axios.isAxiosError(error)) {
      if (
        error.response &&
        error.response.headers["content-type"] &&
        error.response.headers["content-type"].includes("text/html")
      ) {
        throw new Error(
          `API endpoint not found. Please check if the API is running and the endpoint "${error.config?.url}" is correct.`
        );
      }

      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `HTTP error! status: ${error.response.status}`;
        throw new Error(errorMessage);
      }

      if (error.request) {
        throw new Error(
          "Network error: Unable to reach the API. Please check if the API server is running."
        );
      }
    }

    throw error;
  }
};
