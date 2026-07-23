import axios from "../axios";

export interface UpdateProductStatusPayload {
  status: "active" | "inactive";
}

interface UpdateProductStatusResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Update product status via API
 * @param {string} productId - The ID of the product to update
 * @param {UpdateProductStatusPayload} payload - Status data
 * @returns {Promise<UpdateProductStatusResponse>} Response from API
 */
export const updateProductStatus = async (
  productId: string,
  payload: UpdateProductStatusPayload,
): Promise<UpdateProductStatusResponse> => {
  try {
    const response = await axios.patch(`/inventory/${productId}`, payload);

    return response.data;
  } catch (error) {
    console.error("Error updating product status:", error);

    if (axios.isAxiosError(error)) {
      if (
        error.response &&
        error.response.headers["content-type"] &&
        error.response.headers["content-type"].includes("text/html")
      ) {
        throw new Error(
          `API endpoint not found. Please check if the API is running and the endpoint "${error.config?.url}" is correct.`,
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
          "Network error: Unable to reach the API. Please check if the API server is running.",
        );
      }
    }

    throw error;
  }
};
