import axios from "../axios";

export interface DeleteAdminAccountResponse {
  success: boolean;
  message: string;
  data?: {
    accountId?: string;
    name?: string;
  };
}

export const deleteAdminAccount = async (
  accountId: string
): Promise<DeleteAdminAccountResponse> => {
  try {
    const response = await axios.delete(`/admin/${accountId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error deleting admin account:", error);
    throw new Error(
      error.response?.data?.message || "Failed to delete account"
    );
  }
};

