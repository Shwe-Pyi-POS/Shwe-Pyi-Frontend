import axios from "../axios";

interface OrderProduct {
  inventoryId: string;
  quantity: number;
  unit?: string;
}

interface CreateOrderRequest {
  saleType?: "storefront" | "direct-sale";
  storefrontId?: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  ordersProducts: OrderProduct[];
  subTotal?: number;
  tax?: number;
  discount?: number;
  transportFee?: number;
  finalAmount?: number;
  paidAmount: number;
  paymentType: "credit" | "paid";
  paymentMethod: string;
  creditPersonId?: string;
}

interface CreateOrderResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const createOrder = async (
  data: CreateOrderRequest
): Promise<CreateOrderResponse> => {
  try {
    const response = await axios.post("/order", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating order:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create order",
    };
  }
};

