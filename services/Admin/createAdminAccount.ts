import axios from "../axios";

export interface CreateAdminAccountPayload {
  name: string;
  password: string;
  confirmPassword: string;
  locationId?: string;
  role: string;
}

export interface CreateAdminAccountResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const createAdminAccount = async (
  payload: CreateAdminAccountPayload
): Promise<CreateAdminAccountResponse> => {
  try {
    const response = await axios.post("/admin/signup", payload);
    return response.data;
  } catch (error: any) {
    console.error("Error creating admin account:", error);
    throw new Error(
      error.response?.data?.message || "Failed to create account"
    );
  }
};

