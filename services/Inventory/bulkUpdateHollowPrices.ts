import axios from "../axios";

interface BulkUpdateResponse {
  success: boolean;
  message: string;
  data?: {
    updatedCount: number;
  };
}

/**
 * Bulk update per-kg prices for all hollow category products
 */
export const bulkUpdateHollowPrices = async (payload: {
  buyingPricePerKg?: number;
  sellingPricePerKg?: number;
}): Promise<BulkUpdateResponse> => {
  try {
    const response = await axios.patch("/inventory/bulk-update-hollow-prices", payload);
    return response.data;
  } catch (error) {
    console.error("Error bulk updating hollow prices:", error);

    if (axios.isAxiosError(error)) {
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
