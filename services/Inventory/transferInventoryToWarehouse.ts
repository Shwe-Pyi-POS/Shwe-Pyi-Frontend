import axios from "../axios";

export interface TransferInventoryToWarehousePayload {
  inventoryIds: string[];
  warehouseId: string;
}

interface TransferInventoryToWarehouseResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Transfer multiple inventory items to a warehouse
 * @param {TransferInventoryToWarehousePayload} payload - Transfer payload with inventory IDs and warehouse ID
 * @returns {Promise<TransferInventoryToWarehouseResponse>} Response from API
 */
export const transferInventoryToWarehouse = async (
  payload: TransferInventoryToWarehousePayload
): Promise<TransferInventoryToWarehouseResponse> => {
  try {
    const response = await axios.post("/warehouse", payload);
    return response.data;
  } catch (error: any) {
    console.error("Error transferring inventory to warehouse:", error);

    if (axios.isAxiosError(error)) {
      if (
        error.response &&
        error.response.headers["content-type"] &&
        error.response.headers["content-type"].includes("text/html")
      ) {
        throw new Error(
          `API endpoint not found. Please check if the API is running and the endpoint "${error.config?.url}" is correct.`
        );
      }

      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `HTTP error! status: ${error.response.status}`;
        throw new Error(errorMessage);
      }

      if (error.request) {
        throw new Error(
          "Network error: Unable to reach the API. Please check if the API server is running."
        );
      }
    }

    throw error;
  }
};
