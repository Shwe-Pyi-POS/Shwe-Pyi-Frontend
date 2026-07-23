import axios from "../axios";

interface DeleteSupplierResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const deleteSupplier = async (
  supplierId: string
): Promise<DeleteSupplierResponse> => {
  try {
    const response = await axios.delete(`/supplier-profile/${supplierId}`);

    return {
      success: true,
      message: "Supplier permanently deleted successfully",
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error deleting supplier:", error);

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
