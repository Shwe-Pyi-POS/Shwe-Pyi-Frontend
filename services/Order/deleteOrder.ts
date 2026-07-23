import { toast } from "sonner";

interface DeleteOrderResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const deleteOrder = async (orderId: string): Promise<DeleteOrderResponse> => {
  try {
    const response = await fetch(`https://pos-backend.imas-pro.com/order/${orderId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      message: data.message || "Order deleted successfully",
      data: data.data,
    };
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return {
      success: false,
      message: error.message || "Failed to delete order",
    };
  }
};
