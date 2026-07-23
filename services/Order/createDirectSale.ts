import axios from "../axios";

export interface DirectSaleOrderProduct {
  inventoryId: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
}

export interface CreateDirectSaleRequest {
  saleType: "direct-sale";
  customerName?: string;
  customerPhone?: string;
  note?: string;
  ordersProducts: DirectSaleOrderProduct[];
  subTotal?: number;
  tax?: number;
  discount?: number;
  finalAmount?: number;
  paidAmount: number;
  extraChange: number;
  paymentType: "credit" | "paid";
  paymentMethod: string;
  orderDate?: string;
  transportFee?: number;
}

interface CreateDirectSaleResponse {
  success: boolean;
  message: string;
  data?: {
    orderNumber?: string;
    [key: string]: unknown;
  };
}

export const createDirectSale = async (
  data: CreateDirectSaleRequest,
): Promise<CreateDirectSaleResponse> => {
  try {
    const response = await axios.post("/order", data);
    return response.data;
  } catch (error: unknown) {
    console.error("Error creating direct sale:", error);
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      message: err.response?.data?.message || "Failed to create direct sale",
    };
  }
};
