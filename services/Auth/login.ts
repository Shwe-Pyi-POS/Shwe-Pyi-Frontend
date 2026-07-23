import axios from "../axios";

export interface LoginPayload {
  name: string;
  password: string;
}

export interface AdminData {
  name: string;
  role: string;
  locationId: any;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    admin: AdminData;
    token: string;
  };
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  try {
    const response = await axios.post("/admin/login", payload);
    console.log("Login response:", response);
    return response.data;
  } catch (error: any) {
    console.error("Error logging in:", error.response.data.message);
    throw new Error(error.response?.data?.message || "Failed to login");
  }
};
