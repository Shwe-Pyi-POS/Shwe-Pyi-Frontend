import axios from "../axios";

export interface UpdateWarehouseProfilePayload {
  warehouseCode?: string;
  warehouseName?: string;
  warehouseAddress?: string;
  warehousePhone?: string;
  warehouseEmail?: string;
  managerName?: string;
  status?: "active" | "inactive";
  description?: string;
  notes?: string;
}

interface UpdateWarehouseProfileResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updateWarehouseProfile = async (
  warehouseId: string,
  profileData: UpdateWarehouseProfilePayload
): Promise<UpdateWarehouseProfileResponse> => {
  try {
    const response = await axios.patch(
      `/warehouse-profile/${warehouseId}`,
      profileData
    );

    return response.data;
  } catch (error: any) {
    console.error("Error updating warehouse profile:", error);

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
