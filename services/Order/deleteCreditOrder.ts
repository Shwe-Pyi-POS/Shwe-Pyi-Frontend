import axios from "../axios";

interface DeleteCreditOrderResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const deleteCreditOrder = async (
  orderId: string,
): Promise<DeleteCreditOrderResponse> => {
  try {
    const response = await axios.delete(`/order/${orderId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting credit order:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete credit order",
    };
  }
};
