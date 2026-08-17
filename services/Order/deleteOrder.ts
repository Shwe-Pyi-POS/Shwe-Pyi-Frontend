import axios from "../axios";

interface DeleteOrderResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const deleteOrder = async (orderId: string): Promise<DeleteOrderResponse> => {
  try {
    const response = await axios.delete(`/order/${orderId}`);
    return {
      success: true,
      message: response.data?.message || "Order deleted successfully",
      data: response.data?.data,
    };
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return {
      success: false,
      message: error.response?.data?.message || error.message || "Failed to delete order",
    };
  }
};
