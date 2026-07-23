import axios from "../axios";
import { Supplier } from "../../types";

interface FetchSuppliersResponse {
  success: boolean;
  message: string;
  data: Supplier[];
}

/**
 * Fetch all supplier profiles via API
 * @param {boolean} isDeleted - Optional: Set to true to fetch soft-deleted suppliers
 * @returns {Promise<FetchSuppliersResponse>} Response from API
 */
export const fetchSuppliers = async (
  isDeleted?: boolean
): Promise<FetchSuppliersResponse> => {
  try {
    const url =
      isDeleted !== undefined
        ? `/supplier-profile?isDeleted=${isDeleted}`
        : "/supplier-profile";
    const response = await axios.get(url);

    return response.data;
  } catch (error) {
    console.error("Error fetching suppliers:", error);

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
