import axios from "../axios";

interface TransferLineItem {
  productCode: string;
  quantity: number;
}

interface TransferGRNRequest {
  sourceType: "GRN";
  grnId: string;
  destinationWarehouseId: string;
  lineItems: TransferLineItem[];
  transferDate: string;
  notes?: string;
}

interface TransferGRNResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const transferGRN = async (
  data: TransferGRNRequest
): Promise<TransferGRNResponse> => {
  try {
    const response = await axios.post("/transfer", data);

    return response.data;
  } catch (error: any) {
    console.error("Error transferring GRN:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to transfer GRN",
    };
  }
};
