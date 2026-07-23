import axios from "../axios";

export interface UpdateWarehouseStockQuantityPayload {
  quantityChange: number; // Positive for increase, negative for decrease
  reason: string;
}

interface UpdateWarehouseStockQuantityResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Update warehouse stock quantity
 * @param {string} stockRecordId - The ID of the stock record
 * @param {UpdateWarehouseStockQuantityPayload} payload - The quantity change and reason
 * @returns {Promise<UpdateWarehouseStockQuantityResponse>} Response from API
 */
export const updateWarehouseStockQuantity = async (
  stockRecordId: string,
  payload: UpdateWarehouseStockQuantityPayload
): Promise<UpdateWarehouseStockQuantityResponse> => {
  try {
    const response = await axios.patch(
      `/warehouse/${stockRecordId}/quantity`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error("Error updating warehouse stock quantity:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to update warehouse stock quantity",
    };
  }
};

