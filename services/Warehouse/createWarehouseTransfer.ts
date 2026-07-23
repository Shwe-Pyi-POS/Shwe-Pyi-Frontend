import axios from "../axios";

export interface TransferLineItem {
  productCode: string;
  quantity: number;
  notes?: string;
}

export interface CreateWarehouseTransferPayload {
  sourceType: "Warehouse";
  sourceWarehouseId: string;
  destinationStorefrontId: string;
  lineItems: TransferLineItem[];
  transferDate?: string;
  notes?: string;
}

interface CreateWarehouseTransferResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const createWarehouseTransfer = async (
  payload: CreateWarehouseTransferPayload
): Promise<CreateWarehouseTransferResponse> => {
  try {
    const response = await axios.post("/transfer", payload);
    return {
      success: true,
      message: "Transfer created successfully",
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error creating transfer:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to create transfer",
    };
  }
};

