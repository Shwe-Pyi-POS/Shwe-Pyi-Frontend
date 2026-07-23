import axios from "../axios";

interface TransferLineItem {
  productCode: string;
  quantity: number;
}

export interface TransferGRNToStorefrontRequest {
  sourceType: "GRN";
  grnId: string;
  destinationStorefrontId: string;
  lineItems: TransferLineItem[];
  transferDate?: string;
  notes?: string;
}

interface TransferGRNToStorefrontResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const transferGRNToStorefront = async (
  data: TransferGRNToStorefrontRequest
): Promise<TransferGRNToStorefrontResponse> => {
  try {
    const response = await axios.post("/transfer", data);
    return response.data;
  } catch (error: any) {
    console.error("Error transferring GRN to storefront:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to transfer GRN to storefront",
    };
  }
};
