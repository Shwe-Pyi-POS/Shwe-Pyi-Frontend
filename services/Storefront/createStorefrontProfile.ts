import axios from "../axios";

interface CreateStorefrontProfilePayload {
  storefrontCode: string;
  storefrontName: string;
  storefrontAddress: string;
  storefrontPhone: string;
  storefrontEmail?: string;
  managerName?: string;
  status?: "active" | "inactive";
  description?: string;
  notes?: string;
}

interface CreateStorefrontProfileResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const createStorefrontProfile = async (
  payload: CreateStorefrontProfilePayload
): Promise<CreateStorefrontProfileResponse> => {
  try {
    const response = await axios.post("/storefront-profile", payload);
    return {
      success: true,
      message: "Storefront profile created successfully",
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error creating storefront profile:", error);
    throw new Error(
      error.response?.data?.message || "Failed to create storefront profile"
    );
  }
};
