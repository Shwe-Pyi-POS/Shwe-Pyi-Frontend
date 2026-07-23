import axios from "../axios";

interface LineItemUpdate {
  lineItemId: string;
  goodQuantity: number;
  badQuantity: number;
  notes?: string;
}

interface UpdateGRNLineItemsRequest {
  lineItems: LineItemUpdate[];
}

interface UpdateGRNLineItemsResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updateGRNLineItems = async (
  grnId: string,
  lineItems: LineItemUpdate[]
): Promise<UpdateGRNLineItemsResponse> => {
  try {
    const response = await axios.patch(`/grn/${grnId}/line-items`, {
      lineItems,
    } as UpdateGRNLineItemsRequest);

    return response.data;
  } catch (error: any) {
    console.error("Error updating GRN line items:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to update GRN line items",
      data: null,
    };
  }
};
