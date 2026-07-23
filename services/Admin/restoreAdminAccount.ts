import axios from "../axios";

export interface RestoreAdminAccountResponse {
  success: boolean;
  message: string;
  data: {
    accountId: string;
    name: string;
  };
}

export const restoreAdminAccount = async (
  accountId: string
): Promise<RestoreAdminAccountResponse> => {
  try {
    const response = await axios.patch(`/admin/restore/${accountId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error restoring admin account:", error);
    throw new Error(
      error.response?.data?.message || "Failed to restore account"
    );
  }
};

