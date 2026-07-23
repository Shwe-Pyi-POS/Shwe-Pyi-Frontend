import axios from "../axios";

interface FetchCategoriesResponse {
  success: boolean;
  message: string;
  data: string[];
}

/**
 * Fetch all inventory categories
 * @returns {Promise<FetchCategoriesResponse>} Response from API
 */
export const fetchCategories = async (): Promise<FetchCategoriesResponse> => {
  try {
    const response = await axios.get("/inventory/categories");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch categories",
      data: [],
    };
  }
};
