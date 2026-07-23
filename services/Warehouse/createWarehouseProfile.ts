import axios from "../axios";

/**
 * Create a new warehouse profile via API
 * @param {Object} profileData - Warehouse profile data matching API schema
 * @returns {Promise<Object>} Response from API
 */
export const createWarehouseProfile = async (profileData) => {
  try {
    const response = await axios.post("/warehouse-profile", profileData);

    return response.data;
  } catch (error) {
    console.error("Error creating warehouse profile:", error);

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
