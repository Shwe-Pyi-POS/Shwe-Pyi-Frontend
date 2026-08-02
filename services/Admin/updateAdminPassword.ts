import axios from "../axios";

export interface UpdateAdminPasswordResponse {
  success: boolean;
  message: string;
}

export const updateAdminPassword = async (
  accountId: string,
  payload: { newPassword: string; confirmPassword: string }
): Promise<UpdateAdminPasswordResponse> => {
  try {
    const response = await axios.patch(`/admin/update-password/${accountId}`, payload);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Failed to update account password"
    );
  }
};
