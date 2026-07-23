import axios from "../axios";

export interface TransferInventoryToStorefrontPayload {
  inventoryIds: string[];
  storefrontId: string;
}

interface TransferInventoryToStorefrontResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Transfer multiple inventory items to a storefront
 * @param {TransferInventoryToStorefrontPayload} payload - Transfer payload with inventory IDs and storefront ID
 * @returns {Promise<TransferInventoryToStorefrontResponse>} Response from API
 */
export const transferInventoryToStorefront = async (
  payload: TransferInventoryToStorefrontPayload
): Promise<TransferInventoryToStorefrontResponse> => {
  try {
    const response = await axios.post("/storefront-inventory", payload);
    return response.data;
  } catch (error: any) {
    console.error("Error transferring inventory to storefront:", error);

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
