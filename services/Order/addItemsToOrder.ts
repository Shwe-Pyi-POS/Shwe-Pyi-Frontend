import axios from "../axios";
import { Order } from "./fetchOrders";

export interface AddItemToOrderRequest {
  inventoryId: string;
  quantity: number;
  unit?: string;
}

export interface AddItemsToOrderPayload {
  items: AddItemToOrderRequest[];
  subTotal: number;
  tax: number;
  discount: number;
  finalAmount: number;
  extraChange: number;
  paidAmount: number;
}

interface AddItemsToOrderResponse {
  success: boolean;
  message: string;
  data?: Order;
}

export const addItemsToOrder = async (
  orderId: string,
  payload: AddItemsToOrderPayload
): Promise<AddItemsToOrderResponse> => {
  try {
    const response = await axios.patch(`/order/${orderId}/items/add`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Error adding items to order:", error);

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
