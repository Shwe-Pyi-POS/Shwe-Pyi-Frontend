import axios from "../axios";

export interface UpdateStorefrontStockQuantityPayload {
  quantityChange: number; // Positive for increase, negative for decrease
  reason: string;
}

interface UpdateStorefrontStockQuantityResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Update storefront stock quantity
 * @param {string} stockRecordId - The ID of the stock record
 * @param {UpdateStorefrontStockQuantityPayload} payload - The quantity change and reason
 * @returns {Promise<UpdateStorefrontStockQuantityResponse>} Response from API
 */
export const updateStorefrontStockQuantity = async (
  stockRecordId: string,
  payload: UpdateStorefrontStockQuantityPayload
): Promise<UpdateStorefrontStockQuantityResponse> => {
  try {
    const response = await axios.patch(
      `/storefront-inventory/${stockRecordId}/quantity`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating storefront stock quantity:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to update storefront stock quantity",
    };
  }
};

