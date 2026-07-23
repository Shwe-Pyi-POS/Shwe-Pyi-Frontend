import axios from "../axios";

export interface SoftDeleteAdminAccountResponse {
  success: boolean;
  message: string;
  data: {
    accountId: string;
    name: string;
  };
}

export const softDeleteAdminAccount = async (
  accountId: string
): Promise<SoftDeleteAdminAccountResponse> => {
  try {
    const response = await axios.patch(`/admin/soft-delete/${accountId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error soft deleting admin account:", error);
    throw new Error(
      error.response?.data?.message || "Failed to deactivate account"
    );
  }
};

