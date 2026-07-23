import axios from "../axios";

interface GRNLineItem {
  productCode: string;
  goodQuantity: number;
  badQuantity: number;
}

interface CreateGRNRequest {
  purchasingId: string;
  lineItems: GRNLineItem[];
  grnDate: string;
  notes: string;
}

interface CreateGRNResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const createGRN = async (
  data: CreateGRNRequest
): Promise<CreateGRNResponse> => {
  try {
    const response = await axios.post("/grn", data);

    return response.data;
  } catch (error: any) {
    console.error("Error creating GRN:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create GRN",
    };
  }
};
