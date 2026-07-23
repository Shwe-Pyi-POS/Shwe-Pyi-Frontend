import axios from "../axios";

export interface StorefrontTransferLineItem {
  productCode: string;
  quantity: number;
  notes?: string;
}

export interface CreateStorefrontToWarehouseTransferPayload {
  sourceType: "Storefront";
  sourceStorefrontId: string;
  destinationWarehouseId: string;
  lineItems: StorefrontTransferLineItem[];
  transferDate?: string;
  notes?: string;
}

interface CreateStorefrontToWarehouseTransferResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const createStorefrontToWarehouseTransfer = async (
  payload: CreateStorefrontToWarehouseTransferPayload
): Promise<CreateStorefrontToWarehouseTransferResponse> => {
  try {
    const response = await axios.post("/transfer", payload);
    return {
      success: true,
      message: "Transfer created successfully",
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error creating storefront to warehouse transfer:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to create transfer",
    };
  }
};
