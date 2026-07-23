import axios from "../axios";

export interface UpdateStorefrontProfilePayload {
  storefrontCode?: string;
  storefrontName?: string;
  storefrontAddress?: string;
  storefrontPhone?: string;
  storefrontEmail?: string;
  managerName?: string;
  status?: "active" | "inactive";
  description?: string;
  notes?: string;
}

interface UpdateStorefrontProfileResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updateStorefrontProfile = async (
  storefrontId: string,
  profileData: UpdateStorefrontProfilePayload
): Promise<UpdateStorefrontProfileResponse> => {
  try {
    const response = await axios.patch(
      `/storefront-profile/${storefrontId}`,
      profileData
    );

    return {
      success: true,
      message: "Storefront profile updated successfully",
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error updating storefront profile:", error);

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
